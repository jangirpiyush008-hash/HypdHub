/**
 * Next.js instrumentation hook — runs once when the server boots.
 * We use it to start an in-process 2-hour cron that re-scrapes every
 * marketplace and refreshes the deal cache. This guarantees deals stay
 * fresh even when there's no inbound traffic to trigger lazy refresh.
 */
export async function register() {
  // Only register on the Node runtime (not Edge), and not during build.
  if (process.env.NEXT_RUNTIME !== "nodejs") return;
  if (process.env.NODE_ENV !== "production") return;

  const { scrapeMarketplaceDeals } = await import("@/lib/integrations/marketplace-scraper");
  const { clearScraperMemCache } = await import("@/lib/scraper/index");

  const TWO_HOURS_MS = 2 * 60 * 60 * 1000;

  const runRefresh = async (label: string) => {
    const t0 = Date.now();
    try {
      clearScraperMemCache();
      const res = await scrapeMarketplaceDeals({ force: true });
      console.log(`[cron:${label}] scraped ${res.deals.length} deals from ${res.sources.length} sources in ${Date.now() - t0}ms`);
    } catch (e) {
      console.error(`[cron:${label}] failed after ${Date.now() - t0}ms:`, e instanceof Error ? e.message : e);
    }
  };

  // Initial run after a short delay so server is fully up.
  setTimeout(() => { void runRefresh("boot"); }, 30_000);

  // Every 2 hours thereafter.
  setInterval(() => { void runRefresh("interval"); }, TWO_HOURS_MS);

  console.log("[cron] 2-hour deal refresh scheduled");
}
