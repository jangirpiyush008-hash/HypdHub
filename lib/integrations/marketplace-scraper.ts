import { InternetDeal } from "@/lib/types";

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36";
const FETCH_TIMEOUT_MS = 6000;

// Better scrape targets: mobile pages + JSON APIs that are less likely to block
const SCRAPE_TARGETS: Record<string, string[]> = {
  Myntra: [
    "https://www.myntra.com/gateway/v2/search/search?q=trending&rows=20&sort=popularity",
    "https://www.myntra.com/gateway/v2/search/search?q=bestseller&rows=20&sort=popularity",
  ],
  Flipkart: [
    "https://www.flipkart.com/deals-of-the-day",
  ],
  Amazon: [
    "https://www.amazon.in/gp/bestsellers",
  ],
  Ajio: [
    "https://www.ajio.com/api/category/830216001?currentPage=0&pageSize=20&sort=discount-desc",
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
      headers: {
        "user-agent": MOBILE_UA,
        "accept": "text/html,application/json,*/*",
        "accept-language": "en-IN,en;q=0.9",
      },
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

function extractDealsFromResponse(text: string, marketplace: string): InternetDeal[] {
  const deals: InternetDeal[] = [];

  function pushDeal(title: string, price: number, originalPrice?: number, url?: string) {
    const deal = makeDeal(title, marketplace, price, originalPrice, url);
    if (deal) deals.push(deal);
  }

  // Try parsing as JSON first (Myntra API, Ajio API)
  try {
    const json = JSON.parse(text);
    // Myntra API format
    const products = json?.products ?? json?.results ?? json?.data?.results ?? [];
    if (Array.isArray(products) && products.length > 0) {
      for (const p of products) {
        const title = p.productName ?? p.name ?? p.title ?? "";
        const price = p.price ?? p.mrp ?? p.discountedPrice ?? 0;
        const mrp = p.mrp ?? p.price ?? 0;
        const url = p.landingPageUrl
          ? `https://www.myntra.com/${p.landingPageUrl}`
          : p.url ?? "";
        if (title && price > 0) pushDeal(title, price, mrp > price ? mrp : undefined, url);
      }
      return deals.slice(0, 20);
    }
    // Ajio API format
    const ajioProducts = json?.products ?? [];
    if (Array.isArray(ajioProducts) && ajioProducts.length > 0) {
      for (const p of ajioProducts) {
        const title = p.name ?? p.fnlColorVariantData?.productName ?? "";
        const price = p.offerPrice ?? p.price?.value ?? 0;
        const mrp = p.wasPriceData?.value ?? p.mrp ?? 0;
        const url = p.url ? `https://www.ajio.com${p.url}` : "";
        if (title && price > 0) pushDeal(title, price, mrp > price ? mrp : undefined, url);
      }
      return deals.slice(0, 20);
    }
  } catch { /* Not JSON, continue with HTML parsing */ }

  // HTML parsing strategies
  // Strategy 1: JSON-LD structured data
  const jsonLdBlocks = Array.from(
    text.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)
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
        if (name && price > 0) pushDeal(name, price, undefined, url);
      }
    } catch { /* skip */ }
  }

  // Strategy 2: Product patterns in HTML
  if (deals.length === 0) {
    const productPatterns = text.matchAll(
      /(?:data-title|aria-label|alt)=["']([^"']{10,80})["'][^>]*[\s\S]{0,800}?₹\s*([0-9][0-9,]{1,8})/gi
    );
    for (const match of productPatterns) {
      const title = match[1].trim();
      const price = parseFloat(match[2].replace(/,/g, ""));
      if (title && price > 0 && price < 100000) pushDeal(title, price);
    }
  }

  // Strategy 3: Price-title proximity
  if (deals.length === 0) {
    const priceBlocks = text.matchAll(
      /(?:class=["'][^"']*(?:product|item|deal|card)[^"']*["'][^>]*>[\s\S]{0,300}?)([\w\s&'.-]{8,60})[\s\S]{0,200}?₹\s*([0-9][0-9,]{1,8})/gi
    );
    for (const match of priceBlocks) {
      const title = match[1].trim();
      const price = parseFloat(match[2].replace(/,/g, ""));
      if (title && price > 0 && price < 100000) pushDeal(title, price);
    }
  }

  return deals.slice(0, 20);
}

type SupportedMarketplace = InternetDeal["marketplace"];

const VALID_MARKETPLACES: SupportedMarketplace[] = ["Myntra", "Amazon", "Flipkart", "Shopsy", "Ajio", "Nykaa", "HYPD"];

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
  if (/shoe|sneaker|sandal|slipper|boot|floater/i.test(lower)) return "Footwear";
  if (/shirt|tshirt|t-shirt|top|kurta|dress|jacket|hoodie|jeans|trouser/i.test(lower)) return "Fashion";
  if (/lipstick|serum|cream|foundation|moistur|sunscreen|shampoo|perfume|fragrance/i.test(lower)) return "Beauty";
  if (/watch|earphone|headphone|earbuds|speaker|mobile|phone|laptop|tablet/i.test(lower)) return "Electronics";
  if (/bag|backpack|wallet|purse|belt|sunglasses/i.test(lower)) return "Accessories";
  if (/kitchen|home|sofa|pillow|bed|curtain/i.test(lower)) return "Home";
  return "General";
}

function calculateScrapedScore(
  currentPrice: number,
  originalPrice?: number,
  discountPercent?: number | null
): number {
  let score = 10;
  if (currentPrice < 500) score += 20;
  else if (currentPrice < 1000) score += 15;
  else if (currentPrice < 2000) score += 10;

  if (discountPercent && discountPercent > 50) score += 25;
  else if (discountPercent && discountPercent > 30) score += 15;
  else if (discountPercent && discountPercent > 15) score += 8;

  if (originalPrice && currentPrice) {
    const savings = originalPrice - currentPrice;
    score += Math.min(20, Math.floor(savings / 100));
  }

  return score;
}

// Cache scraper results for 5 minutes to avoid hammering marketplace APIs
let scraperCache: { deals: InternetDeal[]; sources: string[]; scrapedAt: string; fetchedAt: number } | null = null;
const SCRAPER_CACHE_MS = 5 * 60 * 1000;

export async function scrapeMarketplaceDeals(): Promise<{
  deals: InternetDeal[];
  sources: string[];
  scrapedAt: string;
}> {
  const now = Date.now();
  if (scraperCache && now - scraperCache.fetchedAt < SCRAPER_CACHE_MS) {
    return scraperCache;
  }

  const allDeals: InternetDeal[] = [];
  const sources: string[] = [];

  const scrapePromises = Object.entries(SCRAPE_TARGETS).map(
    async ([marketplace, urls]) => {
      for (const url of urls) {
        const text = await safeFetch(url);
        if (!text) continue;
        const deals = extractDealsFromResponse(text, marketplace);
        if (deals.length > 0) {
          allDeals.push(...deals);
          sources.push(`${marketplace}: ${deals.length} deals`);
          break; // Got deals from this marketplace, skip remaining URLs
        }
      }
    }
  );

  await Promise.all(scrapePromises);

  allDeals.sort((a, b) => b.score - a.score);

  const result = {
    deals: allDeals,
    sources,
    scrapedAt: new Date().toISOString(),
    fetchedAt: now,
  };

  scraperCache = result;
  return result;
}
