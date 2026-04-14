/**
 * Scraper Orchestrator
 *
 * Fast-first approach:
 * 1. Serve curated deals INSTANTLY (no waiting)
 * 2. Background: resolve product images from URLs
 * 3. Background: scrape live data from marketplaces
 * 4. Cache everything for 10 minutes
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
import { batchResolveImages } from "./image-resolver";

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

  // Layer 2: File cache
  const fileCached = await getAllCachedDeals();
  if (fileCached.deals.length > 10) {
    const result = { deals: fileCached.deals, sources: fileCached.sources, scrapedAt: fileCached.updatedAt, fetchedAt: now };
    memCache = result;
    refreshAllInBackground().catch(() => {});
    return result;
  }

  // Layer 3: Serve curated instantly
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

  // Background: resolve images + scrape live data
  resolveImagesInBackground(allDeals).catch(() => {});
  refreshAllInBackground().catch(() => {});

  return result;
}

/**
 * Background: fetch product images for deals that don't have them
 */
let imageResolveRunning = false;
async function resolveImagesInBackground(deals: InternetDeal[]): Promise<void> {
  if (imageResolveRunning) return;
  imageResolveRunning = true;

  try {
    const urlsToResolve = deals
      .filter((d) => !d.imageUrl && d.originalUrl)
      .map((d) => d.originalUrl);

    if (urlsToResolve.length === 0) return;

    const images = await batchResolveImages(urlsToResolve, 2);

    // Update deals in memory cache with resolved images
    if (memCache) {
      let updated = false;
      for (const deal of memCache.deals) {
        if (!deal.imageUrl && deal.originalUrl && images[deal.originalUrl]) {
          deal.imageUrl = images[deal.originalUrl];
          updated = true;
        }
      }
      if (updated) {
        // Also update file cache per marketplace
        const byMarketplace: Record<string, InternetDeal[]> = {};
        for (const deal of memCache.deals) {
          if (!byMarketplace[deal.marketplace]) byMarketplace[deal.marketplace] = [];
          byMarketplace[deal.marketplace].push(deal);
        }
        for (const [mp, mpDeals] of Object.entries(byMarketplace)) {
          await setCachedDeals(mp, {
            deals: mpDeals,
            source: "curated+images",
            scrapedAt: new Date().toISOString(),
            strategy: "image-resolver",
          });
        }
      }
    }
  } catch {
    // Image resolution failed, no problem
  } finally {
    imageResolveRunning = false;
  }
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
          // Resolve images for scraped deals too
          const urls = deals.filter((d) => !d.imageUrl && d.originalUrl).map((d) => d.originalUrl);
          if (urls.length > 0) {
            const images = await batchResolveImages(urls, 2);
            for (const deal of deals) {
              if (!deal.imageUrl && deal.originalUrl && images[deal.originalUrl]) {
                deal.imageUrl = images[deal.originalUrl];
              }
            }
          }

          await setCachedDeals(s.name, {
            deals,
            source: "live",
            scrapedAt: new Date().toISOString(),
            strategy: "nova-agent",
          });
        } else {
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
    memCache = null;
  } finally {
    refreshRunning = false;
  }
}
