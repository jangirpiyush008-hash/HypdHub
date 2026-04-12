/**
 * Persistent Deal Cache
 *
 * File-based cache that survives server restarts.
 * Falls back to in-memory cache if filesystem isn't available.
 */

import { readFile, writeFile, mkdir } from "fs/promises";
import path from "path";
import { InternetDeal } from "@/lib/types";

const CACHE_DIR = path.join(process.cwd(), ".deal-cache");
const CACHE_FILE = path.join(CACHE_DIR, "marketplace-deals.json");

// In-memory fallback
let memoryCache: CacheData | null = null;

interface CacheEntry {
  deals: InternetDeal[];
  source: "live" | "curated";
  scrapedAt: string;
  strategy?: string;
}

interface CacheData {
  version: number;
  updatedAt: string;
  marketplaces: Record<string, CacheEntry>;
}

async function ensureCacheDir() {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
  } catch {
    // ignore
  }
}

export async function readCache(): Promise<CacheData | null> {
  // Try file cache first
  try {
    const raw = await readFile(CACHE_FILE, "utf-8");
    const data = JSON.parse(raw) as CacheData;
    memoryCache = data;
    return data;
  } catch {
    // Fall back to memory cache
    return memoryCache;
  }
}

export async function writeCache(data: CacheData): Promise<void> {
  memoryCache = data;
  try {
    await ensureCacheDir();
    await writeFile(CACHE_FILE, JSON.stringify(data, null, 2), "utf-8");
  } catch {
    // Memory cache still works
  }
}

export async function getCachedDeals(marketplace: string): Promise<CacheEntry | null> {
  const cache = await readCache();
  if (!cache) return null;
  return cache.marketplaces[marketplace] ?? null;
}

export async function setCachedDeals(
  marketplace: string,
  entry: CacheEntry
): Promise<void> {
  let cache = await readCache();
  if (!cache) {
    cache = { version: 1, updatedAt: new Date().toISOString(), marketplaces: {} };
  }
  cache.marketplaces[marketplace] = entry;
  cache.updatedAt = new Date().toISOString();
  await writeCache(cache);
}

/**
 * Check if cached data for a marketplace is still fresh
 */
export function isCacheFresh(entry: CacheEntry, maxAgeMinutes: number): boolean {
  const scrapedAt = new Date(entry.scrapedAt).getTime();
  const now = Date.now();
  const ageMinutes = (now - scrapedAt) / (1000 * 60);
  return ageMinutes < maxAgeMinutes;
}

/**
 * Get all cached deals across all marketplaces
 */
export async function getAllCachedDeals(): Promise<{
  deals: InternetDeal[];
  sources: string[];
  updatedAt: string;
}> {
  const cache = await readCache();
  if (!cache) return { deals: [], sources: [], updatedAt: new Date().toISOString() };

  const deals: InternetDeal[] = [];
  const sources: string[] = [];

  for (const [marketplace, entry] of Object.entries(cache.marketplaces)) {
    deals.push(...entry.deals);
    sources.push(`${marketplace}: ${entry.deals.length} (${entry.source}${entry.strategy ? ` via ${entry.strategy}` : ""})`);
  }

  return { deals, sources, updatedAt: cache.updatedAt };
}
