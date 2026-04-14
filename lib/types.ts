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

export type InternetDeal = {
  id: string;
  marketplace: "Myntra" | "Amazon" | "Flipkart" | "Shopsy" | "Ajio" | "Nykaa" | "HYPD";
  canonicalUrl: string;
  originalUrl: string;
  title: string;
  category: string;
  imageUrl?: string | null;
  currentPrice: number | null;
  originalPrice: number | null;
  discountPercent: number | null;
  mentionsCount: number;
  channelsCount: number;
  channelNames: string[];
  firstSeenAt: string;
  lastSeenAt: string;
  freshnessHours: number;
  score: number;
  validationStatus?: "validated" | "unverified" | "failed";
  validatedAt?: string;
  validatedTitle?: string | null;
  categoryUrl?: string | null;
  categoryTitle?: string | null;
  stockStatus?: "in_stock" | "out_of_stock" | "unknown";
  sourceEvidence?: string[];
  confidenceScore?: number;
  historySeenCount?: number;
  lowestTrackedPrice?: number | null;
  highestTrackedPrice?: number | null;
  priceDropSinceFirstSeen?: number | null;
};
