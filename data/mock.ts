export type DealSource =
  | "HYPD"
  | "Myntra"
  | "Shopsy"
  | "Amazon"
  | "Meesho"
  | "Nykaa"
  | "Ajio"
  | "Flipkart";

export type Deal = {
  id: string;
  productName: string;
  category: string;
  source: DealSource;
  price: number;
  originalPrice: number;
  rating?: number;
  demand: "High Demand" | "Trending" | "Bestseller";
  soldCount?: number;
  score?: number;
  url: string;
  thumbClass: string;
  accent: string;
};

export type GeneratedLink = {
  id: string;
  title: string;
  originalUrl: string;
  convertedUrl: string;
  createdAt: string;
  clicks: number;
};

export type MarketplacePreview = {
  name: DealSource;
  label: string;
  dealId: string;
  reason: string;
  note: string;
};

export const deals: Deal[] = [
  {
    id: "d1",
    productName: "Nike Air Zoom Pegasus",
    category: "Sneakers",
    source: "Myntra",
    price: 6499,
    originalPrice: 11999,
    rating: 4.6,
    demand: "Trending",
    soldCount: 860,
    score: 88,
    url: "https://www.myntra.com/shoes/nike-air-zoom-pegasus",
    thumbClass: "from-rose-500 via-red-500 to-cyan-400",
    accent: "#ff6c8b"
  },
  {
    id: "d2",
    productName: "Sony WH-1000XM5",
    category: "Audio",
    source: "Flipkart",
    price: 24999,
    originalPrice: 34999,
    rating: 4.7,
    demand: "High Demand",
    soldCount: 430,
    score: 81,
    url: "https://www.flipkart.com/sony-wh-1000xm5",
    thumbClass: "from-fuchsia-500 via-violet-500 to-sky-500",
    accent: "#cf74ff"
  },
  {
    id: "d3",
    productName: "Fossil Gen 6 Hybrid",
    category: "Wearables",
    source: "HYPD",
    price: 7995,
    originalPrice: 18495,
    rating: 4.4,
    demand: "Bestseller",
    soldCount: 219,
    score: 93,
    url: "https://hypd.store/product/fossil-gen-6-hybrid",
    thumbClass: "from-zinc-200 via-stone-400 to-slate-700",
    accent: "#ffcf9a"
  },
  {
    id: "d4",
    productName: "Minimal Linen Co-ord Set",
    category: "Fashion",
    source: "Meesho",
    price: 899,
    originalPrice: 1799,
    rating: 4.2,
    demand: "Trending",
    soldCount: 1340,
    score: 83,
    url: "https://www.meesho.com/minimal-linen-co-ord",
    thumbClass: "from-orange-200 via-amber-400 to-rose-400",
    accent: "#ff9c7c"
  },
  {
    id: "d5",
    productName: "Puma Velocity Runner",
    category: "Sneakers",
    source: "Shopsy",
    price: 1799,
    originalPrice: 3999,
    rating: 4.3,
    demand: "High Demand",
    soldCount: 920,
    score: 86,
    url: "https://www.shopsy.in/puma-velocity-runner",
    thumbClass: "from-cyan-400 via-blue-500 to-indigo-700",
    accent: "#6dcbff"
  },
  {
    id: "d6",
    productName: "Vitamin C Radiance Serum",
    category: "Beauty",
    source: "Amazon",
    price: 599,
    originalPrice: 1199,
    rating: 4.5,
    demand: "Bestseller",
    soldCount: 2400,
    score: 84,
    url: "https://www.amazon.in/dp/vitamin-c-radiance-serum",
    thumbClass: "from-amber-200 via-orange-300 to-stone-500",
    accent: "#ffc27a"
  },
  {
    id: "d7",
    productName: "Ergo Creator Chair",
    category: "Home",
    source: "HYPD",
    price: 8999,
    originalPrice: 14999,
    rating: 4.4,
    demand: "High Demand",
    soldCount: 112,
    score: 89,
    url: "https://hypd.store/product/ergo-creator-chair",
    thumbClass: "from-slate-400 via-zinc-700 to-neutral-950",
    accent: "#9fa7c2"
  },
  {
    id: "d8",
    productName: "NoiseFit Halo Smartwatch",
    category: "Wearables",
    source: "Ajio",
    price: 2499,
    originalPrice: 7999,
    rating: 4.2,
    demand: "Trending",
    soldCount: 520,
    score: 80,
    url: "https://www.ajio.com/noisefit-halo-smartwatch/p/halo",
    thumbClass: "from-white via-slate-300 to-slate-800",
    accent: "#efeff2"
  },
  {
    id: "d9",
    productName: "Streetwear Oversized Tee Pack",
    category: "Fashion",
    source: "Meesho",
    price: 749,
    originalPrice: 1499,
    rating: 4.1,
    demand: "High Demand",
    soldCount: 1880,
    score: 82,
    url: "https://www.meesho.com/streetwear-oversized-tee-pack",
    thumbClass: "from-pink-400 via-fuchsia-600 to-violet-900",
    accent: "#f472b6"
  },
  {
    id: "d10",
    productName: "Creator Light Kit",
    category: "Studio",
    source: "Shopsy",
    price: 1599,
    originalPrice: 3299,
    rating: 4.0,
    demand: "Bestseller",
    soldCount: 670,
    score: 79,
    url: "https://www.shopsy.in/creator-light-kit",
    thumbClass: "from-purple-500 via-indigo-600 to-blue-900",
    accent: "#908cff"
  },
  {
    id: "d11",
    productName: "Ajio Luxe Bomber Jacket",
    category: "Fashion",
    source: "Ajio",
    price: 3199,
    originalPrice: 6999,
    rating: 4.3,
    demand: "Bestseller",
    soldCount: 390,
    score: 78,
    url: "https://www.ajio.com/ajio-luxe-bomber-jacket/p/jacket",
    thumbClass: "from-lime-200 via-emerald-400 to-teal-900",
    accent: "#78dba9"
  },
  {
    id: "d12",
    productName: "Amazon Echo Pop",
    category: "Audio",
    source: "Amazon",
    price: 3499,
    originalPrice: 4999,
    rating: 4.6,
    demand: "Trending",
    soldCount: 3100,
    score: 85,
    url: "https://www.amazon.in/dp/echo-pop",
    thumbClass: "from-sky-300 via-cyan-500 to-blue-900",
    accent: "#67d8ff"
  },
  {
    id: "d13",
    productName: "Dove Peptide Bond Strength Shampoo",
    category: "Beauty",
    source: "Nykaa",
    price: 629,
    originalPrice: 899,
    rating: 4.5,
    demand: "Trending",
    soldCount: 940,
    score: 84,
    url: "https://www.nykaa.com/dove-peptide-bond-strength-shampoo/p/20671035?productId=20671035&skuId=20671028&pps=1",
    thumbClass: "from-rose-200 via-pink-400 to-fuchsia-700",
    accent: "#ff86b5"
  }
];

export const recentLinks: GeneratedLink[] = [
  {
    id: "l1",
    title: "Sony WH-1000XM5",
    originalUrl: "https://www.flipkart.com/sony-wh-1000xm5",
    convertedUrl: "https://hypd.store/harshdubey123/afflink/d2v7gn47ttu13o35ajvg",
    createdAt: "10 mins ago",
    clicks: 42
  },
  {
    id: "l2",
    title: "Nike Air Zoom Pegasus",
    originalUrl: "https://www.myntra.com/shoes/nike-air-zoom-pegasus",
    convertedUrl: "https://hypd.store/harshdubey123/afflink/d72eo45tm6mdpm1b62kg",
    createdAt: "1 hour ago",
    clicks: 18
  },
  {
    id: "l3",
    title: "Dove Peptide Bond Strength Shampoo",
    originalUrl: "https://www.nykaa.com/dove-peptide-bond-strength-shampoo/p/20671035",
    convertedUrl: "https://hypd.store/harshdubey123/afflink/d72eth5tm6mdpm1b6370",
    createdAt: "Today, 08:45",
    clicks: 63
  }
];

export const marketplaces: Array<DealSource | "All"> = [
  "All",
  "HYPD",
  "Myntra",
  "Shopsy",
  "Amazon",
  "Meesho",
  "Nykaa",
  "Ajio",
  "Flipkart"
];

export const homepageMarketplaces: MarketplacePreview[] = [
  {
    name: "HYPD",
    label: "HYPD Store",
    dealId: "d3",
    reason: "Top HYPD pick based on price drop and products sold",
    note: "Pinned first because this is the only direct managed inventory flow."
  },
  {
    name: "Myntra",
    label: "Myntra",
    dealId: "d1",
    reason: "Strong fashion demand plus deep discount",
    note: "Picked from bestseller and trending sections."
  },
  {
    name: "Shopsy",
    label: "Shopsy",
    dealId: "d5",
    reason: "Affordable price point with strong repeat visibility",
    note: "Good for mass-market conversion."
  },
  {
    name: "Amazon",
    label: "Amazon",
    dealId: "d6",
    reason: "High ratings with strong popularity signal",
    note: "Weighted by value and listing momentum."
  },
  {
    name: "Meesho",
    label: "Meesho",
    dealId: "d4",
    reason: "Fashion deal with high demand and low entry price",
    note: "Useful for creator audiences that respond to impulse buys."
  },
  {
    name: "Ajio",
    label: "Ajio",
    dealId: "d8",
    reason: "Premium category price advantage",
    note: "Selected from category and bestseller visibility."
  },
  {
    name: "Nykaa",
    label: "Nykaa",
    dealId: "d13",
    reason: "Beauty creator audiences respond strongly to repeat-use products",
    note: "Useful for skincare and personal care deal pushes."
  }
];

export const categories = [
  "All",
  "Sneakers",
  "Audio",
  "Fashion",
  "Beauty",
  "Wearables",
  "Studio",
  "Home"
];

export const sourceBadges: Record<DealSource, string> = {
  HYPD: "bg-primary/20 text-primary",
  Myntra: "bg-white/10 text-white",
  Shopsy: "bg-indigo-500/20 text-indigo-200",
  Amazon: "bg-amber-500/20 text-amber-200",
  Meesho: "bg-pink-500/20 text-pink-200",
  Nykaa: "bg-rose-500/20 text-rose-200",
  Ajio: "bg-emerald-500/20 text-emerald-200",
  Flipkart: "bg-blue-500/20 text-blue-200"
};

export const dashboardActivity = [
  { day: "16 Mar", telegram: 2, whatsapp: 1, pushed: 5 },
  { day: "17 Mar", telegram: 4, whatsapp: 2, pushed: 7 },
  { day: "18 Mar", telegram: 3, whatsapp: 2, pushed: 6 },
  { day: "19 Mar", telegram: 6, whatsapp: 3, pushed: 10 },
  { day: "20 Mar", telegram: 7, whatsapp: 4, pushed: 12 },
  { day: "21 Mar", telegram: 5, whatsapp: 4, pushed: 11 },
  { day: "22 Mar", telegram: 8, whatsapp: 5, pushed: 15 },
  { day: "23 Mar", telegram: 9, whatsapp: 5, pushed: 16 },
  { day: "24 Mar", telegram: 7, whatsapp: 4, pushed: 14 },
  { day: "25 Mar", telegram: 10, whatsapp: 6, pushed: 18 }
];

export const topStoreMix = [
  { label: "HYPD Store", share: 34 },
  { label: "Myntra", share: 18 },
  { label: "Amazon", share: 14 },
  { label: "Meesho", share: 12 },
  { label: "Nykaa", share: 11 },
  { label: "Shopsy", share: 10 },
  { label: "Ajio", share: 9 }
];

export const rankingSignals = [
  {
    title: "HYPD Store",
    body: "Use HYPD API fields like current price, original price, units sold, category, stock health, and recent sell-through. Score = discount strength + velocity + price attractiveness."
  },
  {
    title: "Other marketplaces",
    body: "Use Playwright scraping on bestseller, trending, and listing pages only. Score = discount + popularity frequency + category price advantage + rating if available."
  },
  {
    title: "Manual push control",
    body: "HYPD team can manually pin or boost selected products so creators always see the exact campaign priorities you want them to convert."
  }
];
