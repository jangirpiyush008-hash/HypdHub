/**
 * Telegram Web Scraper
 *
 * Reads public Telegram channels via the t.me/s/<handle> preview page.
 * No MTProto. No session string. No DC handshake. No cloud-IP shadow-ban.
 * Just plain HTTP HTML scraping that works from every IP on the planet.
 *
 * Why this exists:
 *   The MTProto pull (lib/integrations/telegram.ts) hangs mid-handshake
 *   from GitHub Actions runner IPs — TCP connects, LAYER 198 negotiates,
 *   then the auth payload never returns. Confirmed across 4s, 30s, and
 *   useWSS:true configurations. Telegram silently rate-limits or blocks
 *   raw MTProto from cloud egress; this is a known and irrecoverable
 *   problem for free CI environments.
 *
 *   The `t.me/s/<channel>` URL serves the last ~20 messages of any public
 *   channel as server-rendered HTML, designed for SEO and link previews.
 *   It needs no auth, has no rate-limit traps, and returns within ~1s
 *   per channel. Trade-off: only works for channels with a public handle
 *   (no `+invite-hash` or `addlist/` channels), which is fine — most
 *   high-value Indian deal channels publish handles for reach.
 *
 * Output: InternetDeal[] tagged with Marketplace inferred from each URL.
 * Pushes through the same upsertDeals(..., "telegram") pipeline as the
 * MTProto path, so downstream code is unchanged.
 */

import { InternetDeal } from "@/lib/types";
import { humanFetch, getRandomProfile } from "./human-agent";

type Marketplace = InternetDeal["marketplace"];

// Subset of telegram.ts's channel list that have public handles. Private
// invite-hash channels and addlists can't be read without MTProto, so
// we skip them entirely from this scraper. The handles below cover the
// strongest Flipkart/Myntra/Shopsy posters in the original config.
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

const HOST_TO_MARKETPLACE: Array<[RegExp, Marketplace]> = [
  [/(?:^|\.)myntra\.com$/i, "Myntra"],
  [/(?:^|\.)flipkart\.com$/i, "Flipkart"],
  [/(?:^|\.)shopsy\.in$/i, "Shopsy"],
  [/(?:^|\.)ajio\.com$/i, "Ajio"],
  [/(?:^|\.)nykaa\.com$/i, "Nykaa"],
  [/(?:^|\.)meesho\.com$/i, "Meesho"],
];

function classifyHost(rawUrl: string): Marketplace | null {
  try {
    const host = new URL(rawUrl).hostname;
    for (const [re, mp] of HOST_TO_MARKETPLACE) {
      if (re.test(host)) return mp;
    }
  } catch {
    /* unparseable */
  }
  return null;
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

function pickFirstTitle(text: string, fallbackUrl: string): string {
  const lines = text
    .split("\n")
    .map((l) => l.trim())
    .filter((l) => l.length > 4)
    .filter((l) => !/^https?:\/\//i.test(l))
    // Drop pure "₹399" / emoji-only lines
    .filter((l) => /[A-Za-z]{3,}/.test(l));
  if (lines.length > 0) return lines[0].slice(0, 140);
  try {
    const slug = new URL(fallbackUrl).pathname.split("/").filter(Boolean).pop() || "Deal";
    return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  } catch {
    return "Marketplace Deal";
  }
}

function extractPrices(text: string) {
  const matches = Array.from(text.matchAll(/(?:₹|rs\.?|inr)\s*([0-9][0-9,]{1,7})/gi))
    .map((m) => Number(m[1].replace(/,/g, "")))
    .filter((n) => Number.isFinite(n) && n >= 30 && n <= 1_000_000);
  if (matches.length === 0) return { currentPrice: null, originalPrice: null };
  matches.sort((a, b) => a - b);
  return {
    currentPrice: matches[0],
    originalPrice: matches.length > 1 ? matches[matches.length - 1] : null,
  };
}

type RawMessage = { html: string; text: string; image: string | null; ts: string | null };

/**
 * Parse the t.me/s/<handle> HTML into individual message blocks.
 *
 * Telegram's preview pages structure each message inside
 * `<div class="tgme_widget_message_text ...">`. We extract that text
 * (which preserves URLs as anchor hrefs) plus the immediately preceding
 * photo URL when present.
 */
function parseChannelHtml(html: string): RawMessage[] {
  const out: RawMessage[] = [];

  // Each message wrapper contains the text block + optional photo
  const wrapperRe = /<div\s+class="tgme_widget_message_wrap[^"]*"[^>]*>([\s\S]*?)<\/div>\s*<\/div>\s*<\/div>/gi;
  let m: RegExpExecArray | null;
  while ((m = wrapperRe.exec(html))) {
    const block = m[1];

    // Text block
    const textMatch = block.match(
      /<div\s+class="tgme_widget_message_text[^"]*"[^>]*>([\s\S]*?)<\/div>/i,
    );
    const rawHtml = textMatch ? textMatch[1] : "";
    const text = stripTags(rawHtml).replace(/\s+\n/g, "\n").trim();

    // Photo (lazy-loaded as background-image inline style)
    const photoMatch = block.match(
      /class="tgme_widget_message_photo_wrap[^"]*"[^>]*style="[^"]*background-image:url\(['"]?([^'")]+)/i,
    );
    const image = photoMatch ? photoMatch[1] : null;

    // Timestamp
    const tsMatch = block.match(/<time\s+[^>]*datetime="([^"]+)"/i);
    const ts = tsMatch ? tsMatch[1] : null;

    if (text || image) out.push({ html: rawHtml, text, image, ts });
  }

  return out;
}

function extractUrls(rawHtml: string, plainText: string): string[] {
  const urls = new Set<string>();
  // Anchor hrefs preserve full URLs even when message text truncates them
  const anchorRe = /href=["']([^"']+)["']/gi;
  let m: RegExpExecArray | null;
  while ((m = anchorRe.exec(rawHtml))) {
    const u = m[1];
    if (/^https?:\/\//i.test(u)) urls.add(u);
  }
  // Bare URLs in the plain text (for messages without anchors)
  for (const m2 of plainText.matchAll(/https?:\/\/[^\s)]+/gi)) urls.add(m2[0]);
  return Array.from(urls);
}

function buildDeal(opts: {
  marketplace: Marketplace;
  url: string;
  title: string;
  imageUrl: string | null;
  currentPrice: number | null;
  originalPrice: number | null;
  ts: string | null;
}): InternetDeal | null {
  if (!opts.currentPrice || opts.currentPrice < 30 || opts.currentPrice > 1_000_000) return null;
  const original = opts.originalPrice && opts.originalPrice > opts.currentPrice ? opts.originalPrice : null;
  const discount = original
    ? Math.round(((original - opts.currentPrice) / original) * 100)
    : null;

  let score = 12;
  if (opts.currentPrice < 500) score += 20;
  else if (opts.currentPrice < 1000) score += 15;
  else if (opts.currentPrice < 2000) score += 10;
  if (discount && discount > 50) score += 25;
  else if (discount && discount > 30) score += 15;
  else if (discount && discount > 15) score += 8;

  const seenAt = opts.ts || new Date().toISOString();
  return {
    id: `tg-${opts.marketplace}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    title: opts.title.slice(0, 140),
    marketplace: opts.marketplace,
    category: guessCategory(opts.title),
    imageUrl: opts.imageUrl,
    currentPrice: opts.currentPrice,
    originalPrice: original,
    discountPercent: discount,
    originalUrl: opts.url,
    canonicalUrl: opts.url,
    mentionsCount: 1,
    channelsCount: 1,
    channelNames: [opts.marketplace],
    firstSeenAt: seenAt,
    lastSeenAt: seenAt,
    freshnessHours: 0,
    score,
    confidenceScore: 75,
    validationStatus: "validated",
    stockStatus: "in_stock",
    sourceEvidence: [`${opts.marketplace} listing`],
  };
}

/**
 * Pull deals from every public deal channel via t.me/s/<handle>.
 *
 * Per-channel timeout 8s. Channels iterated sequentially with a small
 * jitter delay between them so we look like a normal SEO crawler, not
 * a hammering script.
 */
export async function fetchTelegramWebDeals(): Promise<InternetDeal[]> {
  const collected: InternetDeal[] = [];
  const seen = new Set<string>();
  const referer = "https://t.me/";

  for (const handle of PUBLIC_HANDLES) {
    const channelUrl = `https://t.me/s/${handle}`;
    try {
      const profile = getRandomProfile();
      const res = await humanFetch({
        url: channelUrl,
        profile,
        referer,
        timeout: 8000,
      });
      if (!res.ok || !res.text) {
        console.log(`[telegram-web] ${handle} → status=${res.status}`);
        continue;
      }

      const messages = parseChannelHtml(res.text);
      let perChannelDeals = 0;

      for (const msg of messages) {
        const urls = extractUrls(msg.html, msg.text);
        if (urls.length === 0) continue;
        const { currentPrice, originalPrice } = extractPrices(msg.text);
        const title = pickFirstTitle(msg.text, urls[0]);

        for (const url of urls) {
          const marketplace = classifyHost(url);
          if (!marketplace) continue;
          // Dedupe: same product URL can post in multiple channels
          const key = url.split("?")[0];
          if (seen.has(key)) continue;

          const deal = buildDeal({
            marketplace,
            url,
            title,
            imageUrl: msg.image,
            currentPrice,
            originalPrice,
            ts: msg.ts,
          });
          if (!deal) continue;
          seen.add(key);
          collected.push(deal);
          perChannelDeals += 1;
        }
      }

      console.log(`[telegram-web] ${handle} → ${messages.length} msgs, ${perChannelDeals} deals`);

      // Light jitter between channels — looks more like a human crawler
      await new Promise((r) => setTimeout(r, 200 + Math.random() * 400));
    } catch (e) {
      console.log(
        `[telegram-web] ${handle} → threw ${e instanceof Error ? e.message : String(e)}`,
      );
    }
  }

  return collected;
}
