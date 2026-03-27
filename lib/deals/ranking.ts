import { deals } from "@/data/mock";
import { RankingBreakdown } from "@/lib/types";

const preferredMarketplaces = ["Myntra", "Amazon", "Flipkart", "Shopsy", "Ajio", "Nykaa"] as const;

export function getDiscountPercent(price: number, originalPrice: number) {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function getRankingBreakdown(dealId: string): RankingBreakdown | null {
  const deal = deals.find((item) => item.id === dealId);
  if (!deal) return null;

  const discountScore = getDiscountPercent(deal.price, deal.originalPrice);
  const priceAdvantageScore = Math.max(10, Math.round((deal.originalPrice - deal.price) / 250));
  const popularityScore = Math.min(25, Math.round((deal.soldCount ?? 0) / 100));
  const clickScore = deal.source === "Amazon" || deal.source === "Flipkart" ? 16 : 12;
  const conversionScore =
    deal.category === "Beauty" || deal.category === "Fashion"
      ? 18
      : deal.price < 2500
        ? 16
        : 10;
  const telegramTrendScore =
    deal.demand === "Trending" ? 14 : deal.demand === "High Demand" ? 12 : 8;
  const manualBoostScore = deal.source === "Amazon" || deal.source === "Flipkart" ? 8 : 5;

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

export function rankDeals() {
  return [...deals]
    .filter((deal) => deal.source !== "HYPD")
    .map((deal) => {
      const ranking = getRankingBreakdown(deal.id);
      const totalScore =
        (ranking?.discountScore ?? 0) +
        (ranking?.priceAdvantageScore ?? 0) +
        (ranking?.popularityScore ?? 0) +
        (ranking?.clickScore ?? 0) +
        (ranking?.conversionScore ?? 0) +
        (ranking?.telegramTrendScore ?? 0) +
        (ranking?.manualBoostScore ?? 0);

      return { ...deal, ranking, totalScore };
    })
    .sort((left, right) => right.totalScore - left.totalScore);
}

export function getTopDealsByMarketplace(limit = 10) {
  const ranked = rankDeals();

  return preferredMarketplaces.reduce<Record<string, ReturnType<typeof rankDeals>>>((accumulator, marketplace) => {
    accumulator[marketplace] = ranked.filter((deal) => deal.source === marketplace).slice(0, limit);
    return accumulator;
  }, {});
}
