/**
 * Product Image Resolver
 *
 * Uses NOVA agent to fetch product pages and extract OG images.
 * Results cached to disk so images persist across restarts.
 */

import { humanFetch } from "./human-agent";
import { readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

const CACHE_DIR = join(process.cwd(), ".deal-cache");
const IMAGE_CACHE_FILE = join(CACHE_DIR, "image-cache.json");

// In-memory cache
let imageCache: Record<string, string | null> = {};
let loaded = false;

async function loadCache() {
  if (loaded) return;
  try {
    const raw = await readFile(IMAGE_CACHE_FILE, "utf-8");
    imageCache = JSON.parse(raw);
  } catch { imageCache = {}; }
  loaded = true;
}

async function saveCache() {
  try {
    await mkdir(CACHE_DIR, { recursive: true });
    await writeFile(IMAGE_CACHE_FILE, JSON.stringify(imageCache, null, 2));
  } catch { /* skip */ }
}

/**
 * Fetch a URL and extract the OG image or first product image.
 */
async function fetchImage(url: string): Promise<string | null> {
  try {
    const res = await humanFetch({ url, timeout: 8000 });
    if (!res.ok || !res.text) return null;

    const html = res.text;

    // 1. Try og:image meta tag
    const ogMatch = html.match(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']+)["']/i)
      ?? html.match(/<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i);
    if (ogMatch?.[1] && ogMatch[1].startsWith("http")) {
      return ogMatch[1];
    }

    // 2. Try twitter:image
    const twMatch = html.match(/<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i);
    if (twMatch?.[1] && twMatch[1].startsWith("http")) {
      return twMatch[1];
    }

    // 3. Amazon-specific: main product image
    const amzMatch = html.match(/"hiRes"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (amzMatch?.[1]) return amzMatch[1];
    const amzMatch2 = html.match(/"large"\s*:\s*"(https:\/\/m\.media-amazon\.com\/images\/I\/[^"]+)"/);
    if (amzMatch2?.[1]) return amzMatch2[1];

    // 4. Myntra-specific: search image
    const myntraMatch = html.match(/"searchImage"\s*:\s*"(https?:\/\/[^"]+)"/);
    if (myntraMatch?.[1]) return myntraMatch[1];

    // 5. Flipkart/Shopsy: rukminim image
    const fkMatch = html.match(/src=["'](https:\/\/rukminim[12][^"']+)["']/);
    if (fkMatch?.[1]) return fkMatch[1];

    // 6. Nykaa image
    const nykaaMatch = html.match(/src=["'](https:\/\/images-static\.nykaa\.com[^"']+)["']/i);
    if (nykaaMatch?.[1]) return nykaaMatch[1];

    // 7. Ajio image
    const ajioMatch = html.match(/src=["'](https:\/\/assets\.ajio\.com\/medias[^"']+)["']/i);
    if (ajioMatch?.[1]) return ajioMatch[1];

    // 8. Generic: first large product image
    const genericImg = html.match(/<img[^>]+src=["'](https:\/\/[^"']+(?:\.jpg|\.webp|\.png)[^"']*)["'][^>]*(?:alt|title)=["'][^"']{5,}/i);
    if (genericImg?.[1]) return genericImg[1];

    return null;
  } catch {
    return null;
  }
}

/**
 * Resolve product image for a URL. Uses cache.
 */
export async function resolveProductImage(url: string): Promise<string | null> {
  await loadCache();

  // Check cache
  if (url in imageCache) {
    return imageCache[url];
  }

  // Fetch and extract
  const image = await fetchImage(url);
  imageCache[url] = image;
  saveCache().catch(() => {});
  return image;
}

/**
 * Batch resolve images for multiple URLs.
 * Runs in parallel with concurrency limit.
 */
export async function batchResolveImages(
  urls: string[],
  concurrency = 3
): Promise<Record<string, string | null>> {
  await loadCache();

  const results: Record<string, string | null> = {};
  const toFetch: string[] = [];

  // Check cache first
  for (const url of urls) {
    if (url in imageCache) {
      results[url] = imageCache[url];
    } else {
      toFetch.push(url);
    }
  }

  // Fetch uncached in batches
  for (let i = 0; i < toFetch.length; i += concurrency) {
    const batch = toFetch.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(async (url) => {
        const img = await fetchImage(url);
        imageCache[url] = img;
        return { url, img };
      })
    );
    for (const { url, img } of batchResults) {
      results[url] = img;
    }
  }

  saveCache().catch(() => {});
  return results;
}
