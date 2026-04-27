import { NextRequest, NextResponse } from "next/server";
import { fetchHypdProducts } from "@/lib/integrations/hypd";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { ensureAutomaticRefresh, getRefreshStatus } from "@/lib/runtime/refresh-state";
import { InternetDeal } from "@/lib/types";
import { generateHypdConversion } from "@/lib/hypd-links";
import { fetchCurrentHypdCreator, getStoredHypdCookies } from "@/lib/hypd-server";
import { fetchDealsFromDb } from "@/lib/scraper/supabase-deals";
import { convertDealsForCreator } from "@/lib/deals/creator-links";

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

function convertDealLinksToHypd(deals: InternetDeal[], creatorUsername: string): InternetDeal[] {
  return deals.map((deal) => {
    const url = deal.originalUrl || deal.canonicalUrl;
    if (!url) return deal;

    try {
      // generateHypdConversion now internally cleans competitor params via
      // cleanUrlForHypdSync, so the expanded link will be free of wishlink
      // / earnkaro / etc. junk.
      const conversion = generateHypdConversion(url, creatorUsername);
      if (!conversion || conversion.marketplace === "Unsupported") return deal;

      const hypdLink = conversion.expandedLink || deal.originalUrl;
      const shortLink = conversion.shortLink || hypdLink;

      let convertedCategoryUrl = deal.categoryUrl;
      if (deal.categoryUrl && deal.categoryUrl !== url) {
        try {
          const catConversion = generateHypdConversion(deal.categoryUrl, creatorUsername);
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

  // Fire-and-forget Telegram refresh — don't block the response on it.
  // Marketplace scraping has moved to GitHub Actions (hourly cron) and
  // is read from Supabase below, so the page no longer waits on Nova.
  void ensureAutomaticRefresh("api-deals").catch(() => {});
  const { searchParams } = new URL(request.url);
  const marketplace = searchParams.get("marketplace");
  const minPrice = Number(searchParams.get("minPrice") ?? "0");
  const maxPrice = Number(searchParams.get("maxPrice") ?? "999999");
  const bustCache = searchParams.get("refresh") === "1";

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

  const hypdDeals = hypdProductsToDeals(hypd);

  // Merge: DB deals first (primary), then telegram + scraped + HYPD
  const rawDeals = [...dbDeals, ...telegram.deals, ...scraped.deals, ...hypdDeals];

  const cleaned = cleanDeals(rawDeals);
  const withCategory = cleaned.map(ensureCategoryUrl);

  // If logged in, convert every deal link through HYPD's deeplink API so each
  // link carries THIS creator's attribution (real af_siteid, real clickid,
  // real product_id) instead of the hardcoded generic siteid the sync
  // generator falls back to. Per-creator cache + bounded concurrency keeps
  // this fast on repeat loads.
  const allDeals =
    creator && creatorCookies.length > 0
      ? await convertDealsForCreator(withCategory, creator, creatorCookies)
      : convertDealLinksToHypd(withCategory, creatorUsername);

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

  const responseData = {
    generatedAt: new Date().toISOString(),
    refreshWindowHours: 2,
    isLoggedIn,
    creatorUsername,
    dbDealsCount: dbDeals.length,
    deals: filteredDeals,
    topDealsByMarketplace,
    telegramDealsCount: telegram.deals.length,
    validatedDealsCount: telegram.deals.filter((d) => d.validationStatus === "validated").length,
    scrapedDealsCount: scraped.deals.length,
    hypdDealsCount: hypdDeals.length,
    scrapedSources: scraped.sources,
    history,
    refresh,
    hypd
  };

  convertedCache.set(creatorCacheKey, { data: responseData, fetchedAt: now });
  return NextResponse.json(responseData);
}
