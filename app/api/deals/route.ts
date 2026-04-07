import { NextRequest, NextResponse } from "next/server";
import { fetchHypdProducts } from "@/lib/integrations/hypd";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { scrapeMarketplaceDeals } from "@/lib/integrations/marketplace-scraper";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { ensureAutomaticRefresh, getRefreshStatus } from "@/lib/runtime/refresh-state";
import { InternetDeal } from "@/lib/types";

const supportedMarketplaces: InternetDeal["marketplace"][] = [
  "Myntra",
  "Amazon",
  "Flipkart",
  "Shopsy",
  "Ajio",
  "Nykaa"
];

function emptyMarketplaceBoards() {
  return supportedMarketplaces.reduce<Record<string, InternetDeal[]>>((acc, m) => {
    acc[m] = [];
    return acc;
  }, {});
}

/** Convert HYPD hot-selling products into InternetDeal format so the deals page always has content */
function hypdProductsToDeals(hypd: Awaited<ReturnType<typeof fetchHypdProducts>>): InternetDeal[] {
  if (hypd.status !== "live" || !hypd.hotSellingProducts.length) return [];

  const now = new Date().toISOString();
  return hypd.hotSellingProducts.map((p) => ({
    id: `hypd-${p.id}`,
    marketplace: "Myntra" as const, // HYPD Store products — show under a known marketplace
    canonicalUrl: p.productUrl ?? "",
    originalUrl: p.productUrl ?? "",
    title: p.title,
    category: "HYPD Store",
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

export async function GET(request: NextRequest) {
  await ensureAutomaticRefresh("api-deals");
  const { searchParams } = new URL(request.url);
  const marketplace = searchParams.get("marketplace");
  const minPrice = Number(searchParams.get("minPrice") ?? "0");
  const maxPrice = Number(searchParams.get("maxPrice") ?? "999999");

  // Fetch from all sources in parallel: Telegram, HYPD, marketplace scraper
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

  // Convert HYPD trending products into deal format
  const hypdDeals = hypdProductsToDeals(hypd);

  // Merge all sources
  const allDeals = [...telegram.deals, ...scraped.deals, ...hypdDeals];

  const filteredDeals = allDeals.filter((deal) => {
    const marketplaceMatch = !marketplace || marketplace === "All" || deal.marketplace === marketplace;
    const price = deal.currentPrice ?? 0;
    // For deals without price (HYPD products), include them if no price filter is active
    const priceMatch = deal.currentPrice === null || (price >= minPrice && price <= maxPrice);
    return marketplaceMatch && priceMatch;
  });

  // Build top deals by marketplace, merging all sources
  const topDealsByMarketplace: Record<string, InternetDeal[]> = { ...emptyMarketplaceBoards() };
  for (const deal of allDeals) {
    if (supportedMarketplaces.includes(deal.marketplace as InternetDeal["marketplace"])) {
      if (!topDealsByMarketplace[deal.marketplace]) {
        topDealsByMarketplace[deal.marketplace] = [];
      }
      topDealsByMarketplace[deal.marketplace].push(deal);
    }
  }

  // Sort each marketplace's deals by score and limit to top 10
  for (const key of Object.keys(topDealsByMarketplace)) {
    topDealsByMarketplace[key] = topDealsByMarketplace[key]
      .sort((a, b) => b.score - a.score)
      .slice(0, 10);
  }

  // Override with Telegram data if it has more deals
  const telegramBoards = telegram.topDealsByMarketplace;
  for (const [key, deals] of Object.entries(telegramBoards)) {
    if (deals.length > (topDealsByMarketplace[key]?.length ?? 0)) {
      topDealsByMarketplace[key] = deals;
    }
  }

  return NextResponse.json({
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
  });
}
