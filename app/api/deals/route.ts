import { NextRequest, NextResponse } from "next/server";
import { fetchHypdProducts } from "@/lib/integrations/hypd";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { scrapeMarketplaceDeals } from "@/lib/integrations/marketplace-scraper";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { ensureAutomaticRefresh, getRefreshStatus } from "@/lib/runtime/refresh-state";
import { InternetDeal } from "@/lib/types";
import { generateHypdConversion } from "@/lib/hypd-links";
import { fetchCurrentHypdCreator } from "@/lib/hypd-server";

const supportedMarketplaces: InternetDeal["marketplace"][] = [
  "Myntra", "Amazon", "Flipkart", "Shopsy", "Ajio", "Nykaa", "HYPD"
];

// Default category URLs per marketplace (used when deal doesn't have one)
const MARKETPLACE_CATEGORY_URLS: Record<string, string> = {
  Myntra: "https://www.myntra.com/shop/best-sellers",
  Amazon: "https://www.amazon.in/gp/bestsellers",
  Flipkart: "https://www.flipkart.com/offers-store",
  Shopsy: "https://www.shopsy.in/deals",
  Ajio: "https://www.ajio.com/sale",
  Nykaa: "https://www.nykaa.com/sp/deals-page/deals",
  HYPD: "https://hypd.store",
};

/**
 * Ensure every deal has a categoryUrl.
 * If missing, generate from marketplace defaults.
 */
function ensureCategoryUrl(deal: InternetDeal): InternetDeal {
  if (deal.categoryUrl && deal.categoryUrl !== deal.originalUrl) return deal;
  return {
    ...deal,
    categoryUrl: MARKETPLACE_CATEGORY_URLS[deal.marketplace] || deal.originalUrl,
  };
}

/**
 * Filter out garbage deals: no price, duplicate titles, spam titles
 */
function cleanDeals(deals: InternetDeal[]): InternetDeal[] {
  const seenTitles = new Set<string>();
  return deals.filter((deal) => {
    // Allow HYPD deals without price
    if (deal.marketplace === "HYPD") return true;

    // Must have a price
    if (!deal.currentPrice || deal.currentPrice <= 0) return false;

    // Must have a real title (not spam)
    if (!deal.title || deal.title.length < 5) return false;

    // Skip Telegram-style spam titles
    if (/loot\s*:/i.test(deal.title) || /at\s+\d+\.\s*$/i.test(deal.title)) return false;

    // Deduplicate by normalized title
    const key = deal.title.toLowerCase().replace(/[^a-z0-9]/g, "");
    if (seenTitles.has(key)) return false;
    seenTitles.add(key);

    return true;
  });
}

/**
 * Convert all deal URLs to HYPD affiliate links with proper UTM tracking.
 */
function convertDealLinksToHypd(deals: InternetDeal[], creatorUsername: string): InternetDeal[] {
  return deals.map((deal) => {
    const url = deal.originalUrl || deal.canonicalUrl;
    if (!url) return deal;

    try {
      const conversion = generateHypdConversion(url, creatorUsername);
      if (!conversion || conversion.marketplace === "Unsupported") return deal;

      const hypdLink = conversion.expandedLink || deal.originalUrl;

      // Convert categoryUrl separately (it's a DIFFERENT destination)
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

// Cache deals response for 5 minutes
let dealsCache: { data: unknown; fetchedAt: number } | null = null;
const DEALS_CACHE_MS = 5 * 60_000;

export async function GET(request: NextRequest) {
  const now = Date.now();

  if (dealsCache && now - dealsCache.fetchedAt < DEALS_CACHE_MS) {
    return NextResponse.json(dealsCache.data);
  }

  await ensureAutomaticRefresh("api-deals");
  const { searchParams } = new URL(request.url);
  const marketplace = searchParams.get("marketplace");
  const minPrice = Number(searchParams.get("minPrice") ?? "0");
  const maxPrice = Number(searchParams.get("maxPrice") ?? "999999");

  const creator = await fetchCurrentHypdCreator().catch(() => null);
  const creatorUsername = creator?.hypdUsername ?? "hypdhub";

  const [telegram, history, refresh, hypd, scraped] = await Promise.all([
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
    scrapeMarketplaceDeals().catch(() => ({ deals: [] as InternetDeal[], sources: [] as string[], scrapedAt: new Date().toISOString() }))
  ]);

  const hypdDeals = hypdProductsToDeals(hypd);

  // 1. Merge all sources
  const rawDeals = [...telegram.deals, ...scraped.deals, ...hypdDeals];

  // 2. Clean: remove no-price, duplicates, spam titles
  const cleaned = cleanDeals(rawDeals);

  // 3. Ensure every deal has a categoryUrl (different from originalUrl)
  const withCategory = cleaned.map(ensureCategoryUrl);

  // 4. Convert ALL URLs to HYPD affiliate links
  const allDeals = convertDealLinksToHypd(withCategory, creatorUsername);

  const filteredDeals = allDeals.filter((deal) => {
    const marketplaceMatch = !marketplace || marketplace === "All" || deal.marketplace === marketplace;
    const price = deal.currentPrice ?? 0;
    const priceMatch = deal.currentPrice === null || (price >= minPrice && price <= maxPrice);
    return marketplaceMatch && priceMatch;
  });

  // Build top deals by marketplace — NO Telegram override
  const topDealsByMarketplace: Record<string, InternetDeal[]> = { ...emptyMarketplaceBoards() };
  for (const deal of allDeals) {
    if (supportedMarketplaces.includes(deal.marketplace as InternetDeal["marketplace"])) {
      if (!topDealsByMarketplace[deal.marketplace]) {
        topDealsByMarketplace[deal.marketplace] = [];
      }
      topDealsByMarketplace[deal.marketplace].push(deal);
    }
  }

  // Sort by score and limit to top 10 per marketplace
  for (const key of Object.keys(topDealsByMarketplace)) {
    topDealsByMarketplace[key] = topDealsByMarketplace[key]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  const responseData = {
    generatedAt: new Date().toISOString(),
    refreshWindowHours: 2,
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

  dealsCache = { data: responseData, fetchedAt: now };
  return NextResponse.json(responseData);
}
