import { NextResponse } from "next/server";
import { getTopDealsByMarketplace, rankDeals } from "@/lib/deals/ranking";
import { fetchHypdProducts } from "@/lib/integrations/hypd";
import { fetchMarketplaceSnapshots } from "@/lib/integrations/marketplaces";
import { fetchTelegramDeals, fetchTelegramSignalSummary } from "@/lib/integrations/telegram";
import { ensureAutomaticRefresh, getRefreshStatus } from "@/lib/runtime/refresh-state";

export async function GET() {
  await ensureAutomaticRefresh("api-ranking");

  const [hypd, marketplaces, telegram, telegramDeals, refresh] = await Promise.all([
    fetchHypdProducts(),
    fetchMarketplaceSnapshots(),
    fetchTelegramSignalSummary(),
    fetchTelegramDeals(),
    getRefreshStatus()
  ]);

  return NextResponse.json({
    refreshWindowHours: 2,
    topDeals: rankDeals().slice(0, 10),
    topDealsByMarketplace:
      Object.keys(telegramDeals.topDealsByMarketplace).length > 0
        ? telegramDeals.topDealsByMarketplace
        : getTopDealsByMarketplace(),
    integrations: {
      hypd,
      marketplaces,
      telegram
    },
    refresh
  });
}
