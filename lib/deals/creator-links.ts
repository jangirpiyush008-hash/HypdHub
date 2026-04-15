/**
 * Batch convert marketplace URLs into creator-specific HYPD short links.
 *
 * Why this exists:
 *   generateHypdConversion() in lib/hypd-links.ts produces synchronous,
 *   deterministic-hash links that embed a hardcoded HYPD af_siteid — so they
 *   work for unauthenticated users but they do NOT carry the logged-in
 *   creator's attribution. HYPD's real affiliate tracking lives behind their
 *   /api/app/influencer/deeplink endpoint, which requires the creator's
 *   session cookies and returns a proper per-creator hypd_link.
 *
 * What this does:
 *   - Given a list of deals and an authenticated creator, calls HYPD's
 *     deeplink API for every unique source URL.
 *   - Bounded concurrency so we don't hammer HYPD.
 *   - Per-creator memory cache (6h TTL) so refreshes don't re-convert
 *     links we've already resolved.
 *   - Falls back cleanly to the synchronous generator when the API is
 *     unreachable or the URL isn't a supported marketplace.
 */
import { InternetDeal } from "@/lib/types";
import { CreatorProfile } from "@/lib/types";
import { UpstreamCookie, convertHypdMarketplaceLinkWithCookies } from "@/lib/hypd-server";
import { generateHypdConversion, extractHypdClickId } from "@/lib/hypd-links";

type Cached = { shortLink: string; expandedLink: string; fetchedAt: number };
// Keyed by `${creatorId}::${sourceUrl}` — short links are stable per creator
// so a long TTL is fine. The cache lives in module memory, flushed on deploy.
const linkCache = new Map<string, Cached>();
const TTL_MS = 6 * 60 * 60 * 1000;

const MAX_CONCURRENCY = 6;

async function runPool<T, R>(items: T[], limit: number, fn: (item: T) => Promise<R>): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let cursor = 0;
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (true) {
      const i = cursor++;
      if (i >= items.length) return;
      results[i] = await fn(items[i]);
    }
  });
  await Promise.all(workers);
  return results;
}

function cacheKey(creatorId: string, url: string) {
  return `${creatorId}::${url.split("?")[0]}`;
}

async function convertOne(
  sourceUrl: string,
  creator: CreatorProfile,
  cookies: UpstreamCookie[]
): Promise<Cached | null> {
  const key = cacheKey(creator.id, sourceUrl);
  const hit = linkCache.get(key);
  if (hit && Date.now() - hit.fetchedAt < TTL_MS) return hit;

  // Skip unsupported URLs entirely.
  const probe = generateHypdConversion(sourceUrl, creator.hypdUsername);
  if (!probe || probe.marketplace === "Unsupported") return null;
  if (probe.marketplace === "HYPD Store") {
    const entry: Cached = {
      shortLink: probe.shortLink,
      expandedLink: probe.expandedLink,
      fetchedAt: Date.now(),
    };
    linkCache.set(key, entry);
    return entry;
  }

  try {
    const payload = (await convertHypdMarketplaceLinkWithCookies(sourceUrl, creator, cookies)) as Record<string, unknown>;
    const shortLink = String(payload.hypd_link ?? probe.shortLink);
    // Extract the REAL HYPD-issued clickid from the short-link path — this is
    // the server-issued random id, not our deterministic local hash.
    const realClickId = extractHypdClickId(shortLink) ?? undefined;
    // Creator's HYPD user id becomes the af_siteid for all tracking.
    const creatorHypdUserId = creator.hypdUserId;

    // Rebuild the expanded link locally with creator-scoped siteid + real
    // clickid so the user can copy a link that matches what HYPD's own
    // redirect would produce.
    const localized = generateHypdConversion(sourceUrl, creator.hypdUsername, {
      creatorHypdUserId,
      realClickId,
    });
    const expandedLink = localized?.expandedLink ?? probe.expandedLink;

    const entry: Cached = { shortLink, expandedLink, fetchedAt: Date.now() };
    linkCache.set(key, entry);
    return entry;
  } catch {
    // Network / HYPD-side failure — return null so caller falls back to local.
    return null;
  }
}

/**
 * Enrich a list of deals with creator-scoped HYPD links.
 * Mutates nothing — returns a new array.
 */
export async function convertDealsForCreator(
  deals: InternetDeal[],
  creator: CreatorProfile,
  cookies: UpstreamCookie[]
): Promise<InternetDeal[]> {
  // Dedupe URLs so the same product hit by multiple sources only costs one API call.
  const urlsToConvert = Array.from(
    new Set(
      deals
        .map((d) => d.originalUrl || d.canonicalUrl)
        .filter((u): u is string => Boolean(u) && !u.includes("hypd.store"))
    )
  );

  const converted = await runPool(urlsToConvert, MAX_CONCURRENCY, (url) =>
    convertOne(url, creator, cookies).then((result) => [url, result] as const)
  );

  const urlMap = new Map<string, Cached | null>(converted);

  return deals.map((deal) => {
    const url = deal.originalUrl || deal.canonicalUrl;
    if (!url) return deal;

    const hit = urlMap.get(url);
    if (hit) {
      return {
        ...deal,
        affiliateShortLink: hit.shortLink,
        canonicalUrl: hit.shortLink,    // click-through target is the HYPD short link
        originalUrl: hit.expandedLink,   // "full link" for copy/display retains creator params
      };
    }

    // Fallback: synchronous generator — still uses the creator's hypdUserId
    // as siteid so attribution lands on them even when HYPD API is unreachable.
    const local = generateHypdConversion(url, creator.hypdUsername, {
      creatorHypdUserId: creator.hypdUserId,
    });
    if (!local || local.marketplace === "Unsupported") return deal;
    return {
      ...deal,
      affiliateShortLink: local.shortLink,
      canonicalUrl: local.shortLink,
      originalUrl: local.expandedLink,
    };
  });
}
