import { InternetDeal } from "@/lib/types";

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";
const FETCH_TIMEOUT_MS = 10000;

// Marketplace scraping URLs — bestsellers, trending, deals pages
const SCRAPE_TARGETS: Record<string, string[]> = {
  Myntra: [
    "https://www.myntra.com/gateway/v2/search/search?q=deals&rows=20&sort=popularity",
  ],
  Flipkart: [
    "https://www.flipkart.com/deals-of-the-day",
  ],
  Amazon: [
    "https://www.amazon.in/gp/bestsellers",
  ],
  Ajio: [
    "https://www.ajio.com/sale",
  ],
  Nykaa: [
    "https://www.nykaa.com/sp/deals-page/deals",
  ],
  Shopsy: [
    "https://www.shopsy.in/deals",
  ],
};

async function safeFetch(url: string): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: { "user-agent": USER_AGENT, "accept": "text/html,application/json" },
      cache: "no-store",
      signal: controller.signal,
    });
    if (!res.ok) return null;
    return res.text();
  } catch {
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

function extractDealsFromHtml(html: string, marketplace: string): InternetDeal[] {
  const deals: InternetDeal[] = [];

  function pushDeal(title: string, price: number, url?: string) {
    const deal = makeDeal(title, marketplace, price, undefined, url);
    if (deal) deals.push(deal);
  }

  // Strategy 1: JSON-LD structured data
  const jsonLdBlocks = Array.from(
    html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
  );
  for (const match of jsonLdBlocks) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : data?.itemListElement ?? data?.offers ?? [data];
      for (const item of items) {
        if (!item?.name && !item?.item?.name) continue;
        const name = item.name ?? item.item?.name ?? "";
        const price = parseFloat(item.offers?.price ?? item.price ?? item.item?.offers?.price ?? "0");
        const url = item.url ?? item.item?.url ?? item["@id"] ?? "";
        if (name && price > 0) pushDeal(name, price, url);
      }
    } catch { /* skip malformed JSON-LD */ }
  }

  // Strategy 2: OG meta + price patterns in HTML
  if (deals.length === 0) {
    const productPatterns = html.matchAll(
      /(?:data-title|aria-label|alt)=["']([^"']{10,80})["'][^>]*[\s\S]{0,800}?₹\s*([0-9][0-9,]{1,8})/gi
    );
    for (const match of productPatterns) {
      const title = match[1].trim();
      const price = parseFloat(match[2].replace(/,/g, ""));
      if (title && price > 0 && price < 100000) pushDeal(title, price, "");
    }
  }

  // Strategy 3: Price-title proximity patterns
  if (deals.length === 0) {
    const priceBlocks = html.matchAll(
      /(?:class=["'][^"']*(?:product|item|deal|card)[^"']*["'][^>]*>[\s\S]{0,300}?)([\w\s&'-]{8,60})[\s\S]{0,200}?₹\s*([0-9][0-9,]{1,8})/gi
    );
    for (const match of priceBlocks) {
      const title = match[1].trim();
      const price = parseFloat(match[2].replace(/,/g, ""));
      if (title && price > 0 && price < 100000) pushDeal(title, price, "");
    }
  }

  return deals.slice(0, 20);
}

type SupportedMarketplace = InternetDeal["marketplace"];

const VALID_MARKETPLACES: SupportedMarketplace[] = ["Myntra", "Amazon", "Flipkart", "Shopsy", "Ajio", "Nykaa"];

function isValidMarketplace(m: string): m is SupportedMarketplace {
  return VALID_MARKETPLACES.includes(m as SupportedMarketplace);
}

function makeDeal(
  title: string,
  marketplace: string,
  currentPrice: number,
  originalPrice?: number,
  url?: string
): InternetDeal | null {
  if (!isValidMarketplace(marketplace)) return null;

  const discount =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  const now = new Date().toISOString();

  return {
    id: `scrape-${marketplace}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title,
    marketplace,
    category: guessCategoryFromTitle(title),
    currentPrice,
    originalPrice: originalPrice ?? null,
    discountPercent: discount,
    originalUrl: url || "",
    canonicalUrl: url || "",
    mentionsCount: 1,
    channelsCount: 1,
    channelNames: [`${marketplace} scraper`],
    firstSeenAt: now,
    lastSeenAt: now,
    freshnessHours: 0,
    score: calculateScrapedScore(currentPrice, originalPrice, discount),
    confidenceScore: url ? 60 : 30,
    validationStatus: "unverified",
    stockStatus: "unknown",
    sourceEvidence: [`${marketplace} website`],
  };
}

function guessCategoryFromTitle(title: string): string {
  const lower = title.toLowerCase();
  if (/shoe|sneaker|sandal|slipper|boot/i.test(lower)) return "Footwear";
  if (/shirt|tshirt|t-shirt|top|kurta|dress|jacket|hoodie/i.test(lower)) return "Fashion";
  if (/lipstick|serum|cream|foundation|moistur|sunscreen|shampoo/i.test(lower)) return "Beauty";
  if (/watch|earphone|headphone|earbuds|speaker/i.test(lower)) return "Electronics";
  if (/bag|backpack|wallet|purse/i.test(lower)) return "Accessories";
  return "General";
}

function calculateScrapedScore(
  currentPrice: number,
  originalPrice?: number,
  discountPercent?: number | null
): number {
  let score = 10;
  // Price advantage: cheaper = higher score
  if (currentPrice < 500) score += 20;
  else if (currentPrice < 1000) score += 15;
  else if (currentPrice < 2000) score += 10;

  // Discount
  if (discountPercent && discountPercent > 50) score += 25;
  else if (discountPercent && discountPercent > 30) score += 15;
  else if (discountPercent && discountPercent > 15) score += 8;

  // Price savings
  if (originalPrice && currentPrice) {
    const savings = originalPrice - currentPrice;
    score += Math.min(20, Math.floor(savings / 100));
  }

  return score;
}

// Main scraper function — scrapes all marketplace targets
export async function scrapeMarketplaceDeals(): Promise<{
  deals: InternetDeal[];
  sources: string[];
  scrapedAt: string;
}> {
  const allDeals: InternetDeal[] = [];
  const sources: string[] = [];

  const scrapePromises = Object.entries(SCRAPE_TARGETS).map(
    async ([marketplace, urls]) => {
      for (const url of urls) {
        const html = await safeFetch(url);
        if (!html) continue;
        const deals = extractDealsFromHtml(html, marketplace);
        if (deals.length > 0) {
          allDeals.push(...deals);
          sources.push(`${marketplace}: ${deals.length} deals`);
        }
      }
    }
  );

  await Promise.all(scrapePromises);

  // Sort by score descending
  allDeals.sort((a, b) => b.score - a.score);

  return {
    deals: allDeals,
    sources,
    scrapedAt: new Date().toISOString(),
  };
}
