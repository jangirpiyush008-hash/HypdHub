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

export async function GET(request: NextRequest) {
  await ensureAutomaticRefresh("api-deals");
  const { searchParams } = new URL(request.url);
  const marketplace = searchParams.get("marketplace");
  const minPrice = Number(searchParams.get("minPrice") ?? "0");
  const maxPrice = Number(searchParams.get("maxPrice") ?? "999999");

  // Fetch from all sources in parallel: Telegram, HYPD, marketplace scraper
  const [telegram, history, refresh, hypd, scraped] = await Promise.all([
    fetchTelegramDeals(),
    getDealHistorySummary(),
    getRefreshStatus(),
    fetchHypdProducts(),
    scrapeMarketplaceDeals().catch(() => ({ deals: [], sources: [], scrapedAt: new Date().toISOString() }))
  ]);

  // Merge Telegram deals with scraped marketplace deals
  const allDeals = [...telegram.deals, ...scraped.deals];

  const filteredDeals = allDeals.filter((deal) => {
    const marketplaceMatch = !marketplace || marketplace === "All" || deal.marketplace === marketplace;
    const price = deal.currentPrice ?? 0;
    const priceMatch = price >= minPrice && price <= maxPrice;
    return marketplaceMatch && priceMatch;
  });

  // Build top deals by marketplace, merging both sources
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
    scrapedSources: scraped.sources,
    history,
    refresh,
    hypd
  });
}
