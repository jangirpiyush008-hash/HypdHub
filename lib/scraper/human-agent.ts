/**
 * NOVA Agent v2 (Network-Optimized Virtual Assistant)
 *
 * HYPD's browser simulation engine for marketplace scraping.
 * v2: Added product resolver — resolves search URLs to real product pages + images.
 *
 * Usage: import { humanFetch, resolveProduct, batchResolveProducts } from "@/lib/scraper/human-agent"
 * Update: Ask Claude to "update NOVA agent" or "improve NOVA agent"
 *
 * @version 2.0.0
 */

import { gunzipSync } from "zlib";

export const NOVA_VERSION = "2.0.0";

const CHROME_PROFILES = [
  {
    name: "Chrome 125 Android Samsung",
    ua: "Mozilla/5.0 (Linux; Android 14; SM-S928B Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36",
    secChUa: '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    secChUaPlatform: '"Android"',
    secChUaMobile: "?1",
    acceptLanguage: "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
  },
  {
    name: "Chrome 124 Android Pixel",
    ua: "Mozilla/5.0 (Linux; Android 13; Pixel 8 Pro Build/TQ3A.230901.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.179 Mobile Safari/537.36",
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    secChUaPlatform: '"Android"',
    secChUaMobile: "?1",
    acceptLanguage: "en-IN,en;q=0.9,hi;q=0.8",
  },
  {
    name: "Chrome 125 Windows",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    secChUa: '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    secChUaPlatform: '"Windows"',
    secChUaMobile: "?0",
    acceptLanguage: "en-US,en;q=0.9,en-IN;q=0.8",
  },
  {
    name: "Chrome 124 macOS",
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    secChUaPlatform: '"macOS"',
    secChUaMobile: "?0",
    acceptLanguage: "en-IN,en-GB;q=0.9,en;q=0.8",
  },
];

type BrowserProfile = (typeof CHROME_PROFILES)[number];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function delay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.round(minMs + Math.random() * (maxMs - minMs));
  return new Promise((r) => setTimeout(r, ms));
}

export interface FetchOptions {
  url: string;
  profile?: BrowserProfile;
  referer?: string;
  extraHeaders?: Record<string, string>;
  timeout?: number;
  acceptJson?: boolean;
  method?: "GET" | "POST";
  body?: string;
}

export interface FetchResult {
  ok: boolean;
  status: number;
  text: string;
  headers: Record<string, string>;
}

export async function humanFetch(opts: FetchOptions): Promise<FetchResult> {
  const profile = opts.profile ?? pickRandom(CHROME_PROFILES);
  const timeout = opts.timeout ?? 10000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const h: [string, string][] = [];
  h.push(["accept", opts.acceptJson
    ? "application/json, text/plain, */*"
    : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
  ]);
  h.push(["accept-language", profile.acceptLanguage]);
  if (profile.secChUa) h.push(["sec-ch-ua", profile.secChUa]);
  if (profile.secChUaMobile) h.push(["sec-ch-ua-mobile", profile.secChUaMobile]);
  if (profile.secChUaPlatform) h.push(["sec-ch-ua-platform", profile.secChUaPlatform]);
  h.push(["sec-fetch-dest", opts.acceptJson ? "empty" : "document"]);
  h.push(["sec-fetch-mode", opts.acceptJson ? "cors" : "navigate"]);
  h.push(["sec-fetch-site", opts.referer ? "same-origin" : "none"]);
  if (!opts.acceptJson) h.push(["upgrade-insecure-requests", "1"]);
  h.push(["user-agent", profile.ua]);
  if (opts.referer) h.push(["referer", opts.referer]);
  if (opts.extraHeaders) {
    for (const [k, v] of Object.entries(opts.extraHeaders)) h.push([k, v]);
  }

  const headers = new Headers();
  for (const [k, v] of h) {
    if (v !== undefined && v !== "") headers.set(k, v);
  }

  try {
    const res = await fetch(opts.url, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body,
      cache: "no-store",
      signal: controller.signal,
      redirect: "follow",
    });

    let text: string;
    const encoding = res.headers.get("content-encoding");
    if (encoding === "gzip") {
      try {
        const buf = Buffer.from(await res.arrayBuffer());
        text = gunzipSync(buf).toString("utf-8");
      } catch { text = await res.text(); }
    } else {
      text = await res.text();
    }

    const respHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { respHeaders[k] = v; });
    return { ok: res.ok, status: res.status, text, headers: respHeaders };
  } catch {
    return { ok: false, status: 0, text: "", headers: {} };
  } finally {
    clearTimeout(timer);
  }
}

export async function humanNavigate(
  homepageUrl: string,
  targetUrl: string,
  opts?: { extraHeaders?: Record<string, string>; acceptJson?: boolean; delayMs?: [number, number] }
): Promise<FetchResult> {
  const profile = pickRandom(CHROME_PROFILES);
  await humanFetch({ url: homepageUrl, profile, timeout: 8000 });
  const [min, max] = opts?.delayMs ?? [150, 500];
  await delay(min, max);
  return humanFetch({
    url: targetUrl,
    referer: homepageUrl,
    profile,
    extraHeaders: opts?.extraHeaders,
    acceptJson: opts?.acceptJson ?? true,
    timeout: 10000,
  });
}

export async function humanDeepNavigate(
  steps: string[],
  opts?: { extraHeaders?: Record<string, string>; acceptJson?: boolean }
): Promise<FetchResult> {
  if (steps.length < 2) {
    return humanFetch({ url: steps[0], acceptJson: opts?.acceptJson });
  }
  const profile = pickRandom(CHROME_PROFILES);
  for (let i = 0; i < steps.length - 1; i++) {
    await humanFetch({ url: steps[i], profile, referer: i > 0 ? steps[i - 1] : undefined, timeout: 8000 });
    await delay(100, 300);
  }
  return humanFetch({
    url: steps[steps.length - 1],
    referer: steps[steps.length - 2],
    profile,
    extraHeaders: opts?.extraHeaders,
    acceptJson: opts?.acceptJson,
    timeout: 10000,
  });
}

export async function tryStrategies(
  strategies: Array<{ name: string; fn: () => Promise<FetchResult> }>
): Promise<{ response: FetchResult; strategy: string } | null> {
  for (const strategy of strategies) {
    try {
      const response = await strategy.fn();
      if (response.ok && response.text.length > 200) {
        return { response, strategy: strategy.name };
      }
    } catch { /* next */ }
  }
  return null;
}

export function getRandomProfile(): BrowserProfile {
  return pickRandom(CHROME_PROFILES);
}


// ═══════════════════════════════════════════════════════════
// NOVA v2: Product Resolver — resolves search URLs to real
// product pages with images for each marketplace
// ═══════════════════════════════════════════════════════════

export type ResolvedProduct = {
  productUrl: string | null;   // Real single-product page URL
  imageUrl: string | null;     // Product thumbnail image
  resolvedTitle: string | null; // Actual product title from page
};

/**
 * Step 1: Fetch search page → extract first product link + image
 * Step 2: If no image, fetch product page → extract og:image
 */
export async function resolveProduct(searchUrl: string): Promise<ResolvedProduct> {
  try {
    const host = new URL(searchUrl).hostname.toLowerCase();

    if (host.includes("myntra")) return resolveMyntra(searchUrl);
    if (host.includes("amazon")) return resolveAmazon(searchUrl);
    if (host.includes("flipkart") && !host.includes("shopsy")) return resolveFlipkart(searchUrl);
    if (host.includes("shopsy")) return resolveShopsy(searchUrl);
    if (host.includes("nykaa")) return resolveNykaa(searchUrl);
    if (host.includes("ajio")) return resolveAjio(searchUrl);

    return { productUrl: null, imageUrl: null, resolvedTitle: null };
  } catch {
    return { productUrl: null, imageUrl: null, resolvedTitle: null };
  }
}

// ─── MYNTRA ───
// Search page has __myx JSON with landingPageUrl
// Product page has og:image with real product photo
async function resolveMyntra(searchUrl: string): Promise<ResolvedProduct> {
  const searchRes = await humanFetch({ url: searchUrl, timeout: 12000 });
  if (!searchRes.ok) return { productUrl: null, imageUrl: null, resolvedTitle: null };

  const html = searchRes.text;

  // Extract first product landing URL
  const landingMatch = html.match(/"landingPageUrl"\s*:\s*"([^"]+)"/);
  if (!landingMatch) return { productUrl: null, imageUrl: null, resolvedTitle: null };

  const path = landingMatch[1].replace(/\\u002F/g, "/");
  const productUrl = `https://www.myntra.com/${path}`;

  // Extract title from product data
  const titleMatch = html.match(/"productName"\s*:\s*"([^"]+)"/);

  // Now fetch the product page for og:image (real product photo)
  await delay(200, 500);
  const prodRes = await humanFetch({ url: productUrl, timeout: 12000 });
  let imageUrl: string | null = null;
  if (prodRes.ok) {
    const ogMatch = prodRes.text.match(/property="og:image"\s*content="([^"]+)"/)
      ?? prodRes.text.match(/content="([^"]+)"\s*property="og:image"/);
    if (ogMatch?.[1]) {
      imageUrl = ogMatch[1];
    } else {
      // Fallback: h_ image pattern
      const hMatch = prodRes.text.match(/"(https:\/\/assets\.myntassets\.com\/h_[^"]+)"/);
      if (hMatch?.[1]) imageUrl = hMatch[1];
    }
  }

  return {
    productUrl,
    imageUrl,
    resolvedTitle: titleMatch?.[1]?.replace(/\\u0026/g, "&") ?? null,
  };
}

// ─── AMAZON ───
// Must use mobile UA to get real results. Desktop gets captcha.
async function resolveAmazon(searchUrl: string): Promise<ResolvedProduct> {
  // Force mobile profile for Amazon (desktop gets blocked)
  const mobileProfile = CHROME_PROFILES[0]; // Android Samsung
  const res = await humanFetch({ url: searchUrl, timeout: 12000, profile: mobileProfile });
  if (!res.ok) return { productUrl: null, imageUrl: null, resolvedTitle: null };

  const html = res.text;

  // Extract first ASIN
  const asinMatch = html.match(/data-asin="([A-Z0-9]{10})"/);
  const productUrl = asinMatch ? `https://www.amazon.in/dp/${asinMatch[1]}` : null;

  // Extract product images (skip SVGs and sprites)
  const allImgs = [...html.matchAll(/src="(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/g)]
    .map(m => m[1])
    .filter(u => !u.endsWith(".svg") && !u.includes("sprite"));

  let imageUrl = allImgs[0] ?? null;
  // Upgrade to higher res
  if (imageUrl) {
    imageUrl = imageUrl.replace(/\._[^.]+_\./, "._SL500_.");
  }

  return {
    productUrl,
    imageUrl,
    resolvedTitle: null,
  };
}

// ─── FLIPKART ───
// Search page has product links with /p/itm pattern and rukminim images
async function resolveFlipkart(searchUrl: string): Promise<ResolvedProduct> {
  const res = await humanFetch({ url: searchUrl, timeout: 12000 });
  if (!res.ok) return { productUrl: null, imageUrl: null, resolvedTitle: null };

  const html = res.text;

  // Extract first product link
  const linkMatch = html.match(/href="(\/[^"]*\/p\/itm[^"]+)"/);
  const productUrl = linkMatch ? `https://www.flipkart.com${linkMatch[1].replace(/&amp;/g, "&")}` : null;

  // Extract first product image
  const imgMatch = html.match(/src="(https:\/\/rukminim[12][^"]+)"/);
  let imageUrl = imgMatch?.[1] ?? null;

  // Get higher res: change /128/128 or /312/312 to /416/416
  if (imageUrl) {
    imageUrl = imageUrl.replace(/\/\d+\/\d+\//, "/416/416/");
  }

  // Title
  const titleMatch = html.match(/class="[^"]*KzDlHZ[^"]*"[^>]*>([^<]+)/);

  return {
    productUrl,
    imageUrl,
    resolvedTitle: titleMatch?.[1]?.trim() ?? null,
  };
}

// ─── SHOPSY ───
// Similar to Flipkart but on shopsy.in domain
async function resolveShopsy(searchUrl: string): Promise<ResolvedProduct> {
  const res = await humanFetch({ url: searchUrl, timeout: 12000 });
  if (!res.ok) return { productUrl: null, imageUrl: null, resolvedTitle: null };

  const html = res.text;

  const linkMatch = html.match(/href="(\/[^"]*\/p\/itm[^"]+)"/);
  const productUrl = linkMatch ? `https://www.shopsy.in${linkMatch[1].replace(/&amp;/g, "&")}` : null;

  const imgMatch = html.match(/src="(https:\/\/rukminim[12][^"]+)"/);
  let imageUrl = imgMatch?.[1] ?? null;
  if (imageUrl) imageUrl = imageUrl.replace(/\/\d+\/\d+\//, "/416/416/");

  return {
    productUrl,
    imageUrl,
    resolvedTitle: null,
  };
}

// ─── NYKAA ───
// Search page has product links with /p/ pattern
async function resolveNykaa(searchUrl: string): Promise<ResolvedProduct> {
  const res = await humanFetch({ url: searchUrl, timeout: 12000 });
  if (!res.ok) return { productUrl: null, imageUrl: null, resolvedTitle: null };

  const html = res.text;

  // Product link
  const linkMatch = html.match(/href="(\/[^"]*\/p\/\d+[^"]*)"/);
  const productUrl = linkMatch ? `https://www.nykaa.com${linkMatch[1].replace(/&amp;/g, "&")}` : null;

  // Product image
  const imgMatch = html.match(/src="(https:\/\/images-static\.nykaa\.com\/media\/catalog\/product\/[^"]+)"/);
  let imageUrl = imgMatch?.[1] ?? null;
  // Get larger image
  if (imageUrl) {
    imageUrl = imageUrl.replace(/tr:w-\d+,h-\d+/, "tr:w-400,h-400");
  }

  return {
    productUrl,
    imageUrl,
    resolvedTitle: null,
  };
}

// ─── AJIO ───
// Search page renders client-side. Try fetching the API directly.
async function resolveAjio(searchUrl: string): Promise<ResolvedProduct> {
  // Ajio uses client-side rendering, try their internal API
  const u = new URL(searchUrl);
  const query = u.searchParams.get("text") || "";
  if (!query) return { productUrl: null, imageUrl: null, resolvedTitle: null };

  const apiUrl = `https://www.ajio.com/api/search?text=${encodeURIComponent(query)}&curated=true&curatedid=&gridColumns=3&from=0&size=1`;
  const res = await humanFetch({
    url: apiUrl,
    acceptJson: true,
    timeout: 10000,
    referer: searchUrl,
  });

  if (!res.ok) {
    // Fallback: fetch HTML page
    const htmlRes = await humanFetch({ url: searchUrl, timeout: 12000 });
    if (!htmlRes.ok) return { productUrl: null, imageUrl: null, resolvedTitle: null };
    const ogImg = htmlRes.text.match(/property="og:image"\s*content="([^"]+)"/);
    return {
      productUrl: null,
      imageUrl: ogImg?.[1] ?? null,
      resolvedTitle: null,
    };
  }

  try {
    const data = JSON.parse(res.text);
    const products = data?.products || [];
    if (products.length === 0) return { productUrl: null, imageUrl: null, resolvedTitle: null };

    const first = products[0];
    const productUrl = first.url ? `https://www.ajio.com${first.url}` : null;
    const imageUrl = first.images?.[0]?.url
      ? `https://assets.ajio.com/medias/${first.images[0].url}`
      : null;

    return {
      productUrl,
      imageUrl,
      resolvedTitle: first.name ?? null,
    };
  } catch {
    return { productUrl: null, imageUrl: null, resolvedTitle: null };
  }
}

/**
 * Batch resolve products with concurrency control.
 * Returns map of searchUrl -> ResolvedProduct
 */
export async function batchResolveProducts(
  urls: string[],
  concurrency = 2
): Promise<Record<string, ResolvedProduct>> {
  const results: Record<string, ResolvedProduct> = {};

  for (let i = 0; i < urls.length; i += concurrency) {
    const batch = urls.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const result = await resolveProduct(url);
        return { url, result };
      })
    );
    for (const { url, result } of batchResults) {
      results[url] = result;
    }
    // Rate limit between batches
    if (i + concurrency < urls.length) {
      await delay(500, 1500);
    }
  }

  return results;
}
