/**
 * GitHub Actions worker entrypoint.
 *
 * Runs the full scraper (all marketplaces) once and writes results into
 * Supabase via the existing upsertDeals path. Designed to run on a cron
 * inside .github/workflows/scrape.yml — GitHub-hosted runners give us
 * residential-grade IPs that aren't blocked by Akamai/DataDome the way
 * Railway data-center IPs are.
 *
 * Required env (provided as repo secrets):
 *   - NEXT_PUBLIC_SUPABASE_URL
 *   - SUPABASE_SERVICE_ROLE_KEY
 */
// Run with: npx tsx scripts/run-scraper-worker.mjs
// (tsx transparently transpiles the .ts imports below)

// Playwright's CDP session occasionally emits a rejection AFTER a scraper
// has already returned (e.g. a queued event arrives once the browser was
// closed: "Target page, context or browser has been closed"). Node 20's
// default unhandledRejection behaviour is to crash the process, which
// would kill the whole parallel run mid-flight. Swallow + log instead.
process.on("unhandledRejection", (err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn("[worker] unhandled rejection (suppressed):", msg.slice(0, 200));
});
process.on("uncaughtException", (err) => {
  const msg = err instanceof Error ? err.message : String(err);
  console.warn("[worker] uncaught exception (suppressed):", msg.slice(0, 200));
});

const started = Date.now();
console.log("[worker] starting scrape run at", new Date().toISOString());

const {
  scrapeMyntra,
  scrapeFlipkart,
  scrapeAjio,
  scrapeNykaa,
  scrapeShopsy,
  scrapeMeesho,
} = await import("../lib/scraper/marketplace-agents.ts");
const { upsertDeals } = await import("../lib/scraper/supabase-deals.ts");

const SCRAPERS = [
  { name: "Myntra", fn: scrapeMyntra },
  { name: "Flipkart", fn: scrapeFlipkart },
  { name: "Meesho", fn: scrapeMeesho },
  { name: "Ajio", fn: scrapeAjio },
  { name: "Nykaa", fn: scrapeNykaa },
  { name: "Shopsy", fn: scrapeShopsy },
];

// Run all 6 marketplaces in parallel — independent Nova browsers, no
// shared state. Cuts wall-clock time from ~3min sequential to ~30-60s.
// Each marketplace is wrapped so one failure doesn't sink the run.
// Also stream per-marketplace upserts to Supabase as soon as each one
// finishes — so a later crash can't lose already-scraped data.
async function persistOne(name, deals) {
  if (!deals.length) return;
  try {
    const wrote = await upsertDeals(deals, "scraped");
    console.log(`[worker] ${name}: upserted ${wrote} deals`);
  } catch (e) {
    console.error(`[worker] ${name}: upsert failed —`, e instanceof Error ? e.message : String(e));
  }
}

const results = await Promise.all(
  SCRAPERS.map(async (s) => {
    const t0 = Date.now();
    try {
      const raw = await s.fn();
      // Top-10 per marketplace (highest discount first if available)
      const sorted = raw.slice().sort((a, b) => (b.discountPercent ?? 0) - (a.discountPercent ?? 0));
      const deals = sorted.slice(0, 10);
      const ms = Date.now() - t0;
      console.log(`[worker] ${s.name}: ${deals.length} deals (kept from ${raw.length}, ${ms}ms)`);
      await persistOne(s.name, deals);
      return { name: s.name, deals, ms, error: null };
    } catch (e) {
      const ms = Date.now() - t0;
      const error = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
      console.error(`[worker] ${s.name} FAILED in ${ms}ms — ${error}`);
      return { name: s.name, deals: [], ms, error };
    }
  })
);

const allDeals = results.flatMap((r) => r.deals);
const summary = Object.fromEntries(results.map((r) => [r.name, r.deals.length]));
console.log("[worker] perMarketplace:", summary);
console.log(`[worker] total: ${allDeals.length} deals`);

// Per-marketplace upserts already happened above as each scraper finished.
// Just log the final tally.
if (!allDeals.length) console.log("[worker] no deals scraped — nothing was upserted");

console.log(`[worker] done in ${Date.now() - started}ms`);
process.exit(0);
