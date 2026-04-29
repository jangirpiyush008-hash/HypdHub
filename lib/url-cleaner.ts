/**
 * URL Cleaner — strips competitor/affiliate parameters from marketplace URLs
 * and unwraps competitor short links (Wishlink, LaylaFaym, etc.) to their
 * underlying marketplace product URL.
 *
 * Used before generating HYPD affiliate links so the final URL is clean and
 * contains only HYPD's own tracking params.
 */

// Hosts that belong to competitor affiliate networks (NOT marketplaces).
// These need to be resolved/unwrapped to get the actual product URL.
const COMPETITOR_SHORT_HOSTS = new Set([
  "wishlink.com",
  "www.wishlink.com",
  "wshl.nk",
  "laylafaym.com",
  "www.laylafaym.com",
  "lyla.link",
  "faym.link",
  "earnkaro.com",
  "www.earnkaro.com",
  "ekaro.in",
  "bitli.in",
  "inrdeals.com",
  "www.inrdeals.com",
  "inrd.in",
  "cuelinks.com",
  "www.cuelinks.com",
  "cue.lk",
  "admitad.com",
  "www.admitad.com",
  "ad.admitad.com",
  "lnkfi.re",
]);

// Query-param keys that are competitor / generic affiliate tracking noise.
// Stripped from the final URL so only HYPD params remain.
const COMPETITOR_PARAM_KEYS = new Set([
  // Wishlink / AppsFlyer-style tracking
  "af_pmod_priority",
  "af_ref",
  "af_xp",
  "af_force_deeplink",
  "af_click_lookback",
  "af_siteid",
  "af_sub1",
  "af_sub2",
  "af_sub3",
  "af_sub4",
  "af_sub5",
  "af_adset",
  "af_c_id",
  "af_adset_id",
  "af_ad",
  "af_channel",
  "af_keywords",
  "atgSessionId",
  "advertising_id",
  "referrer",
  "is_retargeting",
  "deep_link_value",
  "deep_link_sub1",
  "deep_link_sub2",
  "clickid",
  "click_id",
  "c",
  "pid",
  "host_internal",
  "product_name",
  // UTM — strip all, HYPD adds its own
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "utm_id",
  // Other affiliate networks. NOTE: keep all entries lowercase — the
  // membership check below normalises the URL param name to lowercase,
  // so any mixed-case entry here would silently miss. (We had this bug
  // — affExtParam1/affExtParam2 were stored mixed-case and slipped
  // through, leaking the EarnKaro tracking id "ENKR..." into the
  // public URL we shipped to the browser.)
  "affid",
  "affextparam1",
  "affextparam2",
  "cmpid",
  "tagtag_uid",
  "offer_id",
  "attribution_window",
  "return_cancellation_window",
  "tag",
  "linkcode",
  "ref_",
  "ascsubtag",
  "fromekarobanner",
  "fromhomeajio",
  "_appid",
  "_refid",
  "sc_channel",
  "cl_source",
  "icmp",
  // Generic creator/poster identity slots — these are how upstream
  // channels stamp their attribution into Flipkart/Myntra URLs. We
  // never want them in the URL we ship.
  "shareid",
  "source",
  "src",
  "sub_id",
]);

// Marketplace-specific params we should KEEP (product ids, variants, filters).
// If a param is in this list, we keep it even if it looks generic.
const KEEP_PARAM_KEYS = new Set([
  // Myntra
  "sort",
  "rf",
  "p",
  // Flipkart
  "pid",          // NOTE: pid is ambiguous — keep for Flipkart, strip elsewhere (handled below)
  "lid",
  "marketplace",
  "q",
  // Amazon
  "th",
  "psc",
  "k",
  // Nykaa
  "page_no",
  "sort",
  // Ajio
  "query",
  "text",
  "gridColumns",
  "segmentIds",
  "classifier",
]);

/**
 * Strip competitor params from a marketplace URL. Returns clean URL string.
 */
export function stripCompetitorParams(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();
    const keysToDelete: string[] = [];

    url.searchParams.forEach((_, key) => {
      const lower = key.toLowerCase();
      // Hard-strip all competitor/affiliate/UTM keys
      if (COMPETITOR_PARAM_KEYS.has(lower)) {
        // Exception: Flipkart/Shopsy genuinely use `pid` & `lid` for products
        if ((lower === "pid" || lower === "lid") && (host.includes("flipkart") || host.includes("shopsy"))) {
          return;
        }
        keysToDelete.push(key);
        return;
      }
      // Drop any param whose value contains a competitor tag like "Wishlink", "EarnKaro", "LaylaFaym"
      const value = url.searchParams.get(key) || "";
      if (/wishlink|earnkaro|laylafaym|cuelinks|admitad|inrdeals/i.test(value)) {
        keysToDelete.push(key);
        return;
      }
    });

    for (const k of keysToDelete) url.searchParams.delete(k);
    return url.toString();
  } catch {
    return rawUrl;
  }
}

/**
 * Given a URL that might be a competitor deep link (e.g. Myntra URL with
 * Wishlink params including a deep_link_value), extract the underlying
 * marketplace URL.
 */
export function extractMarketplaceFromDeepLink(rawUrl: string): string {
  try {
    const url = new URL(rawUrl);

    // Wishlink / AppsFlyer style — the real destination is in deep_link_value
    const dlv = url.searchParams.get("deep_link_value");
    if (dlv) {
      // It's usually myntra://myntra.com/path?params — convert to https
      const schemeMatch = dlv.match(/^([a-z]+):\/\/([^/?#]+)(.*)$/i);
      if (schemeMatch) {
        const [, , hostAndPath, rest] = schemeMatch;
        // Ensure host has www + tld
        const inferredHost = inferHttpsHost(hostAndPath);
        return `https://${inferredHost}${rest}`;
      }
      if (dlv.startsWith("http")) return dlv;
    }

    return rawUrl;
  } catch {
    return rawUrl;
  }
}

function inferHttpsHost(host: string): string {
  const lower = host.toLowerCase();
  if (lower === "myntra.com") return "www.myntra.com";
  if (lower === "flipkart.com") return "www.flipkart.com";
  if (lower === "amazon.in") return "www.amazon.in";
  if (lower === "ajio.com") return "www.ajio.com";
  if (lower === "nykaa.com") return "www.nykaa.com";
  if (lower === "meesho.com") return "www.meesho.com";
  if (lower === "shopsy.in") return "www.shopsy.in";
  return host;
}

/**
 * Follow an HTTP redirect to resolve a competitor short link
 * (e.g. wishlink.com/share/ndge7f) to its destination URL.
 * Returns null if resolution failed.
 */
async function resolveShortLink(shortUrl: string, timeoutMs = 8000): Promise<string | null> {
  try {
    const controller = new AbortController();
    const t = setTimeout(() => controller.abort(), timeoutMs);
    try {
      // Use HEAD first (cheaper); fall back to GET on 405/404
      let res = await fetch(shortUrl, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
        },
      });
      if (!res.ok || res.url === shortUrl) {
        res = await fetch(shortUrl, {
          method: "GET",
          redirect: "follow",
          signal: controller.signal,
          headers: {
            "user-agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
          },
        });
      }
      if (res.url && res.url !== shortUrl) return res.url;
      return null;
    } finally {
      clearTimeout(t);
    }
  } catch {
    return null;
  }
}

/**
 * Detect if a URL is a competitor short link that needs unwrapping.
 */
export function isCompetitorShortLink(rawUrl: string): boolean {
  try {
    const host = new URL(rawUrl).hostname.toLowerCase();
    return COMPETITOR_SHORT_HOSTS.has(host);
  } catch {
    return false;
  }
}

/**
 * Main entry: given ANY URL (competitor short, competitor deep, or plain
 * marketplace URL), return a CLEAN marketplace URL ready for HYPD conversion.
 *
 * Steps:
 *   1. If competitor short link → follow redirect to get destination
 *   2. If destination has deep_link_value → extract underlying marketplace URL
 *   3. Strip all competitor/affiliate/UTM params
 */
export async function cleanUrlForHypd(rawUrl: string): Promise<string> {
  let current = rawUrl.trim();
  if (!current) return current;

  // Step 1: Unwrap competitor short link
  if (isCompetitorShortLink(current)) {
    const resolved = await resolveShortLink(current);
    if (resolved) current = resolved;
  }

  // Step 2: Extract real marketplace URL from deep_link_value if present
  current = extractMarketplaceFromDeepLink(current);

  // Step 3: Strip competitor/affiliate params
  current = stripCompetitorParams(current);

  return current;
}

/**
 * Synchronous variant — cleans params & extracts deep_link_value but does NOT
 * follow HTTP redirects (so competitor short links pass through unchanged).
 * Useful for server-side batch processing where fetching every URL is too slow.
 */
export function cleanUrlForHypdSync(rawUrl: string): string {
  let current = rawUrl.trim();
  if (!current) return current;
  current = extractMarketplaceFromDeepLink(current);
  current = stripCompetitorParams(current);
  return current;
}
