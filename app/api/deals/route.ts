import { NextRequest, NextResponse } from "next/server";
import { getTopDealsByMarketplace, rankDeals } from "@/lib/deals/ranking";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { ensureAutomaticRefresh, getRefreshStatus } from "@/lib/runtime/refresh-state";

export async function GET(request: NextRequest) {
  await ensureAutomaticRefresh("api-deals");
  const { searchParams } = new URL(request.url);
  const marketplace = searchParams.get("marketplace");
  const minPrice = Number(searchParams.get("minPrice") ?? "0");
  const maxPrice = Number(searchParams.get("maxPrice") ?? "999999");

  const ranked = rankDeals().filter((deal) => {
    const marketplaceMatch = !marketplace || marketplace === "All" || deal.source === marketplace;
    const priceMatch = deal.price >= minPrice && deal.price <= maxPrice;
    return marketplaceMatch && priceMatch;
  });

  const [telegram, history, refresh] = await Promise.all([
    fetchTelegramDeals(),
    getDealHistorySummary(),
    getRefreshStatus()
  ]);

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    refreshWindowHours: 2,
    deals: ranked,
    topDealsByMarketplace:
      Object.keys(telegram.topDealsByMarketplace).length > 0
        ? telegram.topDealsByMarketplace
        : getTopDealsByMarketplace(),
    telegramDealsCount: telegram.deals.length,
    validatedDealsCount: telegram.deals.filter((deal) => deal.validationStatus === "validated").length,
    history,
    refresh
  });
}
