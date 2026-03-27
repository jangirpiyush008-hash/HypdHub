import { NextResponse } from "next/server";
import { fetchHypdProducts } from "@/lib/integrations/hypd";
import { fetchMarketplaceSnapshots } from "@/lib/integrations/marketplaces";
import { fetchTelegramDeals, fetchTelegramSignalSummary } from "@/lib/integrations/telegram";
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

export async function GET() {
  await ensureAutomaticRefresh("api-ranking");

  const [hypd, marketplaces, telegram, telegramDeals, refresh] = await Promise.all([
    fetchHypdProducts(),
    fetchMarketplaceSnapshots(),
    fetchTelegramSignalSummary(),
    fetchTelegramDeals(),
    getRefreshStatus()
  ]);

  const topDeals = Object.values(telegramDeals.topDealsByMarketplace)
    .flat()
    .sort((left, right) => right.score - left.score)
    .slice(0, 10);

  return NextResponse.json({
    refreshWindowHours: 2,
    topDeals,
    topDealsByMarketplace:
      Object.keys(telegramDeals.topDealsByMarketplace).length > 0
        ? telegramDeals.topDealsByMarketplace
        : emptyMarketplaceBoards(),
    integrations: {
      hypd,
      marketplaces,
      telegram
    },
    refresh
  });
}
