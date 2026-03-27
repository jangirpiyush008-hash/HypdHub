import { NextRequest, NextResponse } from "next/server";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
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
  return supportedMarketplaces.reduce<Record<string, InternetDeal[]>>((accumulator, marketplace) => {
    accumulator[marketplace] = [];
    return accumulator;
  }, {});
}

export async function GET(request: NextRequest) {
  await ensureAutomaticRefresh("api-deals");
  const { searchParams } = new URL(request.url);
  const marketplace = searchParams.get("marketplace");
  const minPrice = Number(searchParams.get("minPrice") ?? "0");
  const maxPrice = Number(searchParams.get("maxPrice") ?? "999999");

  const [telegram, history, refresh] = await Promise.all([
    fetchTelegramDeals(),
    getDealHistorySummary(),
    getRefreshStatus()
  ]);

  const filteredDeals = telegram.deals.filter((deal) => {
    const marketplaceMatch = !marketplace || marketplace === "All" || deal.marketplace === marketplace;
    const price = deal.currentPrice ?? 0;
    const priceMatch = price >= minPrice && price <= maxPrice;
    return marketplaceMatch && priceMatch;
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    refreshWindowHours: 2,
    deals: filteredDeals,
    topDealsByMarketplace:
      Object.keys(telegram.topDealsByMarketplace).length > 0
        ? telegram.topDealsByMarketplace
        : emptyMarketplaceBoards(),
    telegramDealsCount: telegram.deals.length,
    validatedDealsCount: telegram.deals.filter((deal) => deal.validationStatus === "validated").length,
    history,
    refresh
  });
}
