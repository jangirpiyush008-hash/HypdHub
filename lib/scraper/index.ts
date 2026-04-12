/**
 * Scraper Orchestrator
 *
 * Coordinates all marketplace agents:
 * 1. Check persistent cache — serve if fresh
 * 2. Run human-agent scrapers in parallel
 * 3. Fall back to curated deals for any marketplace that fails
 * 4. Persist results to file cache for fast future loads
 */

import { InternetDeal } from "@/lib/types";
import { getCachedDeals, setCachedDeals, isCacheFresh, getAllCachedDeals } from "./deal-cache";
import {
  scrapeMyntra,
  scrapeFlipkart,
  scrapeAmazon,
  scrapeAjio,
  scrapeNykaa,
  scrapeShopsy,
} from "./marketplace-agents";
import { getCuratedDeals } from "./curated-deals";

type MarketplaceName = "Myntra" | "Flipkart" | "Amazon" | "Ajio" | "Nykaa" | "Shopsy";

const SCRAPERS: Array<{ name: MarketplaceName; fn: () => Promise<InternetDeal[]> }> = [
  { name: "Myntra", fn: scrapeMyntra },
  { name: "Flipkart", fn: scrapeFlipkart },
  { name: "Amazon", fn: scrapeAmazon },
  { name: "Ajio", fn: scrapeAjio },
  { name: "Nykaa", fn: scrapeNykaa },
  { name: "Shopsy", fn: scrapeShopsy },
];

// In-memory cache with 10-minute TTL
const CACHE_FRESH_MINUTES = 10;
let memCache: { deals: InternetDeal[]; sources: string[]; scrapedAt: string; fetchedAt: number } | null = null;
const MEM_CACHE_MS = CACHE_FRESH_MINUTES * 60 * 1000;

/**
 * Main entry point — returns deals from all marketplaces.
 * Uses layered caching: memory → file → scrape → curated fallback
 */
export async function scrapeAllMarketplaces(): Promise<{
  deals: InternetDeal[];
  sources: string[];
  scrapedAt: string;
}> {
  const now = Date.now();

  // Layer 1: In-memory cache
  if (memCache && now - memCache.fetchedAt < MEM_CACHE_MS) {
    return memCache;
  }

  // Layer 2: Check persistent file cache (only use if deals have images — skip stale broken data)
  const fileCached = await getAllCachedDeals();
  const hasImages = fileCached.deals.some((d) => d.imageUrl);
  if (fileCached.deals.length > 20 && hasImages) {
    const result = { deals: fileCached.deals, sources: fileCached.sources, scrapedAt: fileCached.updatedAt, fetchedAt: now };
    memCache = result;
    refreshAllInBackground().catch(() => {});
    return result;
  }

  // Layer 3: Fresh scrape all marketplaces
  return freshScrapeAll();
}

async function freshScrapeAll(): Promise<{
  deals: InternetDeal[];
  sources: string[];
  scrapedAt: string;
}> {
  const now = Date.now();
  const allDeals: InternetDeal[] = [];
  const sources: string[] = [];

  const results = await Promise.all(
    SCRAPERS.map(async (s) => {
      // Check per-marketplace cache first
      const cached = await getCachedDeals(s.name);
      if (cached && isCacheFresh(cached, CACHE_FRESH_MINUTES)) {
        return { name: s.name, deals: cached.deals, source: cached.source, strategy: cached.strategy };
      }

      // Try live scraping
      try {
        const deals = await s.fn();
        if (deals.length > 0) {
          // Save to persistent cache
          await setCachedDeals(s.name, {
            deals,
            source: "live",
            scrapedAt: new Date().toISOString(),
            strategy: "human-agent",
          });
          return { name: s.name, deals, source: "live" as const, strategy: "human-agent" };
        }
      } catch {
        // Scraping failed
      }

      // Try curated fallback
      const curated = getCuratedDeals(s.name);
      await setCachedDeals(s.name, {
        deals: curated,
        source: "curated",
        scrapedAt: new Date().toISOString(),
        strategy: "fallback",
      });
      return { name: s.name, deals: curated, source: "curated" as const, strategy: "fallback" };
    })
  );

  for (const r of results) {
    allDeals.push(...r.deals);
    sources.push(`${r.name}: ${r.deals.length} (${r.source}${r.strategy ? ` via ${r.strategy}` : ""})`);
  }

  allDeals.sort((a, b) => b.score - a.score);

  const result = { deals: allDeals, sources, scrapedAt: new Date().toISOString(), fetchedAt: now };
  memCache = result;
  return result;
}

/**
 * Background refresh — scrapes each marketplace and updates cache
 */
async function refreshAllInBackground(): Promise<void> {
  for (const s of SCRAPERS) {
    try {
      const cached = await getCachedDeals(s.name);
      if (cached && isCacheFresh(cached, CACHE_FRESH_MINUTES)) continue;

      const deals = await s.fn();
      if (deals.length > 0) {
        await setCachedDeals(s.name, {
          deals,
          source: "live",
          scrapedAt: new Date().toISOString(),
          strategy: "human-agent",
        });
      }
    } catch {
      // Skip failed marketplace, keep existing cache
    }
  }
  // Invalidate memory cache so next request gets fresh data
  memCache = null;
}
