/**
 * Aggregator Scraper Agents
 *
 * Plain-HTTP scrapers for affiliate aggregators (EarnKaro, Cashkaro).
 * These sites are SEO-friendly — server-rendered Next.js with __NEXT_DATA__
 * blobs — so they don't need Playwright and don't fingerprint datacenter
 * IPs the way Akamai-protected marketplaces do. They surface curated deals
 * for Flipkart, Myntra, Shopsy, Ajio, Nykaa, Amazon — the exact gap left
 * by Nova on GitHub Actions runners.
 *
 * Output: InternetDeal[] with marketplace tagged as the underlying merchant
 * (e.g. "Flipkart"), NOT the aggregator. The aggregator is invisible to
 * downstream code — these deals look identical to direct scrapes after
 * upsertDeals() runs. Source-evidence strings deliberately don't reference
 * the aggregator either; the URL goes through HYPD's affiliate converter
 * later, which strips competitor tags via lib/url-cleaner.ts.
 */

import { InternetDeal } from "@/lib/types";
import { humanFetch, getRandomProfile } from "./human-agent";

type Marketplace = InternetDeal["marketplace"];

// Merchant name → our internal marketplace key. Aggregators use varying casing
// and sometimes brand spellings ("Flipkart Mobile" etc), so we lowercase-match
// substrings rather than exact-equal.
const MERCHANT_TO_MARKETPLACE: Array<[RegExp, Marketplace]> = [
  [/myntra/i, "Myntra"],
  [/flipkart/i, "Flipkart"],
  [/shopsy/i, "Shopsy"],
  [/ajio/i, "Ajio"],
  [/nykaa/i, "Nykaa"],
  [/meesho/i, "Meesho"],
];

// URL-host → marketplace, used when the merchant string isn't reliable but
// the underlying redirect URL is.
const HOST_TO_MARKETPLACE: Array<[RegExp, Marketplace]> = [
  [/(?:^|\.)myntra\.com$/i, "Myntra"],
  [/(?:^|\.)flipkart\.com$/i, "Flipkart"],
  [/(?:^|\.)shopsy\.in$/i, "Shopsy"],
  [/(?:^|\.)ajio\.com$/i, "Ajio"],
  [/(?:^|\.)nykaa\.com$/i, "Nykaa"],
  [/(?:^|\.)meesho\.com$/i, "Meesho"],
];

function mapMerchant(label: string | null | undefined, fallbackUrl?: string): Marketplace | null {
  if (label) {
    for (const [re, mp] of MERCHANT_TO_MARKETPLACE) {
      if (re.test(label)) return mp;
    }
  }
  if (fallbackUrl) {
    try {
      const host = new URL(fallbackUrl).hostname;
      for (const [re, mp] of HOST_TO_MARKETPLACE) {
        if (re.test(host)) return mp;
      }
    } catch {
      // fall through
    }
  }
  return null;
}

/**
 * Pull the underlying merchant URL out of an aggregator-wrapped redirect.
 * If we can't find one, return the wrapper URL unchanged — the existing
 * /api/hypd/convert route already unwraps wishlink/earnkaro/cuelinks etc.
 */
function unwrapAggregatorUrl(raw: string): string {
  try {
    const u = new URL(raw);
    // Common patterns: ?url=…  ?redirect=…  ?dl=…  ?to=…
    for (const key of ["url", "redirect", "redirect_url", "dl", "to", "u", "deeplink"]) {
      const v = u.searchParams.get(key);
      if (v && /^https?:\/\//i.test(v)) return decodeURIComponent(v);
    }
  } catch {
    // not a URL we can parse
  }
  return raw;
}

function normalizeText(t: unknown): string {
  if (typeof t !== "string") return "";
  return t
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}

function parsePrice(raw: unknown): number | null {
  if (typeof raw === "number" && Number.isFinite(raw) && raw > 0) return Math.round(raw);
  if (typeof raw !== "string") return null;
  const m = raw.match(/[\d,]{1,9}/);
  if (!m) return null;
  const n = Number(m[0].replace(/,/g, ""));
  return Number.isFinite(n) && n > 0 ? n : null;
}

function guessCategory(title: string): string {
  const l = title.toLowerCase();
  if (/shoe|sneaker|sandal|slipper|boot|floater|heel/i.test(l)) return "Footwear";
  if (/shirt|tshirt|t-shirt|top|kurta|dress|jacket|hoodie|jeans|trouser|saree|lehenga/i.test(l)) return "Fashion";
  if (/lipstick|serum|cream|foundation|moistur|sunscreen|shampoo|perfume|mascara|kajal|eyeliner/i.test(l)) return "Beauty";
  if (/watch|earphone|headphone|earbuds|speaker|mobile|phone|laptop|tablet|charger|tv|monitor/i.test(l)) return "Electronics";
  if (/bag|backpack|wallet|purse|belt|sunglasses|ring|necklace/i.test(l)) return "Accessories";
  if (/kitchen|cookware|pan|mixer|grinder|blender|oven|fridge|washing/i.test(l)) return "Home & Kitchen";
  return "General";
}

type RawCandidate = {
  title: string;
  merchant?: string | null;
  url: string;
  imageUrl?: string | null;
  currentPrice?: number | null;
  originalPrice?: number | null;
};

function buildDeal(raw: RawCandidate): InternetDeal | null {
  const cleanedUrl = unwrapAggregatorUrl(raw.url);
  const marketplace = mapMerchant(raw.merchant ?? null, cleanedUrl);
  if (!marketplace) return null;

  const currentPrice = raw.currentPrice ?? null;
  if (!currentPrice || currentPrice < 30 || currentPrice > 1_000_000) return null;
  const title = normalizeText(raw.title);
  if (!title || title.length < 6) return null;

  const original = raw.originalPrice && raw.originalPrice > currentPrice ? raw.originalPrice : null;
  const discount = original
    ? Math.round(((original - currentPrice) / original) * 100)
    : null;

  let score = 12;
  if (currentPrice < 500) score += 20;
  else if (currentPrice < 1000) score += 15;
  else if (currentPrice < 2000) score += 10;
  if (discount && discount > 50) score += 25;
  else if (discount && discount > 30) score += 15;
  else if (discount && discount > 15) score += 8;

  const now = new Date().toISOString();
  return {
    id: `agg-${marketplace}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: title.slice(0, 120),
    marketplace,
    category: guessCategory(title),
    imageUrl: raw.imageUrl || null,
    currentPrice,
    originalPrice: original,
    discountPercent: discount,
    originalUrl: cleanedUrl,
    canonicalUrl: cleanedUrl,
    mentionsCount: 1,
    channelsCount: 1,
    // Channel name = the marketplace itself, never the aggregator. Keeps the
    // origin invisible in any UI that surfaces channel attribution.
    channelNames: [marketplace],
    firstSeenAt: now,
    lastSeenAt: now,
    freshnessHours: 0,
    score,
    confidenceScore: 75,
    validationStatus: "validated",
    stockStatus: "in_stock",
    // Generic label — never reveals the aggregator name.
    sourceEvidence: [`${marketplace} listing`],
  };
}

// ─────────────────────────────────────────────────────────────────────
// __NEXT_DATA__ extraction (works for any Next.js SSR site)
// ─────────────────────────────────────────────────────────────────────

function extractNextData(html: string): unknown | null {
  const m = html.match(/<script\s+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!m) return null;
  try {
    return JSON.parse(m[1]);
  } catch {
    return null;
  }
}

/**
 * Walk an arbitrary JSON tree looking for objects that "look like" a deal:
 * have a title-ish key, a price-ish key, and a URL-ish key. Aggregator
 * pages embed deals under varying paths (props.pageProps.deals, store, etc),
 * so a tree-walk is more resilient than a hardcoded path.
 */
function harvestCandidates(node: unknown, found: RawCandidate[], depth = 0): void {
  if (depth > 10 || !node) return;
  if (Array.isArray(node)) {
    for (const item of node) harvestCandidates(item, found, depth + 1);
    return;
  }
  if (typeof node !== "object") return;
  const obj = node as Record<string, unknown>;

  const title =
    (obj.title as string) ??
    (obj.name as string) ??
    (obj.productName as string) ??
    (obj.dealTitle as string) ??
    (obj.heading as string) ??
    null;

  const url =
    (obj.url as string) ??
    (obj.dealUrl as string) ??
    (obj.deeplink as string) ??
    (obj.shareableLink as string) ??
    (obj.redirectUrl as string) ??
    (obj.productUrl as string) ??
    null;

  const merchant =
    (obj.store as string) ??
    (obj.storeName as string) ??
    (obj.merchant as string) ??
    (obj.merchantName as string) ??
    (obj.retailer as string) ??
    null;

  const image =
    (obj.image as string) ??
    (obj.imageUrl as string) ??
    (obj.imgUrl as string) ??
    (obj.thumbnail as string) ??
    (obj.dealImage as string) ??
    null;

  const cp =
    parsePrice(obj.dealPrice) ??
    parsePrice(obj.salePrice) ??
    parsePrice(obj.price) ??
    parsePrice(obj.currentPrice) ??
    parsePrice(obj.offerPrice) ??
    parsePrice(obj.finalPrice);

  const op =
    parsePrice(obj.mrp) ??
    parsePrice(obj.originalPrice) ??
    parsePrice(obj.regularPrice) ??
    parsePrice(obj.listPrice) ??
    parsePrice(obj.strikePrice);

  if (typeof title === "string" && typeof url === "string" && cp) {
    found.push({
      title,
      url,
      merchant: typeof merchant === "string" ? merchant : null,
      imageUrl: typeof image === "string" ? image : null,
      currentPrice: cp,
      originalPrice: op ?? null,
    });
  }

  // Recurse into children regardless — a single object can have nested deals
  for (const v of Object.values(obj)) harvestCandidates(v, found, depth + 1);
}

// ─────────────────────────────────────────────────────────────────────
// Public scrapers
// ─────────────────────────────────────────────────────────────────────

/**
 * EarnKaro deals.
 *
 * Tries multiple URLs in priority order. We're chasing whichever surface is
 * still SSR'd; if EarnKaro flips a page to client-fetched JSON, that page
 * yields zero candidates and we move on silently.
 */
export async function scrapeEarnkaro(): Promise<InternetDeal[]> {
  const targets = [
    "https://earnkaro.com/deals",
    "https://earnkaro.com/deals/flipkart",
    "https://earnkaro.com/deals/myntra",
    "https://earnkaro.com/deals/ajio",
    "https://earnkaro.com/deals/amazon",
  ];
  return scrapeAggregatorTargets(targets, "https://earnkaro.com/");
}

/**
 * Cashkaro deals — same shape as EarnKaro, different host.
 */
export async function scrapeCashkaro(): Promise<InternetDeal[]> {
  const targets = [
    "https://cashkaro.com/deals",
    "https://cashkaro.com/stores/flipkart",
    "https://cashkaro.com/stores/myntra",
    "https://cashkaro.com/stores/ajio",
    "https://cashkaro.com/stores/nykaa",
  ];
  return scrapeAggregatorTargets(targets, "https://cashkaro.com/");
}

async function scrapeAggregatorTargets(targets: string[], referer: string): Promise<InternetDeal[]> {
  const collected: InternetDeal[] = [];
  const seen = new Set<string>();

  for (const url of targets) {
    try {
      const profile = getRandomProfile();
      const res = await humanFetch({
        url,
        profile,
        referer,
        timeout: 12000,
      });
      if (!res.ok || !res.text) continue;

      const candidates: RawCandidate[] = [];
      const nextData = extractNextData(res.text);
      if (nextData) harvestCandidates(nextData, candidates);

      // Fallback: scan inline JSON-LD product blocks
      if (candidates.length === 0) {
        const ldRe = /<script\s+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
        let m: RegExpExecArray | null;
        while ((m = ldRe.exec(res.text))) {
          try {
            harvestCandidates(JSON.parse(m[1]), candidates);
          } catch {
            // skip malformed block
          }
        }
      }

      for (const cand of candidates) {
        const deal = buildDeal(cand);
        if (!deal) continue;
        // Dedupe by canonical URL — same product appears on multiple pages
        const key = deal.canonicalUrl;
        if (seen.has(key)) continue;
        seen.add(key);
        collected.push(deal);
      }
    } catch {
      // never let one URL kill the whole pull
    }
  }

  return collected;
}
