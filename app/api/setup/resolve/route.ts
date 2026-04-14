/**
 * NOVA v2 Product Resolver
 *
 * Resolves all deals in Supabase: converts search URLs to real
 * product page URLs and fetches real product thumbnail images.
 *
 * POST /api/setup/resolve — resolve all unresolved deals
 * GET /api/setup/resolve — check resolution status
 */

import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";
import { resolveProduct, NOVA_VERSION } from "@/lib/scraper/human-agent";

let resolving = false;
let lastResult: { resolvedCount: number; failedCount: number; completedAt: string } | null = null;

export async function GET() {
  return NextResponse.json({
    novaVersion: NOVA_VERSION,
    resolving,
    lastResult,
  });
}

export async function POST() {
  if (resolving) {
    return NextResponse.json({ message: "Already resolving...", resolving: true });
  }

  resolving = true;
  const sb = createServerSupabase();

  try {
    // Get all active deals
    const { data: deals, error } = await sb
      .from("deals")
      .select("id, marketplace, title, product_url, image_url")
      .eq("is_active", true)
      .order("score", { ascending: false });

    if (error || !deals) {
      resolving = false;
      return NextResponse.json({ error: error?.message || "No deals found" }, { status: 500 });
    }

    let resolvedCount = 0;
    let failedCount = 0;

    // Process deals one at a time with delays to avoid rate limiting
    for (const deal of deals) {
      try {
        const result = await resolveProduct(deal.product_url, deal.marketplace);

        const updates: Record<string, string | null> = {};

        // Update product_url if we got a real single-product URL
        if (result.productUrl) {
          updates.product_url = result.productUrl;
        }

        // Update image_url if we got a real product image
        if (result.imageUrl) {
          updates.image_url = result.imageUrl;
        }

        if (Object.keys(updates).length > 0) {
          updates.updated_at = new Date().toISOString();
          await sb.from("deals").update(updates).eq("id", deal.id);
          resolvedCount++;
          console.log(`[NOVA v2] ✓ ${deal.marketplace}: ${deal.title.substring(0, 40)} → image: ${result.imageUrl ? "YES" : "NO"}, url: ${result.productUrl ? "YES" : "NO"}`);
        } else {
          failedCount++;
          console.log(`[NOVA v2] ✗ ${deal.marketplace}: ${deal.title.substring(0, 40)} — no data found`);
        }

        // Rate limit: wait 1-2 seconds between deals
        await new Promise(r => setTimeout(r, 1000 + Math.random() * 1000));
      } catch (err) {
        failedCount++;
        console.error(`[NOVA v2] Error resolving ${deal.title}:`, err);
      }
    }

    lastResult = {
      resolvedCount,
      failedCount,
      completedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      novaVersion: NOVA_VERSION,
      message: `Resolved ${resolvedCount} deals, ${failedCount} failed`,
      ...lastResult,
    });
  } catch (err) {
    return NextResponse.json({ error: String(err) }, { status: 500 });
  } finally {
    resolving = false;
  }
}
