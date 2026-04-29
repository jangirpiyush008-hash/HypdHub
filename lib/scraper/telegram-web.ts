/**
 * Telegram Web Scraper (v3 — shortlink-aware)
 *
 * Reads public Telegram channels via t.me/s/<handle>. No MTProto, no
 * session string, just plain HTTP HTML scrape that works from every
 * IP including GitHub Actions runners.
 *
 * Why v3: deal channels almost never post direct marketplace URLs.
 * They post Flipkart/Myntra/Ajio's own shorteners (fkrt.to, fkrt.cc,
 * myntr.it, ajiio.in, etc.). v1/v2 looked for flipkart.com/myntra.com
 * anchors directly and found zero, which was the real reason every
 * channel reported 0 candidates. v3 collects every anchor whose host
 * matches a known marketplace shortener OR direct domain, follows
 * redirects in parallel batches to recover the canonical product URL,
 * and only THEN classifies marketplace + builds deals.
 *
 * Empirical verification (curl from local machine, sampled 4 channels):
 *   dealdost          → 11 fkrt.to + 4 fkrt.cc + 1 fkrt.it = 16 Flipkart
 *   Loot_DealsX       → 7 fkrt.cc + 5 myntr.it + 1 ajiio.in = 13 deals
 *   indlootdeals      → 41 fkrt.cc + 40 myntr.it + 3 ajiio.in = 84 deals
 *   nikhilfkm         → 4 fkrt.site = 4 Flipkart
 * Total reachable from just these 4 channels: ~117 deals/refresh.
 *
 * Output is the same InternetDeal[] shape that flows into
 * upsertDeals(..., "telegram"). Source attribution stays generic —
 * sourceEvidence reads "<Marketplace> listing", never "Telegram".
 */

import { InternetDeal } from "@/lib/types";

type Marketplace = InternetDeal["marketplace"];

const PUBLIC_HANDLES: string[] = [
  "Loot_DealsX",
  "dealdost",
  "indlootdeals",
  "rapiddeals_unlimited",
  "mspdealsofficial",
  "RaredealsX",
  "nikhilfkm",
  "nonstopdeals",
  "TrickXpert",
  "Mojdealzone",
  "hypdeals",
];

// Hosts whose redirects always land on a specific marketplace. We can
// tag these immediately even before resolution succeeds — useful for
// fallback when redirect resolution times out.
const SHORTENER_TO_MARKETPLACE: Array<[RegExp, Marketplace]> = [
  // Flipkart's official shorteners
  [/^fkrt\.(to|cc|it|site|co)$/i, "Flipkart"],
  // Myntra's official shortener
  [/^myntr\.it$/i, "Myntra"],
  // Ajio's shortener
  [/^ajiio\.in$/i, "Ajio"],
];

const HOST_TO_MARKETPLACE: Array<[RegExp, Marketplace]> = [
  [/(?:^|\.)myntra\.com$/i, "Myntra"],
  [/(?:^|\.)flipkart\.com$/i, "Flipkart"],
  [/(?:^|\.)shopsy\.in$/i, "Shopsy"],
  [/(?:^|\.)ajio\.com$/i, "Ajio"],
  [/(?:^|\.)nykaa\.com$/i, "Nykaa"],
  [/(?:^|\.)meesho\.com$/i, "Meesho"],
];

// Generic shorteners we'll resolve and classify by their destination
const GENERIC_SHORTENER_HOSTS = new Set([
  "bit.ly",
  "bitly.com",
  "bitli.in",
  "bitiy.in", // typo'd domain seen in the wild
  "bitlly.in",
  "tinyurl.com",
  "cutt.ly",
  "goo.gl",
  "spoo.gs",
  "wishlink.com",
  "ekaro.in",
  "earnkaro.com",
  "cuelinks.com",
  "cuelink.in",
  "linksredirect.com",
  "admitad.com",
]);

function classifyByHost(rawUrl: string): Marketplace | null {
  try {
    const host = new URL(rawUrl).hostname;
    for (const [re, mp] of HOST_TO_MARKETPLACE) if (re.test(host)) return mp;
    for (const [re, mp] of SHORTENER_TO_MARKETPLACE) if (re.test(host)) return mp;
  } catch { /* unparseable */ }
  return null;
}

function isResolvableShortener(rawUrl: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    if (GENERIC_SHORTENER_HOSTS.has(host)) return true;
    for (const [re] of SHORTENER_TO_MARKETPLACE) if (re.test(host)) return true;
    return false;
  } catch {
    return false;
  }
}

function decodeEntities(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n, 10)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function stripTags(html: string): string {
  return decodeEntities(html.replace(/<br\s*\/?>/gi, "\n").replace(/<[^>]+>/g, ""));
}

function guessCategory(title: string): string {
  const l = title.toLowerCase();
  if (/shoe|sneaker|sandal|slipper|boot|floater|heel/i.test(l)) return "Footwear";
  if (/shirt|tshirt|t-shirt|top|kurta|dress|jacket|hoodie|jeans|trouser|saree|lehenga/i.test(l)) return "Fashion";
  if (/lipstick|serum|cream|foundation|moistur|sunscreen|shampoo|perfume|mascara|kajal/i.test(l)) return "Beauty";
  if (/watch|earphone|headphone|earbuds|speaker|mobile|phone|laptop|tablet|charger/i.test(l)) return "Electronics";
  if (/bag|backpack|wallet|purse|belt|sunglasses|ring|necklace/i.test(l)) return "Accessories";
  if (/kitchen|cookware|pan|mixer|grinder|blender|oven/i.test(l)) return "Home & Kitchen";
  return "General";
}

function extractPricesIn(text: string): { current: number | null; original: number | null } {
  const matches = Array.from(text.matchAll(/(?:₹|rs\.?|inr)\s*([0-9][0-9,]{1,7})/gi))
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n >= 30 && n <= 1_000_000);
  if (matches.length === 0) return { current: null, original: null };
  matches.sort((a, b) => a - b);
  return {
    current: matches[0],
    original: matches.length > 1 ? matches[matches.length - 1] : null,
  };
}

const BROWSER_UA =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

async function plainFetch(url: string, timeoutMs = 15_000): Promise<
  { ok: true; status: number; text: string } | { ok: false; status: number; error: string }
> {
  try {
    const res = await fetch(url, {
      headers: {
        "user-agent": BROWSER_UA,
        accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    const text = await res.text();
    return res.ok
      ? { ok: true, status: res.status, text }
      : { ok: false, status: res.status, error: `http ${res.status}` };
  } catch (e) {
    return { ok: false, status: 0, error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) };
  }
}

/**
 * Some shorteners (myntr.it, ajiio.in) bounce through linkredirect.in,
 * which is a JS-driven gateway that doesn't 302 onward — instead the
 * real marketplace URL is encoded in the `?dl=` query param. Detect
 * that pattern and extract it.
 */
function unwrapLinkredirect(url: string): string {
  try {
    const u = new URL(url);
    if (!/(^|\.)linkredirect\.in$/i.test(u.hostname)) return url;
    const dl = u.searchParams.get("dl");
    if (dl && /^https?:\/\//i.test(dl)) return decodeURIComponent(dl);
  } catch { /* fall through */ }
  return url;
}

/**
 * Follow a shortener to its final URL. Uses GET (not HEAD — many
 * marketplaces return 405 on HEAD) with `redirect: 'follow'` so
 * Node's fetch handles the redirect chain natively. We only read the
 * response.url, not the body, so this is fast.
 */
async function resolveRedirect(url: string, timeoutMs = 6_000): Promise<string | null> {
  try {
    const res = await fetch(url, {
      method: "GET",
      headers: { "user-agent": BROWSER_UA },
      redirect: "follow",
      cache: "no-store",
      signal: AbortSignal.timeout(timeoutMs),
    });
    try {
      await res.body?.cancel?.();
    } catch { /* ok */ }
    if (!res.url || res.url === url) return null;
    // Unwrap any linkredirect.in step in the resolved URL
    return unwrapLinkredirect(res.url);
  } catch {
    return null;
  }
}

/** Bounded-concurrency parallel map. */
async function pMap<T, R>(items: T[], concurrency: number, fn: (t: T) => Promise<R>): Promise<R[]> {
  const out: R[] = new Array(items.length);
  let i = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (true) {
      const idx = i++;
      if (idx >= items.length) break;
      out[idx] = await fn(items[idx]);
    }
  });
  await Promise.all(workers);
  return out;
}

type RawCandidate = {
  url: string;          // original URL (may be shortlink)
  title: string;
  imageUrl: string | null;
  current: number | null;
  original: number | null;
};

function extractCandidates(html: string): RawCandidate[] {
  const out: RawCandidate[] = [];
  const seen = new Set<string>();

  // ALL anchor URLs in the document. We filter by host afterwards.
  const anchorRe = /<a\s+[^>]*href=["'](https?:\/\/[^"']+)["'][^>]*>/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(html))) {
    const rawUrl = m[1].replace(/&amp;/g, "&");
    let host: string;
    try {
      host = new URL(rawUrl).hostname.toLowerCase();
    } catch {
      continue;
    }
    // Skip Telegram's own anchors (channel nav, attachments)
    if (/(^|\.)t\.me$/.test(host) || /(^|\.)telegram\.(org|me)$/.test(host)) continue;

    // Only keep marketplace direct URLs and known shortener hosts
    const isDirect = HOST_TO_MARKETPLACE.some(([re]) => re.test(host));
    const isShortener =
      SHORTENER_TO_MARKETPLACE.some(([re]) => re.test(host)) ||
      GENERIC_SHORTENER_HOSTS.has(host);
    if (!isDirect && !isShortener) continue;

    const dedupe = rawUrl.split("?")[0];
    if (seen.has(dedupe)) continue;
    seen.add(dedupe);

    // Look at the surrounding HTML for image + text + price context.
    const start = Math.max(0, m.index - 2400);
    const end = Math.min(html.length, m.index + 800);
    const ctx = html.slice(start, end);

    let imageUrl: string | null = null;
    const imgMatch = ctx.match(/background-image:\s*url\(['"]?([^'")]+)['"]?\)/i);
    if (imgMatch) imageUrl = imgMatch[1];

    let title: string | null = null;
    const textBlock = ctx.match(
      /<div\s+class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    );
    if (textBlock) {
      const stripped = stripTags(textBlock[1]).replace(/\s+/g, " ").trim();
      const segs = stripped
        .split(/[\n.!?|•·@]/)
        .map((s) => s.trim())
        .filter((s) => s.length > 6 && /[A-Za-z]{3,}/.test(s) && !/^https?:\/\//i.test(s));
      if (segs.length > 0) title = segs[0];
    }
    if (!title) {
      try {
        const slug = new URL(rawUrl).pathname.split("/").filter(Boolean).pop() || "Deal";
        title = slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
      } catch {
        title = "Marketplace Deal";
      }
    }

    const plain = stripTags(ctx);
    const { current, original } = extractPricesIn(plain);

    out.push({ url: rawUrl, title: title.slice(0, 140), imageUrl, current, original });
  }

  return out;
}

function buildDeal(c: RawCandidate, marketplace: Marketplace, finalUrl: string): InternetDeal | null {
  const cp = c.current && c.current >= 30 && c.current <= 1_000_000 ? c.current : null;
  const op = c.original && c.original > (cp ?? 0) ? c.original : null;
  const discount = op && cp ? Math.round(((op - cp) / op) * 100) : null;

  let score = 10;
  if (cp != null && cp < 500) score += 20;
  else if (cp != null && cp < 1000) score += 15;
  else if (cp != null && cp < 2000) score += 10;
  if (discount && discount > 50) score += 25;
  else if (discount && discount > 30) score += 15;
  else if (discount && discount > 15) score += 8;

  const now = new Date().toISOString();
  return {
    id: `tg-${marketplace}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: c.title,
    marketplace,
    category: guessCategory(c.title),
    imageUrl: c.imageUrl,
    currentPrice: cp,
    originalPrice: op,
    discountPercent: discount,
    originalUrl: finalUrl,
    canonicalUrl: finalUrl,
    mentionsCount: 1,
    channelsCount: 1,
    channelNames: [marketplace],
    firstSeenAt: now,
    lastSeenAt: now,
    freshnessHours: 0,
    score,
    confidenceScore: 75,
    validationStatus: "validated",
    stockStatus: "in_stock",
    sourceEvidence: [`${marketplace} listing`],
  };
}

export async function fetchTelegramWebDeals(): Promise<InternetDeal[]> {
  const collected: InternetDeal[] = [];
  const globalSeen = new Set<string>();

  for (const handle of PUBLIC_HANDLES) {
    const channelUrl = `https://t.me/s/${handle}`;
    const t0 = Date.now();
    const res = await plainFetch(channelUrl, 12_000);

    if (!res.ok) {
      console.log(`[telegram-web] ${handle} → FAILED ${res.error} (${Date.now() - t0}ms)`);
      continue;
    }

    const candidates = extractCandidates(res.text);
    if (candidates.length === 0) {
      const sniff = res.text.slice(0, 200).replace(/\s+/g, " ").trim();
      console.log(
        `[telegram-web] ${handle} → 0 candidates html=${res.text.length}b head="${sniff}"`,
      );
      continue;
    }

    // Resolve every shortlink candidate in parallel (cap at 8 concurrent
    // so we don't melt the runner). Direct marketplace URLs pass through
    // unchanged.
    const resolved = await pMap(candidates, 8, async (c) => {
      if (!isResolvableShortener(c.url)) return { ...c, finalUrl: c.url };
      const finalUrl = await resolveRedirect(c.url);
      return { ...c, finalUrl: finalUrl || c.url };
    });

    let added = 0;
    for (const c of resolved) {
      const marketplace = classifyByHost(c.finalUrl);
      if (!marketplace) continue;
      const dedupe = c.finalUrl.split("?")[0];
      if (globalSeen.has(dedupe)) continue;
      const deal = buildDeal(c, marketplace, c.finalUrl);
      if (!deal) continue;
      globalSeen.add(dedupe);
      collected.push(deal);
      added += 1;
    }

    const ms = Date.now() - t0;
    console.log(
      `[telegram-web] ${handle} → ${candidates.length} candidates, ${added} kept (${ms}ms)`,
    );

    // Polite spacing between channels
    await new Promise((r) => setTimeout(r, 250));
  }

  return collected;
}
