/**
 * Scraper Orchestrator
 *
 * Fast-first approach:
 * 1. Serve curated deals INSTANTLY (no waiting)
 * 2. Background scrape replaces curated with live data
 * 3. Cache live results for 10 minutes
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

const ALL_MARKETPLACE_NAMES: MarketplaceName[] = ["Myntra", "Flipkart", "Amazon", "Ajio", "Nykaa", "Shopsy"];

// In-memory cache
const CACHE_FRESH_MINUTES = 10;
let memCache: { deals: InternetDeal[]; sources: string[]; scrapedAt: string; fetchedAt: number } | null = null;
const MEM_CACHE_MS = CACHE_FRESH_MINUTES * 60 * 1000;

/**
 * Main entry — returns deals instantly.
 * Uses: memory cache → file cache → curated (instant) + background scrape
 */
export async function scrapeAllMarketplaces(): Promise<{
  deals: InternetDeal[];
  sources: string[];
  scrapedAt: string;
}> {
  const now = Date.now();

  // Layer 1: In-memory cache (instant)
  if (memCache && now - memCache.fetchedAt < MEM_CACHE_MS) {
    return memCache;
  }

  // Layer 2: File cache (fast disk read)
  const fileCached = await getAllCachedDeals();
  if (fileCached.deals.length > 10) {
    const result = { deals: fileCached.deals, sources: fileCached.sources, scrapedAt: fileCached.updatedAt, fetchedAt: now };
    memCache = result;
    // Refresh in background if cache is getting old
    refreshAllInBackground().catch(() => {});
    return result;
  }

  // Layer 3: Serve curated instantly, scrape in background
  const allDeals: InternetDeal[] = [];
  const sources: string[] = [];
  for (const name of ALL_MARKETPLACE_NAMES) {
    const curated = getCuratedDeals(name);
    allDeals.push(...curated);
    sources.push(`${name}: ${curated.length} (curated)`);
  }
  allDeals.sort((a, b) => b.score - a.score);

  const result = { deals: allDeals, sources, scrapedAt: new Date().toISOString(), fetchedAt: now };
  memCache = result;

  // Kick off background scrape to replace curated with live data
  refreshAllInBackground().catch(() => {});

  return result;
}

/**
 * Background refresh — scrapes each marketplace and updates cache.
 * Next API call will get live data from memory/file cache.
 */
let refreshRunning = false;
async function refreshAllInBackground(): Promise<void> {
  if (refreshRunning) return;
  refreshRunning = true;

  try {
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
        } else {
          // Save curated as fallback
          const curated = getCuratedDeals(s.name);
          await setCachedDeals(s.name, {
            deals: curated,
            source: "curated",
            scrapedAt: new Date().toISOString(),
            strategy: "fallback",
          });
        }
      } catch {
        // Skip failed marketplace
      }
    }
    // Clear memory cache so next request picks up fresh file cache
    memCache = null;
  } finally {
    refreshRunning = false;
  }
}
