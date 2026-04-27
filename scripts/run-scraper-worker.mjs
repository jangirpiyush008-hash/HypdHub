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
import { register } from "node:module";
import { pathToFileURL } from "node:url";

// Load TS source via tsx loader so we don't need a separate build step.
register("tsx/esm", pathToFileURL("./"));

const started = Date.now();
console.log("[worker] starting scrape run at", new Date().toISOString());

const { scrapeAllMarketplaces } = await import("../lib/scraper/index.ts");
const { upsertDeals } = await import("../lib/scraper/supabase-deals.ts");

const result = await scrapeAllMarketplaces({ force: true });
console.log("[worker] scrape complete:", {
  total: result.deals?.length ?? 0,
  perMarketplace: result.perMarketplace,
});

if (result.deals?.length) {
  const wrote = await upsertDeals(result.deals, "scraped");
  console.log(`[worker] upserted ${wrote} deals to Supabase`);
} else {
  console.log("[worker] no deals scraped — nothing to upsert");
}

console.log(`[worker] done in ${Date.now() - started}ms`);
process.exit(0);
