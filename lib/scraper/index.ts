/**
 * Scraper Orchestrator
 *
 * Since deals are now in Supabase, this module only handles:
 * 1. Background scraping of LIVE marketplace data
 * 2. Caching scraped results
 *
 * It does NOT return curated deals — those come from Supabase.
 */

import { InternetDeal } from "@/lib/types";
import { getCachedDeals, setCachedDeals, isCacheFresh, getAllCachedDeals } from "./deal-cache";
import {
  scrapeMyntra,
  scrapeFlipkart,
  scrapeAjio,
  scrapeNykaa,
  scrapeShopsy,
  scrapeMeesho,
} from "./marketplace-agents";

type MarketplaceName = "Myntra" | "Flipkart" | "Meesho" | "Ajio" | "Nykaa" | "Shopsy";

const SCRAPERS: Array<{ name: MarketplaceName; fn: () => Promise<InternetDeal[]> }> = [
  { name: "Myntra", fn: scrapeMyntra },
  { name: "Flipkart", fn: scrapeFlipkart },
  { name: "Meesho", fn: scrapeMeesho },
  { name: "Ajio", fn: scrapeAjio },
  { name: "Nykaa", fn: scrapeNykaa },
  { name: "Shopsy", fn: scrapeShopsy },
];

const CACHE_FRESH_MINUTES = 10;
let memCache: { deals: InternetDeal[]; sources: string[]; scrapedAt: string; fetchedAt: number } | null = null;
const MEM_CACHE_MS = CACHE_FRESH_MINUTES * 60 * 1000;

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

  // Layer 2: File cache (scraped data only)
  const fileCached = await getAllCachedDeals();
  if (fileCached.deals.length > 5) {
    const result = { deals: fileCached.deals, sources: fileCached.sources, scrapedAt: fileCached.updatedAt, fetchedAt: now };
    memCache = result;
    refreshAllInBackground().catch(() => {});
    return result;
  }

  // No cached scraped data — return empty, scrape in background
  // (Supabase DB deals are the primary source now, not curated fallback)
  const result = { deals: [] as InternetDeal[], sources: ["No scraped data yet"], scrapedAt: new Date().toISOString(), fetchedAt: now };
  memCache = result;
  refreshAllInBackground().catch(() => {});
  return result;
}

/**
 * Background: scrape live data from marketplaces
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
            strategy: "nova-agent",
          });
        }
      } catch {
        // Skip failed marketplace
      }
    }
    memCache = null;
  } finally {
    refreshRunning = false;
  }
}
