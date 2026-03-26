export type CreatorProfile = {
  id: string;
  hypdUserId: string;
  hypdUsername: string;
  name: string;
  email: string;
  mobileNumber: string;
  role: "creator" | "admin";
};

export type DealSnapshot = {
  generatedAt: string;
  refreshWindowHours: number;
  sources: string[];
  totalDeals: number;
};

export type RankingBreakdown = {
  discountScore: number;
  priceAdvantageScore: number;
  popularityScore: number;
  clickScore: number;
  conversionScore: number;
  telegramTrendScore: number;
  manualBoostScore: number;
};
