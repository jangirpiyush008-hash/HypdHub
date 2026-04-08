import { InternetDeal } from "@/lib/types";

const MOBILE_UA =
  "Mozilla/5.0 (Linux; Android 13; SM-S908B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36";
const FETCH_TIMEOUT_MS = 6000;

type SupportedMarketplace = InternetDeal["marketplace"];

async function safeFetch(url: string, headers?: Record<string, string>): Promise<string | null> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": MOBILE_UA,
        "accept": "text/html,application/json,*/*",
        "accept-language": "en-IN,en;q=0.9",
        ...headers,
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

function makeDeal(opts: {
  title: string;
  marketplace: SupportedMarketplace;
  currentPrice: number;
  originalPrice?: number;
  url: string;
  imageUrl?: string;
  category?: string;
}): InternetDeal {
  const discount =
    opts.originalPrice && opts.originalPrice > opts.currentPrice
      ? Math.round(((opts.originalPrice - opts.currentPrice) / opts.originalPrice) * 100)
      : null;

  const now = new Date().toISOString();
  let score = 10;
  if (opts.currentPrice < 500) score += 20;
  else if (opts.currentPrice < 1000) score += 15;
  else if (opts.currentPrice < 2000) score += 10;
  if (discount && discount > 50) score += 25;
  else if (discount && discount > 30) score += 15;
  else if (discount && discount > 15) score += 8;

  return {
    id: `scrape-${opts.marketplace}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: opts.title.slice(0, 60),
    marketplace: opts.marketplace,
    category: opts.category || guessCategory(opts.title),
    imageUrl: opts.imageUrl || null,
    currentPrice: opts.currentPrice,
    originalPrice: opts.originalPrice ?? null,
    discountPercent: discount,
    originalUrl: opts.url,
    canonicalUrl: opts.url,
    mentionsCount: 1,
    channelsCount: 1,
    channelNames: [`${opts.marketplace}`],
    firstSeenAt: now,
    lastSeenAt: now,
    freshnessHours: 0,
    score,
    confidenceScore: opts.url ? 70 : 30,
    validationStatus: "validated",
    stockStatus: "in_stock",
    sourceEvidence: [`${opts.marketplace} API`],
  };
}

function guessCategory(title: string): string {
  const l = title.toLowerCase();
  if (/shoe|sneaker|sandal|slipper|boot|floater/i.test(l)) return "Footwear";
  if (/shirt|tshirt|t-shirt|top|kurta|dress|jacket|hoodie|jeans|trouser/i.test(l)) return "Fashion";
  if (/lipstick|serum|cream|foundation|moistur|sunscreen|shampoo|perfume/i.test(l)) return "Beauty";
  if (/watch|earphone|headphone|earbuds|speaker|mobile|phone|laptop/i.test(l)) return "Electronics";
  if (/bag|backpack|wallet|purse|belt|sunglasses/i.test(l)) return "Accessories";
  return "General";
}

// ─── Myntra ───
async function scrapeMyntra(): Promise<InternetDeal[]> {
  const url = "https://www.myntra.com/gateway/v2/search/search?q=trending&rows=20&sort=popularity";
  const text = await safeFetch(url);
  if (!text) return [];
  try {
    const json = JSON.parse(text);
    const products = json?.products ?? [];
    return products.slice(0, 12).map((p: Record<string, unknown>) => {
      const images = p.images as Array<Record<string, string>> | undefined;
      const imageUrl = images?.[0]?.src ?? (p.searchImage as string) ?? "";
      return makeDeal({
        title: (p.productName as string) ?? (p.name as string) ?? "Myntra Product",
        marketplace: "Myntra",
        currentPrice: (p.price as number) ?? (p.discountedPrice as number) ?? 0,
        originalPrice: (p.mrp as number) ?? undefined,
        url: p.landingPageUrl ? `https://www.myntra.com/${p.landingPageUrl}` : "",
        imageUrl: imageUrl ? (imageUrl.startsWith("http") ? imageUrl : `https://assets.myntassets.com/${imageUrl}`) : undefined,
      });
    }).filter((d: InternetDeal) => d.currentPrice && d.currentPrice > 0);
  } catch { return []; }
}

// ─── Flipkart ───
async function scrapeFlipkart(): Promise<InternetDeal[]> {
  const url = "https://www.flipkart.com/deals-of-the-day";
  const html = await safeFetch(url);
  if (!html) return [];
  const deals: InternetDeal[] = [];

  // Extract from JSON-LD
  const jsonLdBlocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  for (const match of jsonLdBlocks) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : data?.itemListElement ?? [data];
      for (const item of items) {
        const name = item.name ?? item.item?.name ?? "";
        const price = parseFloat(item.offers?.price ?? item.price ?? "0");
        const image = item.image ?? item.item?.image ?? "";
        const itemUrl = item.url ?? item.item?.url ?? "";
        if (name && price > 0) {
          deals.push(makeDeal({
            title: name,
            marketplace: "Flipkart",
            currentPrice: price,
            url: itemUrl.startsWith("http") ? itemUrl : `https://www.flipkart.com${itemUrl}`,
            imageUrl: typeof image === "string" ? image : Array.isArray(image) ? image[0] : undefined,
          }));
        }
      }
    } catch { /* skip */ }
  }

  // Fallback: extract from HTML patterns
  if (deals.length === 0) {
    const imgPatterns = html.matchAll(/<img[^>]+src=["'](https:\/\/rukminim[^"']+)["'][^>]*(?:alt|title)=["']([^"']{5,80})["'][^>]*>/gi);
    for (const m of imgPatterns) {
      const imageUrl = m[1];
      const title = m[2];
      // Look for price nearby
      const idx = m.index ?? 0;
      const nearby = html.slice(idx, idx + 1500);
      const priceMatch = nearby.match(/₹\s*([0-9][0-9,]{1,8})/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ""));
        if (price > 0 && price < 100000) {
          deals.push(makeDeal({ title, marketplace: "Flipkart", currentPrice: price, url: "https://www.flipkart.com/deals-of-the-day", imageUrl }));
        }
      }
    }
  }

  return deals.slice(0, 12);
}

// ─── Amazon ───
async function scrapeAmazon(): Promise<InternetDeal[]> {
  const url = "https://www.amazon.in/gp/bestsellers";
  const html = await safeFetch(url);
  if (!html) return [];
  const deals: InternetDeal[] = [];

  // Amazon bestsellers: extract product cards
  const cardPattern = /<img[^>]+src=["'](https:\/\/[^"']*images-amazon[^"']+)["'][^>]*alt=["']([^"']{5,120})["'][^>]*>[\s\S]{0,2000}?₹\s*([0-9][0-9,]{1,8})/gi;
  for (const m of html.matchAll(cardPattern)) {
    const imageUrl = m[1];
    const title = m[2].trim();
    const price = parseFloat(m[3].replace(/,/g, ""));
    if (title && price > 0 && price < 100000) {
      deals.push(makeDeal({ title, marketplace: "Amazon", currentPrice: price, url: "https://www.amazon.in/gp/bestsellers", imageUrl }));
    }
    if (deals.length >= 12) break;
  }

  return deals;
}

// ─── Ajio ───
async function scrapeAjio(): Promise<InternetDeal[]> {
  // Try Ajio's internal API first
  const apiUrl = "https://www.ajio.com/api/category/830216001?currentPage=0&pageSize=20&sort=discount-desc";
  const text = await safeFetch(apiUrl, { "x-requested-with": "XMLHttpRequest" });
  if (text) {
    try {
      const json = JSON.parse(text);
      const products = json?.products ?? [];
      if (products.length > 0) {
        return products.slice(0, 12).map((p: Record<string, unknown>) => {
          const imgUrl = (p.images as Record<string, unknown>)?.url ?? (p.fnlColorVariantData as Record<string, unknown>)?.img ?? "";
          return makeDeal({
            title: (p.name as string) ?? "Ajio Product",
            marketplace: "Ajio",
            currentPrice: (p.offerPrice as number) ?? (p.price as Record<string, unknown>)?.value as number ?? 0,
            originalPrice: (p.wasPriceData as Record<string, unknown>)?.value as number ?? undefined,
            url: p.url ? `https://www.ajio.com${p.url}` : "https://www.ajio.com/sale",
            imageUrl: typeof imgUrl === "string" && imgUrl ? (imgUrl.startsWith("http") ? imgUrl : `https://assets.ajio.com${imgUrl}`) : undefined,
          });
        }).filter((d: InternetDeal) => d.currentPrice && d.currentPrice > 0);
      }
    } catch { /* fall through */ }
  }

  // Fallback: scrape HTML
  const html = await safeFetch("https://www.ajio.com/sale");
  if (!html) return [];
  const deals: InternetDeal[] = [];
  const imgPatterns = html.matchAll(/<img[^>]+src=["'](https:\/\/assets\.ajio\.com[^"']+)["'][^>]*alt=["']([^"']{5,80})["']/gi);
  for (const m of imgPatterns) {
    deals.push(makeDeal({
      title: m[2],
      marketplace: "Ajio",
      currentPrice: 999, // placeholder
      url: "https://www.ajio.com/sale",
      imageUrl: m[1],
    }));
    if (deals.length >= 12) break;
  }
  return deals;
}

// ─── Nykaa ───
async function scrapeNykaa(): Promise<InternetDeal[]> {
  const html = await safeFetch("https://www.nykaa.com/sp/deals-page/deals");
  if (!html) return [];
  const deals: InternetDeal[] = [];

  const imgPatterns = html.matchAll(/<img[^>]+src=["'](https:\/\/images-static\.nykaa\.com[^"']+)["'][^>]*alt=["']([^"']{5,80})["']/gi);
  for (const m of imgPatterns) {
    const title = m[2].trim();
    const idx = m.index ?? 0;
    const nearby = html.slice(idx, idx + 1500);
    const priceMatch = nearby.match(/₹\s*([0-9][0-9,]{1,8})/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 0;
    if (title && price > 0) {
      deals.push(makeDeal({ title, marketplace: "Nykaa", currentPrice: price, url: "https://www.nykaa.com/sp/deals-page/deals", imageUrl: m[1], category: "Beauty" }));
    }
    if (deals.length >= 12) break;
  }
  return deals;
}

// ─── Shopsy ───
async function scrapeShopsy(): Promise<InternetDeal[]> {
  const html = await safeFetch("https://www.shopsy.in/deals");
  if (!html) return [];
  const deals: InternetDeal[] = [];

  const jsonLdBlocks = Array.from(html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi));
  for (const match of jsonLdBlocks) {
    try {
      const data = JSON.parse(match[1]);
      const items = Array.isArray(data) ? data : data?.itemListElement ?? [data];
      for (const item of items) {
        const name = item.name ?? item.item?.name ?? "";
        const price = parseFloat(item.offers?.price ?? "0");
        const image = item.image ?? "";
        if (name && price > 0) {
          deals.push(makeDeal({
            title: name,
            marketplace: "Shopsy",
            currentPrice: price,
            url: "https://www.shopsy.in/deals",
            imageUrl: typeof image === "string" ? image : undefined,
          }));
        }
      }
    } catch { /* skip */ }
  }
  return deals.slice(0, 12);
}

// Cache scraper results for 5 minutes
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

  const scrapers: Array<{ name: SupportedMarketplace; fn: () => Promise<InternetDeal[]> }> = [
    { name: "Myntra", fn: scrapeMyntra },
    { name: "Flipkart", fn: scrapeFlipkart },
    { name: "Amazon", fn: scrapeAmazon },
    { name: "Ajio", fn: scrapeAjio },
    { name: "Nykaa", fn: scrapeNykaa },
    { name: "Shopsy", fn: scrapeShopsy },
  ];

  const results = await Promise.all(
    scrapers.map(async (s) => {
      try {
        const deals = await s.fn();
        return { name: s.name, deals };
      } catch {
        return { name: s.name, deals: [] };
      }
    })
  );

  const allDeals: InternetDeal[] = [];
  const sources: string[] = [];

  for (const r of results) {
    if (r.deals.length > 0) {
      allDeals.push(...r.deals);
      sources.push(`${r.name}: ${r.deals.length} deals`);
    }
  }

  allDeals.sort((a, b) => b.score - a.score);

  const result = { deals: allDeals, sources, scrapedAt: new Date().toISOString(), fetchedAt: now };
  scraperCache = result;
  return result;
}
