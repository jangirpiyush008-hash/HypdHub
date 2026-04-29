import { NextRequest, NextResponse } from "next/server";
import { fetchHypdProducts } from "@/lib/integrations/hypd";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { fetchTelegramWebDeals } from "@/lib/scraper/telegram-web";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { ensureAutomaticRefresh, getRefreshStatus, recordRefreshSuccess } from "@/lib/runtime/refresh-state";
import { InternetDeal } from "@/lib/types";
import { generateHypdConversion } from "@/lib/hypd-links";
import { fetchCurrentHypdCreator, getStoredHypdCookies } from "@/lib/hypd-server";
import { fetchDealsFromDb, upsertDeals } from "@/lib/scraper/supabase-deals";
import { convertDealsForCreator } from "@/lib/deals/creator-links";

// On-demand refresh window. If the last refresh is older than this
// when a request lands, we trigger an inline scrape and serve the
// fresh result. The GH Actions cron runs at the same cadence as a
// fallback for when no one's visiting the site.
const REFRESH_WINDOW_MS = 2 * 60 * 60 * 1000;

// Module-level guard so two concurrent stale requests don't both
// kick off a scrape. The first one runs, others wait on the same
// promise.
let pendingRefresh: Promise<void> | null = null;

/**
 * Fire the GitHub Actions "Scrape marketplaces" workflow — the canonical
 * 2-hour pipeline that runs both Nova (Meesho/Ajio/Nykaa) and the
 * Telegram web-scraper (Flipkart/Myntra/Shopsy) in parallel. Triggering
 * via workflow_dispatch means we get the same machinery the cron uses,
 * on GH's runners where Playwright actually works — instead of trying
 * to boot Chromium inside a Vercel function (which would blow the 60s
 * timeout).
 *
 * Requires two env vars to be active:
 *   - GH_DISPATCH_TOKEN: a fine-scoped GitHub PAT with `actions:write`
 *     on this repo.
 *   - GH_DISPATCH_REPO: e.g. "jangirpiyush008-hash/HypdHub"
 *
 * Without those, the dispatch is a silent no-op — the in-process
 * Telegram refresh below still runs as the fallback.
 */
async function dispatchScrapeWorkflow(): Promise<boolean> {
  const token = process.env.GH_DISPATCH_TOKEN;
  const repo = process.env.GH_DISPATCH_REPO;
  if (!token || !repo) return false;
  try {
    const res = await fetch(`https://api.github.com/repos/${repo}/actions/workflows/scrape.yml/dispatches`, {
      method: "POST",
      headers: {
        "authorization": `Bearer ${token}`,
        "accept": "application/vnd.github+json",
        "content-type": "application/json",
        "x-github-api-version": "2022-11-28",
      },
      body: JSON.stringify({ ref: "main" }),
      signal: AbortSignal.timeout(8_000),
    });
    return res.status === 204; // GitHub returns 204 No Content on success
  } catch {
    return false;
  }
}

async function refreshDealsInline(): Promise<void> {
  if (pendingRefresh) return pendingRefresh;
  pendingRefresh = (async () => {
    try {
      // 1) Fire the GH workflow — runs Nova + Telegram in parallel on the
      //    runner. Fresh deals show up in Supabase 2-4 minutes later.
      //    Non-blocking — we don't wait for the workflow to finish.
      const dispatched = await dispatchScrapeWorkflow();

      // 2) Run the Telegram web-scraper IN-PROCESS as well so users
      //    refreshing right now get fresh Flipkart/Myntra/Shopsy deals
      //    in ~25s without waiting 4 minutes for the GH workflow. The
      //    workflow's run will overwrite these with the same/fresher
      //    batch when it lands; that's fine because both paths use
      //    delete-then-insert.
      const tg = await fetchTelegramWebDeals();
      if (tg.length) await upsertDeals(tg, "telegram");

      const reason = dispatched ? "on-demand+gh-dispatch" : "on-demand-tg-only";
      await recordRefreshSuccess(reason, tg.length, tg.length);
    } catch (e) {
      console.warn("[deals] on-demand refresh failed:", e instanceof Error ? e.message : String(e));
    } finally {
      pendingRefresh = null;
    }
  })();
  return pendingRefresh;
}

const supportedMarketplaces: InternetDeal["marketplace"][] = [
  "Myntra", "Meesho", "Flipkart", "Shopsy", "Ajio", "Nykaa", "HYPD"
];

// Default category URLs per marketplace (used when deal doesn't have one)
const MARKETPLACE_CATEGORY_URLS: Record<string, string> = {
  Myntra: "https://www.myntra.com/shop/best-sellers",
  Meesho: "https://www.meesho.com/deals",
  Flipkart: "https://www.flipkart.com/offers-store",
  Shopsy: "https://www.shopsy.in/deals",
  Ajio: "https://www.ajio.com/sale",
  Nykaa: "https://www.nykaa.com/sp/deals-page/deals",
  HYPD: "https://hypd.store",
};

function ensureCategoryUrl(deal: InternetDeal): InternetDeal {
  if (deal.categoryUrl && deal.categoryUrl !== deal.originalUrl) return deal;
  return {
    ...deal,
    categoryUrl: MARKETPLACE_CATEGORY_URLS[deal.marketplace] || deal.originalUrl,
  };
}

function cleanDeals(deals: InternetDeal[]): InternetDeal[] {
  const seenKeys = new Set<string>();
  return deals.filter((deal) => {
    if (deal.marketplace === "HYPD") return true;
    if (!deal.currentPrice || deal.currentPrice <= 0) return false;
    if (!deal.title || deal.title.length < 5) return false;
    if (/loot\s*:/i.test(deal.title) || /at\s+\d+\.\s*$/i.test(deal.title)) return false;

    // Deduplicate by URL first (more precise), then by title
    const urlKey = (deal.originalUrl || deal.canonicalUrl || "").replace(/https?:\/\//, "").split("?")[0];
    const titleKey = deal.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = urlKey || titleKey;
    if (seenKeys.has(key)) return false;
    seenKeys.add(key);
    // Also track title to prevent title duplicates from different sources
    if (seenKeys.has(titleKey)) return false;
    seenKeys.add(titleKey);
    return true;
  });
}

function convertDealLinksToHypd(
  deals: InternetDeal[],
  creatorUsername: string,
  creatorHypdUserId?: string,
): InternetDeal[] {
  return deals.map((deal) => {
    const url = deal.originalUrl || deal.canonicalUrl;
    if (!url) return deal;

    try {
      // Pass creatorHypdUserId so af_siteid is THIS creator's id, not the
      // generic HYPD pool fallback. That's the part that makes every
      // logged-in creator's deal link unique to them — sales attribute
      // back to the right creator even if HYPD's cookie session expires.
      const conversion = generateHypdConversion(url, creatorUsername, {
        creatorHypdUserId,
      });
      if (!conversion || conversion.marketplace === "Unsupported") return deal;

      const hypdLink = conversion.expandedLink || deal.originalUrl;
      const shortLink = conversion.shortLink || hypdLink;

      let convertedCategoryUrl = deal.categoryUrl;
      if (deal.categoryUrl && deal.categoryUrl !== url) {
        try {
          const catConversion = generateHypdConversion(deal.categoryUrl, creatorUsername, {
            creatorHypdUserId,
          });
          if (catConversion && catConversion.marketplace !== "Unsupported") {
            convertedCategoryUrl = catConversion.expandedLink || deal.categoryUrl;
          }
        } catch { /* keep original */ }
      } else if (deal.categoryUrl) {
        convertedCategoryUrl = hypdLink;
      }

      return {
        ...deal,
        canonicalUrl: hypdLink,
        originalUrl: hypdLink,
        affiliateShortLink: shortLink,
        categoryUrl: convertedCategoryUrl,
      };
    } catch {
      return deal;
    }
  });
}

function emptyMarketplaceBoards() {
  return supportedMarketplaces.reduce<Record<string, InternetDeal[]>>((acc, m) => {
    acc[m] = [];
    return acc;
  }, {});
}

function hypdProductsToDeals(hypd: Awaited<ReturnType<typeof fetchHypdProducts>>): InternetDeal[] {
  if (hypd.status !== "live" || !hypd.hotSellingProducts.length) return [];
  const now = new Date().toISOString();
  return hypd.hotSellingProducts.map((p) => ({
    id: `hypd-${p.id}`,
    marketplace: "HYPD" as const,
    canonicalUrl: p.productUrl ?? "",
    originalUrl: p.productUrl ?? "",
    title: p.title,
    category: p.brandName || "HYPD Store",
    imageUrl: p.imageUrl ?? null,
    currentPrice: null,
    originalPrice: null,
    discountPercent: null,
    mentionsCount: p.orderCount,
    channelsCount: 1,
    channelNames: ["HYPD Trending"],
    firstSeenAt: now,
    lastSeenAt: now,
    freshnessHours: 0,
    score: 50 + p.orderCount,
    validationStatus: "validated" as const,
    stockStatus: "in_stock" as const,
    sourceEvidence: ["HYPD hot-selling API"],
    confidenceScore: 80,
  }));
}

// Per-creator cache for 5 minutes
const convertedCache = new Map<string, { data: unknown; fetchedAt: number }>();
const DEALS_CACHE_MS = 5 * 60_000;

/** Called by /api/refresh POST — wipes the per-creator cache so the next /deals GET re-fetches. */
export function clearDealsCache() {
  convertedCache.clear();
}

export async function GET(request: NextRequest) {
  const now = Date.now();
  const { searchParams } = new URL(request.url);
  const marketplace = searchParams.get("marketplace");
  const minPrice = Number(searchParams.get("minPrice") ?? "0");
  const maxPrice = Number(searchParams.get("maxPrice") ?? "999999");
  const bustCache = searchParams.get("refresh") === "1";

  // STALENESS-AWARE BACKGROUND REFRESH:
  //   If the last refresh is older than 2hrs, kick off a fresh scrape
  //   IN THE BACKGROUND and return the current DB contents immediately.
  //   The user never waits — the scrape just updates the DB so the
  //   NEXT request sees fresh deals. A module-level pendingRefresh
  //   promise dedupes concurrent triggers so the scrape only runs once
  //   per window even under load.
  //
  //   ?refresh=1 still forces a synchronous scrape for explicit "give
  //   me fresh deals NOW" buttons.
  const status = await getRefreshStatus();
  const lastMs = status.lastRefreshAt ? new Date(status.lastRefreshAt).getTime() : 0;
  const isStale = !lastMs || now - lastMs > REFRESH_WINDOW_MS;
  if (bustCache) {
    await refreshDealsInline();
  } else if (isStale) {
    void refreshDealsInline().catch(() => { /* logged inside */ });
  }

  const creator = await fetchCurrentHypdCreator().catch(() => null);
  const creatorUsername = creator?.hypdUsername ?? "hypdhub";
  const creatorCookies = creator ? await getStoredHypdCookies() : [];

  const creatorCacheKey = `${creatorUsername}:${marketplace ?? "All"}:${minPrice}:${maxPrice}`;
  const cached = convertedCache.get(creatorCacheKey);
  if (!bustCache && cached && now - cached.fetchedAt < DEALS_CACHE_MS) {
    return NextResponse.json(cached.data);
  }

  // PRIMARY SOURCE: Supabase database (populated by the GH Actions
  // scraper worker on an hourly cron). Reading from DB is fast — no
  // Nova boot, no IP-blocked marketplace requests on the request path.
  const [dbDeals, telegram, history, refresh, hypd] = await Promise.all([
    fetchDealsFromDb(),
    fetchTelegramDeals().catch(() => ({ deals: [] as InternetDeal[], topDealsByMarketplace: {} as Record<string, InternetDeal[]> })),
    getDealHistorySummary(),
    getRefreshStatus(),
    fetchHypdProducts().catch(() => ({
      status: "error" as const,
      notes: [] as string[],
      hotSellingProducts: [] as Awaited<ReturnType<typeof fetchHypdProducts>>["hotSellingProducts"],
      hotSellingBrands: [] as Awaited<ReturnType<typeof fetchHypdProducts>>["hotSellingBrands"],
      marketplaceCommissions: [] as Awaited<ReturnType<typeof fetchHypdProducts>>["marketplaceCommissions"],
      stats: { sales: null, orders: null, withdrawable: null, pending: null },
      lastSyncedAt: null as string | null
    })),
  ]);
  const scraped = { deals: [] as InternetDeal[], sources: ["GitHub Actions worker (hourly)"], scrapedAt: new Date().toISOString() };

  // HYPD storefront products are kept off the public deal feed — the
  // hot-selling API surfaces order-count rankings without reliable
  // current/original price data, so it can't honestly compete with
  // marketplace deals on "cheapest / biggest discount" sorting.
  // (Still fetched above so the dashboard's brand/commission widgets
  // can use it; just not merged into the deal list.)
  const hypdDeals: InternetDeal[] = [];

  const rawDeals = [...dbDeals, ...telegram.deals, ...scraped.deals, ...hypdDeals];

  const cleaned = cleanDeals(rawDeals);
  const withCategory = cleaned.map(ensureCategoryUrl);

  // SYNC-ONLY conversion for the initial page render.
  //
  // The previous flow called HYPD's /deeplink API for every unique URL
  // on every cold-cache load — at concurrency 6 that's ~8s of sequential
  // round-trips for 100 deals. Users were waiting forever on /deals.
  //
  // The synchronous generator (generateHypdConversion) already produces
  // a fully-functional creator link: it embeds creator.hypdUserId as
  // af_siteid (the part that actually controls attribution), generates
  // a deterministic clickid from the source URL, and builds the
  // expanded product_id-stamped marketplace URL. The HYPD API call
  // adds nothing the synchronous version doesn't already have, except
  // a server-issued random clickid — which HYPD's redirect re-stamps
  // anyway when the user actually clicks the link.
  //
  // So: render instantly with sync links. Click-time still flows through
  // hypd.store/<creator>/afflink/<id>, which the upstream redirect
  // resolves to the real tracked URL. Attribution lands on the creator
  // either way.
  const allDeals = convertDealLinksToHypd(
    withCategory,
    creatorUsername,
    creator?.hypdUserId,
  );

  const filteredDeals = allDeals.filter((deal) => {
    const marketplaceMatch = !marketplace || marketplace === "All" || deal.marketplace === marketplace;
    const price = deal.currentPrice ?? 0;
    const priceMatch = deal.currentPrice === null || (price >= minPrice && price <= maxPrice);
    return marketplaceMatch && priceMatch;
  });

  const topDealsByMarketplace: Record<string, InternetDeal[]> = { ...emptyMarketplaceBoards() };
  for (const deal of allDeals) {
    if (supportedMarketplaces.includes(deal.marketplace as InternetDeal["marketplace"])) {
      if (!topDealsByMarketplace[deal.marketplace]) {
        topDealsByMarketplace[deal.marketplace] = [];
      }
      topDealsByMarketplace[deal.marketplace].push(deal);
    }
  }

  const isLoggedIn = creatorUsername !== "hypdhub";
  const dealsPerMarketplace = isLoggedIn ? 10 : 3;

  for (const key of Object.keys(topDealsByMarketplace)) {
    topDealsByMarketplace[key] = topDealsByMarketplace[key]
      .sort((a, b) => {
        // Cheapest-first. Items with no price (e.g. HYPD) sink to the bottom.
        const ap = a.currentPrice;
        const bp = b.currentPrice;
        if (ap == null && bp == null) return b.score - a.score;
        if (ap == null) return 1;
        if (bp == null) return -1;
        return ap - bp;
      })
      .slice(0, dealsPerMarketplace);
  }

  // Strip source-revealing fields from every deal so the client and any
  // network inspector see only marketplace attribution. Aggregator names,
  // Telegram references, and "agent"/"sync" tags never reach the browser.
  const sanitizeDeal = (d: InternetDeal): InternetDeal => ({
    ...d,
    channelNames: [d.marketplace],
    sourceEvidence: undefined,
  });
  const sanitizedDeals = filteredDeals.map(sanitizeDeal);
  const sanitizedTopByMp: Record<string, InternetDeal[]> = {};
  for (const [mp, list] of Object.entries(topDealsByMarketplace)) {
    sanitizedTopByMp[mp] = list.map(sanitizeDeal);
  }

  const responseData = {
    generatedAt: new Date().toISOString(),
    refreshWindowHours: 2,
    isLoggedIn,
    creatorUsername,
    deals: sanitizedDeals,
    topDealsByMarketplace: sanitizedTopByMp,
    // Single, generic count. No per-source breakdown leaks here.
    totalDealsCount: filteredDeals.length,
    history,
    refresh,
    hypd
  };

  convertedCache.set(creatorCacheKey, { data: responseData, fetchedAt: now });
  return NextResponse.json(responseData);
}
