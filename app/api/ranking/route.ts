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
  "Nykaa",
  "HYPD"
];

function emptyMarketplaceBoards() {
  return supportedMarketplaces.reduce<Record<string, InternetDeal[]>>((accumulator, marketplace) => {
    accumulator[marketplace] = [];
    return accumulator;
  }, {});
}

// Cache ranking response for 60 seconds
let rankingCache: { data: unknown; fetchedAt: number } | null = null;
const RANKING_CACHE_MS = 60_000;

export async function GET() {
  const now = Date.now();
  if (rankingCache && now - rankingCache.fetchedAt < RANKING_CACHE_MS) {
    return NextResponse.json(rankingCache.data);
  }

  await ensureAutomaticRefresh("api-ranking");

  const [hypd, marketplaces, telegram, telegramDeals, refresh] = await Promise.all([
    fetchHypdProducts().catch(() => ({ status: "error", notes: [] as string[], hotSellingProducts: [], hotSellingBrands: [], marketplaceCommissions: [], stats: { sales: null, orders: null, withdrawable: null, pending: null }, lastSyncedAt: null })),
    fetchMarketplaceSnapshots(),
    fetchTelegramSignalSummary(),
    fetchTelegramDeals().catch(() => ({ deals: [] as InternetDeal[], topDealsByMarketplace: {} as Record<string, InternetDeal[]> })),
    getRefreshStatus()
  ]);

  const topDeals = Object.values(telegramDeals.topDealsByMarketplace)
    .flat()
    .sort((left, right) => right.score - left.score)
    .slice(0, 10);

  const responseData = {
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
  };

  rankingCache = { data: responseData, fetchedAt: now };

  return NextResponse.json(responseData);
}
