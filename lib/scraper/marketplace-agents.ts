/**
 * Marketplace Scraper Agents
 *
 * Each marketplace has multiple scraping strategies:
 * 1. Mobile/internal API (most reliable, less protected)
 * 2. Alternative API endpoints
 * 3. HTML parsing with full browser simulation
 *
 * Every strategy uses the human-agent for browser-like requests.
 */

import { InternetDeal } from "@/lib/types";
import { humanFetch, humanNavigate, humanDeepNavigate, tryStrategies, getRandomProfile } from "./human-agent";

type Marketplace = InternetDeal["marketplace"];

/** Decode HTML entities like &amp; &#x27; &#39; etc */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

/** Clean and normalize a product title */
function cleanTitle(raw: string): string {
  let t = decodeHtmlEntities(raw);
  // Remove leading pipe/dash fragments from bad HTML parsing
  t = t.replace(/^[\s|:·\-–—]+/, "");
  // Collapse whitespace
  t = t.replace(/\s+/g, " ").trim();
  return t;
}

function makeDeal(opts: {
  title: string;
  marketplace: Marketplace;
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
    id: `agent-${opts.marketplace}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: cleanTitle(opts.title).slice(0, 120),
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
    channelNames: [opts.marketplace],
    firstSeenAt: now,
    lastSeenAt: now,
    freshnessHours: 0,
    score,
    confidenceScore: 75,
    validationStatus: "validated",
    stockStatus: "in_stock",
    sourceEvidence: [`${opts.marketplace} agent`],
  };
}

function guessCategory(title: string): string {
  const l = title.toLowerCase();
  if (/shoe|sneaker|sandal|slipper|boot|floater|heel/i.test(l)) return "Footwear";
  if (/shirt|tshirt|t-shirt|top|kurta|dress|jacket|hoodie|jeans|trouser|saree|lehenga/i.test(l)) return "Fashion";
  if (/lipstick|serum|cream|foundation|moistur|sunscreen|shampoo|perfume|mascara/i.test(l)) return "Beauty";
  if (/watch|earphone|headphone|earbuds|speaker|mobile|phone|laptop|tablet|charger/i.test(l)) return "Electronics";
  if (/bag|backpack|wallet|purse|belt|sunglasses|ring|necklace/i.test(l)) return "Accessories";
  if (/kitchen|cookware|pan|mixer|grinder|blender|oven/i.test(l)) return "Home & Kitchen";
  return "General";
}


// ═══════════════════════════════════════════════════════════════════
// MYNTRA
// ═══════════════════════════════════════════════════════════════════

async function myntraStrategy1(): Promise<InternetDeal[]> {
  // Mobile search API — most reliable
  const res = await humanNavigate(
    "https://www.myntra.com/",
    "https://www.myntra.com/gateway/v2/search/search?q=trending+now&rows=20&sort=popularity&plaEnabled=false",
    { acceptJson: true, extraHeaders: { "x-myntraweb": "Yes", "x-requested-with": "browser" } }
  );
  if (!res.ok) return [];
  const json = JSON.parse(res.text);
  const products = json?.products ?? [];
  return products.slice(0, 12).map((p: Record<string, unknown>) => {
    const imgs = p.images as Array<Record<string, string>> | undefined;
    const imageUrl = (p.searchImage as string) ?? imgs?.[0]?.src ?? "";
    return makeDeal({
      title: (p.productName as string) ?? (p.name as string) ?? "Myntra Product",
      marketplace: "Myntra",
      currentPrice: (p.price as number) ?? (p.discountedPrice as number) ?? 0,
      originalPrice: (p.mrp as number) ?? undefined,
      url: p.landingPageUrl ? `https://www.myntra.com/${p.landingPageUrl}` : "https://www.myntra.com",
      imageUrl: imageUrl.startsWith("http") ? imageUrl : imageUrl ? `https://assets.myntassets.com/${imageUrl}` : undefined,
    });
  }).filter((d: InternetDeal) => d.currentPrice && d.currentPrice > 0);
}

async function myntraStrategy2(): Promise<InternetDeal[]> {
  // Category API — deals/offers
  const res = await humanFetch({
    url: "https://www.myntra.com/gateway/v2/search/search?q=deal+of+the+day&rows=20&sort=discount",
    acceptJson: true,
    extraHeaders: { "x-myntraweb": "Yes" },
  });
  if (!res.ok) return [];
  const json = JSON.parse(res.text);
  const products = json?.products ?? [];
  return products.slice(0, 12).map((p: Record<string, unknown>) => {
    const imageUrl = (p.searchImage as string) ?? "";
    return makeDeal({
      title: (p.productName as string) ?? "Myntra Deal",
      marketplace: "Myntra",
      currentPrice: (p.price as number) ?? 0,
      originalPrice: (p.mrp as number) ?? undefined,
      url: p.landingPageUrl ? `https://www.myntra.com/${p.landingPageUrl}` : "https://www.myntra.com",
      imageUrl: imageUrl.startsWith("http") ? imageUrl : imageUrl ? `https://assets.myntassets.com/${imageUrl}` : undefined,
    });
  }).filter((d: InternetDeal) => d.currentPrice && d.currentPrice > 0);
}

async function myntraStrategy3(): Promise<InternetDeal[]> {
  // Best sellers endpoint
  const res = await humanFetch({
    url: "https://www.myntra.com/gateway/v2/search/search?q=best+sellers&rows=20&sort=popularity",
    acceptJson: true,
    extraHeaders: { "x-myntraweb": "Yes", "x-requested-with": "XMLHttpRequest" },
  });
  if (!res.ok) return [];
  const json = JSON.parse(res.text);
  const products = json?.products ?? [];
  return products.slice(0, 12).map((p: Record<string, unknown>) => {
    const imageUrl = (p.searchImage as string) ?? "";
    return makeDeal({
      title: (p.productName as string) ?? "Myntra Product",
      marketplace: "Myntra",
      currentPrice: (p.price as number) ?? 0,
      originalPrice: (p.mrp as number) ?? undefined,
      url: p.landingPageUrl ? `https://www.myntra.com/${p.landingPageUrl}` : "https://www.myntra.com",
      imageUrl: imageUrl.startsWith("http") ? imageUrl : imageUrl ? `https://assets.myntassets.com/${imageUrl}` : undefined,
    });
  }).filter((d: InternetDeal) => d.currentPrice && d.currentPrice > 0);
}

export async function scrapeMyntra(): Promise<InternetDeal[]> {
  const result = await tryStrategies([
    { name: "myntra-search-api", fn: () => myntraStrategy1().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "myntra-deals-api", fn: () => myntraStrategy2().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "myntra-bestsellers", fn: () => myntraStrategy3().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
  ]);
  if (result) {
    try { return JSON.parse(result.response.text); } catch { return []; }
  }
  return [];
}


// ═══════════════════════════════════════════════════════════════════
// FLIPKART
// ═══════════════════════════════════════════════════════════════════

async function flipkartStrategy1(): Promise<InternetDeal[]> {
  // Deep navigation: home → deals (like a real user browsing)
  const res = await humanDeepNavigate([
    "https://www.flipkart.com/",
    "https://www.flipkart.com/deals-of-the-day",
  ]);
  if (!res.ok) return [];
  return parseFlipkartHtml(res.text, "https://www.flipkart.com/deals-of-the-day");
}

async function flipkartStrategy2(): Promise<InternetDeal[]> {
  // Deep navigation: home → offers store
  const res = await humanDeepNavigate([
    "https://www.flipkart.com/",
    "https://www.flipkart.com/offers-store",
  ]);
  if (!res.ok) return [];
  return parseFlipkartHtml(res.text, "https://www.flipkart.com/offers-store");
}

async function flipkartStrategy3(): Promise<InternetDeal[]> {
  // Mobile API search
  const res = await humanFetch({
    url: "https://www.flipkart.com/api/4/page/fetch",
    method: "POST",
    acceptJson: true,
    body: JSON.stringify({ pageUri: "/deals-of-the-day", pageContext: { fetchSeoData: false } }),
    extraHeaders: {
      "content-type": "application/json",
      "x-user-agent": "Mozilla/5.0 (Linux; Android 14) Chrome/124.0.6367.113 Mobile FKUA/website/42/website/Desktop",
    },
  });
  if (!res.ok) return [];
  try {
    const json = JSON.parse(res.text);
    const deals: InternetDeal[] = [];
    // Walk the Flipkart response tree for product data
    const slots = json?.RESPONSE?.slots ?? json?.slots ?? [];
    for (const slot of slots) {
      const widget = slot?.widget;
      if (!widget?.data?.products) continue;
      for (const p of widget.data.products) {
        const info = p?.productInfo?.value ?? p;
        const title = info?.title ?? info?.productName ?? "";
        const price = info?.pricing?.finalPrice?.value ?? info?.price ?? 0;
        const mrp = info?.pricing?.mrp?.value ?? info?.mrp ?? undefined;
        const image = info?.media?.[0]?.url ?? info?.imageUrl ?? "";
        const url = info?.smartUrl ?? info?.baseUrl ?? "";
        if (title && price > 0) {
          deals.push(makeDeal({
            title,
            marketplace: "Flipkart",
            currentPrice: price,
            originalPrice: mrp,
            url: url.startsWith("http") ? url : `https://www.flipkart.com${url}`,
            imageUrl: image.startsWith("http") ? image : image ? `https://rukminim2.flixcart.com/image/416/416/${image}` : undefined,
          }));
        }
        if (deals.length >= 12) break;
      }
      if (deals.length >= 12) break;
    }
    return deals;
  } catch { return []; }
}

function parseFlipkartHtml(html: string, pageUrl: string): InternetDeal[] {
  const deals: InternetDeal[] = [];

  // Strategy A: JSON-LD structured data
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

  // Strategy B: Image + price pattern matching
  if (deals.length === 0) {
    const imgPatterns = html.matchAll(/<img[^>]+src=["'](https:\/\/rukminim[^"']+)["'][^>]*(?:alt|title)=["']([^"']{5,100})["'][^>]*>/gi);
    for (const m of imgPatterns) {
      const imageUrl = m[1];
      const title = m[2];
      const idx = m.index ?? 0;
      const nearby = html.slice(idx, idx + 2000);
      const priceMatch = nearby.match(/₹\s*([0-9][0-9,]{1,8})/);
      const mrpMatch = nearby.match(/₹\s*([0-9][0-9,]{1,8})[\s\S]{0,50}?₹\s*([0-9][0-9,]{1,8})/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ""));
        const mrp = mrpMatch ? parseFloat(mrpMatch[2].replace(/,/g, "")) : undefined;
        if (price > 0 && price < 100000) {
          deals.push(makeDeal({ title, marketplace: "Flipkart", currentPrice: price, originalPrice: mrp, url: pageUrl, imageUrl }));
        }
      }
      if (deals.length >= 12) break;
    }
  }

  // Strategy C: Product title patterns
  if (deals.length === 0) {
    const titlePricePattern = /class="[^"]*"[^>]*>([^<]{10,80})<\/[^>]+>[\s\S]{0,500}?₹\s*([0-9][0-9,]{1,8})/gi;
    for (const m of html.matchAll(titlePricePattern)) {
      const title = m[1].trim();
      const price = parseFloat(m[2].replace(/,/g, ""));
      if (title && price > 0 && price < 100000 && !/class|style|script/i.test(title)) {
        deals.push(makeDeal({ title, marketplace: "Flipkart", currentPrice: price, url: pageUrl }));
      }
      if (deals.length >= 12) break;
    }
  }

  return deals.slice(0, 12);
}

export async function scrapeFlipkart(): Promise<InternetDeal[]> {
  const result = await tryStrategies([
    { name: "flipkart-navigate", fn: () => flipkartStrategy1().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "flipkart-offers", fn: () => flipkartStrategy2().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "flipkart-api", fn: () => flipkartStrategy3().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
  ]);
  if (result) {
    try { return JSON.parse(result.response.text); } catch { return []; }
  }
  return [];
}


// ═══════════════════════════════════════════════════════════════════
// AMAZON
// ═══════════════════════════════════════════════════════════════════

async function amazonStrategy1(): Promise<InternetDeal[]> {
  // Navigate like a real person: homepage → bestsellers
  const res = await humanNavigate(
    "https://www.amazon.in/",
    "https://www.amazon.in/gp/bestsellers",
    { delayMs: [400, 900] }
  );
  if (!res.ok) return [];
  return parseAmazonHtml(res.text, "https://www.amazon.in/gp/bestsellers");
}

async function amazonStrategy2(): Promise<InternetDeal[]> {
  // Today's deals
  const res = await humanNavigate(
    "https://www.amazon.in/",
    "https://www.amazon.in/deals?ref_=nav_cs_gb",
    { delayMs: [300, 700] }
  );
  if (!res.ok) return [];
  return parseAmazonHtml(res.text, "https://www.amazon.in/deals");
}

async function amazonStrategy3(): Promise<InternetDeal[]> {
  // Direct fetch with full Chrome headers
  const profile = getRandomProfile();
  const res = await humanFetch({
    url: "https://www.amazon.in/gp/movers-and-shakers",
    profile,
  });
  if (!res.ok) return [];
  return parseAmazonHtml(res.text, "https://www.amazon.in/gp/movers-and-shakers");
}

function parseAmazonHtml(html: string, pageUrl: string): InternetDeal[] {
  const deals: InternetDeal[] = [];
  const seenTitles = new Set<string>();

  // Strategy 1: Find product links (/dp/ASIN) with nearby image and price
  const dpLinks = Array.from(html.matchAll(/href="(\/[^"]*?\/dp\/([A-Z0-9]{10})[^"]*)"/gi));
  for (const dpMatch of dpLinks) {
    const productPath = dpMatch[1];
    const asin = dpMatch[2];
    const idx = dpMatch.index ?? 0;

    // Search in a window around the link for image, title, and price
    const windowStart = Math.max(0, idx - 2000);
    const windowEnd = Math.min(html.length, idx + 4000);
    const window = html.slice(windowStart, windowEnd);

    // Find image
    const imgMatch = window.match(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[A-Za-z0-9_+%-]+\.[^"]+)"/);
    const imageUrl = imgMatch?.[1] ?? null;

    // Find title from alt text or span/div content near the link
    let title = "";
    const altMatch = window.match(/alt="([^"]{10,200})"/);
    if (altMatch) title = altMatch[1];
    // Also try span text near dp link
    if (!title || title.length < 10) {
      const spanMatch = window.match(/>([^<]{15,200})<\/(?:span|a|div|h2)/);
      if (spanMatch) title = spanMatch[1];
    }

    // Find price
    const priceMatch = window.match(/₹\s*([0-9][0-9,]{1,8})/);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 0;

    // Find MRP
    const mrpMatch = window.match(/(?:M\.R\.P|listPrice|was|a-text-price)[^₹]{0,30}₹\s*([0-9][0-9,]{1,8})/i);
    const mrp = mrpMatch ? parseFloat(mrpMatch[1].replace(/,/g, "")) : undefined;

    if (title && title.length >= 10 && price > 0 && price < 200000 && !seenTitles.has(title)) {
      seenTitles.add(title);
      const productUrl = `https://www.amazon.in/dp/${asin}`;
      deals.push(makeDeal({
        title,
        marketplace: "Amazon",
        currentPrice: price,
        originalPrice: mrp && mrp > price ? mrp : undefined,
        url: productUrl,
        imageUrl: imageUrl && !imageUrl.includes(".css") && !imageUrl.includes(".js") ? imageUrl : undefined,
      }));
    }
    if (deals.length >= 12) break;
  }

  // Strategy 2: img alt + price (fallback)
  if (deals.length < 3) {
    const imgPatterns = html.matchAll(/<img[^>]+src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"[^>]*alt="([^"]{10,200})"/gi);
    for (const m of imgPatterns) {
      const imageUrl = m[1];
      const title = m[2].trim();
      if (seenTitles.has(title) || imageUrl.includes(".css") || imageUrl.includes(".js")) continue;
      const idx = m.index ?? 0;
      const nearby = html.slice(idx, idx + 3000);
      const priceMatch = nearby.match(/₹\s*([0-9][0-9,]{1,8})/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ""));
        if (price > 0 && price < 200000) {
          seenTitles.add(title);
          deals.push(makeDeal({ title, marketplace: "Amazon", currentPrice: price, url: pageUrl, imageUrl }));
        }
      }
      if (deals.length >= 12) break;
    }
  }

  return deals;
}

export async function scrapeAmazon(): Promise<InternetDeal[]> {
  const result = await tryStrategies([
    { name: "amazon-navigate", fn: () => amazonStrategy1().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "amazon-deals", fn: () => amazonStrategy2().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "amazon-movers", fn: () => amazonStrategy3().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
  ]);
  if (result) {
    try { return JSON.parse(result.response.text); } catch { return []; }
  }
  return [];
}


// ═══════════════════════════════════════════════════════════════════
// AJIO
// ═══════════════════════════════════════════════════════════════════

async function ajioStrategy1(): Promise<InternetDeal[]> {
  // Deep navigation: home → sale → API (full session buildup)
  const res = await humanDeepNavigate(
    [
      "https://www.ajio.com/",
      "https://www.ajio.com/sale",
      "https://www.ajio.com/api/category/830216001?currentPage=0&pageSize=20&sort=discount-desc",
    ],
    { extraHeaders: { "x-requested-with": "XMLHttpRequest" }, acceptJson: true }
  );
  if (!res.ok) return [];
  return parseAjioJson(res.text);
}

async function ajioStrategy2(): Promise<InternetDeal[]> {
  // Navigate home → API
  const res = await humanNavigate(
    "https://www.ajio.com/",
    "https://www.ajio.com/api/category/830216001?currentPage=0&pageSize=20&sort=newn",
    { extraHeaders: { "x-requested-with": "XMLHttpRequest" }, acceptJson: true }
  );
  if (!res.ok) return [];
  return parseAjioJson(res.text);
}

async function ajioStrategy3(): Promise<InternetDeal[]> {
  // Navigate sale → API
  const res = await humanNavigate(
    "https://www.ajio.com/sale",
    "https://www.ajio.com/api/category/830216001?currentPage=0&pageSize=20&sort=price-asc",
    { extraHeaders: { "x-requested-with": "XMLHttpRequest" }, acceptJson: true }
  );
  if (!res.ok) return [];
  return parseAjioJson(res.text);
}

function parseAjioJson(text: string): InternetDeal[] {
  try {
    const json = JSON.parse(text);
    const products = json?.products ?? [];
    if (products.length === 0) return [];
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
  } catch { return []; }
}

export async function scrapeAjio(): Promise<InternetDeal[]> {
  const result = await tryStrategies([
    { name: "ajio-category-api", fn: () => ajioStrategy1().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "ajio-new-arrivals", fn: () => ajioStrategy2().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "ajio-sale-api", fn: () => ajioStrategy3().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
  ]);
  if (result) {
    try { return JSON.parse(result.response.text); } catch { return []; }
  }
  return [];
}


// ═══════════════════════════════════════════════════════════════════
// NYKAA
// ═══════════════════════════════════════════════════════════════════

async function nykaaStrategy1(): Promise<InternetDeal[]> {
  // Deep navigation: home → deals page (full session with cookies)
  const res = await humanDeepNavigate([
    "https://www.nykaa.com/",
    "https://www.nykaa.com/sp/deals-page/deals",
  ]);
  if (!res.ok) return [];
  return parseNykaaHtml(res.text);
}

async function nykaaStrategy2(): Promise<InternetDeal[]> {
  // Deep navigation: home → offers
  const res = await humanDeepNavigate([
    "https://www.nykaa.com/",
    "https://www.nykaa.com/sp/offer-page/offers",
  ]);
  if (!res.ok) return [];
  return parseNykaaHtml(res.text);
}

async function nykaaStrategy3(): Promise<InternetDeal[]> {
  // Deep navigation: home → search (with XHR headers)
  const res = await humanNavigate(
    "https://www.nykaa.com/",
    "https://www.nykaa.com/search/result/?q=bestseller&root=search&searchType=Manual&sourcepage=listing&p=0&category_filter=&type=product",
    { acceptJson: true, extraHeaders: { "x-requested-with": "XMLHttpRequest" } }
  );
  if (!res.ok) return [];
  try {
    const json = JSON.parse(res.text);
    const products = json?.response?.products ?? json?.products ?? [];
    return products.slice(0, 12).map((p: Record<string, unknown>) => {
      return makeDeal({
        title: (p.title as string) ?? (p.name as string) ?? "Nykaa Product",
        marketplace: "Nykaa",
        currentPrice: (p.offer_price as number) ?? (p.price as number) ?? 0,
        originalPrice: (p.mrp as number) ?? (p.price as number) ?? undefined,
        url: p.slug ? `https://www.nykaa.com/${p.slug}/p/${p.id}` : "https://www.nykaa.com",
        imageUrl: (p.image_url as string) ?? (p.imageUrl as string) ?? undefined,
        category: "Beauty",
      });
    }).filter((d: InternetDeal) => d.currentPrice && d.currentPrice > 0);
  } catch { return []; }
}

function parseNykaaHtml(html: string): InternetDeal[] {
  const deals: InternetDeal[] = [];

  // Strategy A: Nykaa image pattern
  const imgPatterns = html.matchAll(/<img[^>]+src=["'](https:\/\/(?:images-static\.nykaa\.com|adn-static[^"']+nykaa[^"']+)[^"']+)["'][^>]*(?:alt|title)=["']([^"']{5,80})["']/gi);
  for (const m of imgPatterns) {
    const title = m[2].trim();
    const idx = m.index ?? 0;
    const nearby = html.slice(idx, idx + 2000);
    const priceMatch = nearby.match(/₹\s*([0-9][0-9,]{1,8})/);
    const mrpMatch = nearby.match(/MRP\D{0,10}?₹\s*([0-9][0-9,]{1,8})/i);
    const price = priceMatch ? parseFloat(priceMatch[1].replace(/,/g, "")) : 0;
    const mrp = mrpMatch ? parseFloat(mrpMatch[1].replace(/,/g, "")) : undefined;
    if (title && price > 0) {
      deals.push(makeDeal({ title, marketplace: "Nykaa", currentPrice: price, originalPrice: mrp, url: "https://www.nykaa.com/sp/deals-page/deals", imageUrl: m[1], category: "Beauty" }));
    }
    if (deals.length >= 12) break;
  }

  // Strategy B: JSON data in page
  if (deals.length === 0) {
    const jsonMatch = html.match(/__PRELOADED_STATE__\s*=\s*({[\s\S]+?});\s*<\/script>/);
    if (jsonMatch) {
      try {
        const state = JSON.parse(jsonMatch[1]);
        const products = state?.listing?.products ?? state?.search?.products ?? [];
        for (const p of products.slice(0, 12)) {
          deals.push(makeDeal({
            title: p.title ?? p.name ?? "Nykaa Product",
            marketplace: "Nykaa",
            currentPrice: p.offer_price ?? p.price ?? 0,
            originalPrice: p.mrp ?? undefined,
            url: "https://www.nykaa.com",
            imageUrl: p.image_url ?? undefined,
            category: "Beauty",
          }));
        }
      } catch { /* skip */ }
    }
  }

  return deals;
}

export async function scrapeNykaa(): Promise<InternetDeal[]> {
  const result = await tryStrategies([
    { name: "nykaa-deals-page", fn: () => nykaaStrategy1().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "nykaa-offers", fn: () => nykaaStrategy2().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "nykaa-search-api", fn: () => nykaaStrategy3().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
  ]);
  if (result) {
    try { return JSON.parse(result.response.text); } catch { return []; }
  }
  return [];
}


// ═══════════════════════════════════════════════════════════════════
// SHOPSY
// ═══════════════════════════════════════════════════════════════════

async function shopsyStrategy1(): Promise<InternetDeal[]> {
  // Deep navigation: home → deals
  const res = await humanDeepNavigate([
    "https://www.shopsy.in/",
    "https://www.shopsy.in/deals",
  ]);
  if (!res.ok) return [];
  return parseShopsyHtml(res.text);
}

async function shopsyStrategy2(): Promise<InternetDeal[]> {
  // Deep navigation: home → all-offers
  const res = await humanDeepNavigate([
    "https://www.shopsy.in/",
    "https://www.shopsy.in/all-offers",
  ]);
  if (!res.ok) return [];
  return parseShopsyHtml(res.text);
}

function parseShopsyHtml(html: string): InternetDeal[] {
  const deals: InternetDeal[] = [];

  // JSON-LD
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

  // Fallback: image + price patterns
  if (deals.length === 0) {
    const imgPatterns = html.matchAll(/<img[^>]+src=["'](https:\/\/rukminim[^"']+)["'][^>]*alt=["']([^"']{5,80})["']/gi);
    for (const m of imgPatterns) {
      const idx = m.index ?? 0;
      const nearby = html.slice(idx, idx + 2000);
      const priceMatch = nearby.match(/₹\s*([0-9][0-9,]{1,8})/);
      if (priceMatch) {
        const price = parseFloat(priceMatch[1].replace(/,/g, ""));
        if (price > 0 && price < 50000) {
          deals.push(makeDeal({
            title: m[2],
            marketplace: "Shopsy",
            currentPrice: price,
            url: "https://www.shopsy.in/deals",
            imageUrl: m[1],
          }));
        }
      }
      if (deals.length >= 12) break;
    }
  }

  return deals.slice(0, 12);
}

export async function scrapeShopsy(): Promise<InternetDeal[]> {
  const result = await tryStrategies([
    { name: "shopsy-navigate", fn: () => shopsyStrategy1().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
    { name: "shopsy-offers", fn: () => shopsyStrategy2().then(deals => ({ ok: deals.length > 0, status: 200, text: JSON.stringify(deals), headers: {} })) },
  ]);
  if (result) {
    try { return JSON.parse(result.response.text); } catch { return []; }
  }
  return [];
}
