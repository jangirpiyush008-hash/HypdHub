import { deals } from "@/data/mock";
import { RankingBreakdown } from "@/lib/types";

export function getDiscountPercent(price: number, originalPrice: number) {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function getRankingBreakdown(dealId: string): RankingBreakdown | null {
  const deal = deals.find((item) => item.id === dealId);
  if (!deal) return null;

  const discountScore = getDiscountPercent(deal.price, deal.originalPrice);
  const priceAdvantageScore = Math.max(8, Math.round((deal.originalPrice - deal.price) / 300));
  const popularityScore = Math.min(25, Math.round((deal.soldCount ?? 0) / 100));
  const clickScore = deal.source === "HYPD" ? 18 : 10;
  const conversionScore = deal.source === "HYPD" ? 16 : 8;
  const telegramTrendScore = deal.demand === "Trending" ? 14 : 7;
  const manualBoostScore = deal.source === "HYPD" ? 10 : 0;

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
