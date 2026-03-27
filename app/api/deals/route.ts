import { NextRequest, NextResponse } from "next/server";
import { getTopDealsByMarketplace, rankDeals } from "@/lib/deals/ranking";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { ensureAutomaticRefresh, getRefreshStatus } from "@/lib/runtime/refresh-state";
import { InternetDeal } from "@/lib/types";

function toInternetDeal(
  marketplace: string,
  deal: {
    id: string;
    productName: string;
    category: string;
    url: string;
    price: number;
    originalPrice: number;
    totalScore?: number;
  }
): InternetDeal {
  const now = new Date().toISOString();
  const discountPercent =
    deal.originalPrice > deal.price
      ? Math.round(((deal.originalPrice - deal.price) / deal.originalPrice) * 100)
      : null;

  return {
    id: deal.id,
    marketplace: marketplace as InternetDeal["marketplace"],
    canonicalUrl: deal.url,
    originalUrl: deal.url,
    title: deal.productName,
    category: deal.category,
    currentPrice: deal.price,
    originalPrice: deal.originalPrice,
    discountPercent,
    mentionsCount: 0,
    channelsCount: 0,
    channelNames: [],
    firstSeenAt: now,
    lastSeenAt: now,
    freshnessHours: 0,
    score: deal.totalScore ?? 0,
    validationStatus: "unverified",
    stockStatus: "unknown",
    sourceEvidence: ["Fallback marketplace ranking"],
    confidenceScore: 0,
    historySeenCount: 0,
    lowestTrackedPrice: deal.price,
    highestTrackedPrice: deal.originalPrice,
    priceDropSinceFirstSeen: 0
  };
}

function normalizeFallbackTopDeals() {
  const fallback = getTopDealsByMarketplace();

  return Object.fromEntries(
    Object.entries(fallback).map(([marketplace, deals]) => [
      marketplace,
      deals.map((deal) => toInternetDeal(marketplace, deal))
    ])
  ) as Record<string, InternetDeal[]>;
}

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
        : normalizeFallbackTopDeals(),
    telegramDealsCount: telegram.deals.length,
    validatedDealsCount: telegram.deals.filter((deal) => deal.validationStatus === "validated").length,
    history,
    refresh
  });
}
