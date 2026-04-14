import { InternetDeal, RankingBreakdown } from "@/lib/types";

const preferredMarketplaces = ["Myntra", "Meesho", "Flipkart", "Shopsy", "Ajio", "Nykaa"] as const;

export function getDiscountPercent(price: number, originalPrice: number) {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

function getRankingBreakdownForDeal(deal: InternetDeal): RankingBreakdown {
  const discountScore =
    deal.currentPrice && deal.originalPrice && deal.originalPrice > deal.currentPrice
      ? getDiscountPercent(deal.currentPrice, deal.originalPrice)
      : deal.discountPercent ?? 0;
  const priceAdvantageScore =
    deal.currentPrice && deal.originalPrice
      ? Math.max(0, Math.round((deal.originalPrice - deal.currentPrice) / 250))
      : 0;
  const popularityScore = Math.min(30, deal.mentionsCount * 3 + deal.channelsCount * 4);
  const clickScore = Math.min(20, Math.round((deal.confidenceScore ?? 0) / 5));
  const conversionScore =
    deal.category.toLowerCase().includes("beauty") || deal.category.toLowerCase().includes("fashion")
      ? 18
      : (deal.currentPrice ?? 0) <= 2500
        ? 14
        : 10;
  const telegramTrendScore = Math.min(20, Math.round(Math.max(0, 24 - deal.freshnessHours)));
  const manualBoostScore = deal.validationStatus === "validated" ? 10 : 0;

  return {
    discountScore,
    priceAdvantageScore,
    popularityScore,
    clickScore,
    conversionScore,
    telegramTrendScore,
    manualBoostScore
  };
}

export function getRankingBreakdown(deal: InternetDeal): RankingBreakdown {
  return getRankingBreakdownForDeal(deal);
}

export function rankDeals(deals: InternetDeal[]) {
  return [...deals]
    .map((deal) => {
      const ranking = getRankingBreakdownForDeal(deal);
      const totalScore =
        ranking.discountScore +
        ranking.priceAdvantageScore +
        ranking.popularityScore +
        ranking.clickScore +
        ranking.conversionScore +
        ranking.telegramTrendScore +
        ranking.manualBoostScore;

      return { ...deal, ranking, totalScore };
    })
    .sort((left, right) => right.totalScore - left.totalScore);
}

export function getTopDealsByMarketplace(deals: InternetDeal[], limit = 10) {
  const ranked = rankDeals(deals);

  return preferredMarketplaces.reduce<Record<string, ReturnType<typeof rankDeals>>>((accumulator, marketplace) => {
    accumulator[marketplace] = ranked.filter((deal) => deal.marketplace === marketplace).slice(0, limit);
    return accumulator;
  }, {});
}
