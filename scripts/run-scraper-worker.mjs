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
  scrapeAjio,
  scrapeNykaa,
  scrapeMeesho,
} = await import("../lib/scraper/marketplace-agents.ts");
const { upsertDeals } = await import("../lib/scraper/supabase-deals.ts");

// Nova-on-GitHub-Actions can only reliably scrape marketplaces whose CDNs
// don't fingerprint datacenter IPs. Flipkart, Myntra, and Shopsy all sit
// behind Akamai/DataDome and consistently return challenge pages from GH
// runners. Those three are sourced exclusively via the Telegram pipeline
// below — invisible at the UI layer once /api/deals strips source-evidence.
const SCRAPERS = [
  { name: "Meesho", fn: scrapeMeesho },
  { name: "Ajio", fn: scrapeAjio },
  { name: "Nykaa", fn: scrapeNykaa },
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

// ─────────────────────────────────────────────────────────────────
// Telegram pipeline — primary source for Flipkart / Myntra / Shopsy.
//
// We use the t.me/s/<handle> public preview pages instead of the
// MTProto user-API. Reason: MTProto auth handshakes hang silently
// when initiated from GitHub Actions runner IPs (TCP + LAYER 198
// succeed, then 30s of dead silence; reproduced across TCPFull port
// 80 and useWSS port 443). t.me/s/ serves the same content as plain
// HTTP HTML, no auth, no DC negotiation, works from every cloud IP.
//
// Trade-off: only public-handle channels are reachable this way
// (no +invite-hash channels). That's fine — the strongest Indian
// deal posters all publish public handles for SEO.
// ─────────────────────────────────────────────────────────────────
{
  const t0 = Date.now();
  try {
    const { fetchTelegramWebDeals } = await import("../lib/scraper/telegram-web.ts");
    const tgDeals = await fetchTelegramWebDeals();
    const ms = Date.now() - t0;
    console.log(`[worker] Telegram: fetched ${tgDeals.length} deals in ${ms}ms`);
    if (tgDeals.length) {
      const wrote = await upsertDeals(tgDeals, "telegram");
      console.log(`[worker] Telegram: upserted ${wrote} deals`);
    }
    const byMp = tgDeals.reduce((acc, d) => {
      acc[d.marketplace] = (acc[d.marketplace] || 0) + 1;
      return acc;
    }, {});
    console.log("[worker] Telegram per-marketplace:", byMp);
  } catch (e) {
    console.error("[worker] Telegram fetch failed:", e instanceof Error ? e.message : String(e));
  }
}

console.log(`[worker] done in ${Date.now() - started}ms`);
process.exit(0);
