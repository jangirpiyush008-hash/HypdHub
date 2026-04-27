/**
 * POST /api/hypd-sync
 *
 * Pulls the HYPD hot-selling catalog using the logged-in creator's
 * upstream HYPD session cookies, classifies each product back to its
 * source marketplace (Flipkart / Myntra / Shopsy / etc.), and writes
 * the result into Supabase as deals (source='hypd').
 *
 * Why this is the answer: HYPD aggregates marketplace products as part
 * of its own affiliate platform — it's not blocked by Akamai because
 * we have a real partner session. The deals page (which already reads
 * from Supabase) then surfaces these to anonymous visitors too, with
 * each link going through HYPD's own affiliate tracking pipeline.
 *
 * Trigger this once after logging in. The deals will refresh every
 * time the route is called. (TODO: add a worker hook once we figure
 * out how to share the upstream HYPD session globally.)
 */
import { NextRequest, NextResponse } from "next/server";
import { fetchCurrentHypdCreator, getStoredHypdCookies } from "@/lib/hypd-server";
import { fetchHypdCatalogRaw, hypdProductsToDeals } from "@/lib/integrations/hypd";
import { upsertDeals } from "@/lib/scraper/supabase-deals";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const debug = new URL(request.url).searchParams.get("debug") === "1";
  const cookies = await getStoredHypdCookies();
  if (cookies.length === 0) {
    return NextResponse.json(
      { ok: false, error: "Not logged in to HYPD. Log in first, then retry." },
      { status: 401 },
    );
  }

  const creator = await fetchCurrentHypdCreator(cookies);
  if (!creator) {
    return NextResponse.json(
      { ok: false, error: "HYPD session expired. Log in again." },
      { status: 401 },
    );
  }

  const raw = await fetchHypdCatalogRaw(cookies);
  if (!raw.length) {
    return NextResponse.json({
      ok: false,
      error: "HYPD returned 0 products — check the session is still valid.",
    });
  }

  // Debug mode: dump first 2 raw products + all top-level keys so we can
  // see HYPD's actual field names and tune the parser.
  if (debug) {
    const sample = raw.slice(0, 2);
    const allKeys = new Set<string>();
    for (const item of raw) {
      if (item && typeof item === "object") {
        for (const k of Object.keys(item as Record<string, unknown>)) allKeys.add(k);
      }
    }
    return NextResponse.json({
      ok: true,
      debug: true,
      rawCount: raw.length,
      uniqueKeys: Array.from(allKeys).sort(),
      sample,
    });
  }

  const deals = hypdProductsToDeals(creator.hypdUsername, raw);
  const written = deals.length ? await upsertDeals(deals, "hypd") : 0;

  // Per-marketplace breakdown so we can verify Flipkart/Myntra/Shopsy got pulled
  const byMp = deals.reduce<Record<string, number>>((acc, d) => {
    acc[d.marketplace] = (acc[d.marketplace] ?? 0) + 1;
    return acc;
  }, {});

  return NextResponse.json({
    ok: true,
    raw: raw.length,
    parsed: deals.length,
    written,
    perMarketplace: byMp,
    creator: creator.hypdUsername,
  });
}

// Allow GET too for easy browser-bar triggering
export async function GET(request: NextRequest) {
  return POST(request);
}
