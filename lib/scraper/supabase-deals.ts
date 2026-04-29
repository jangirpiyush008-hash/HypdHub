/**
 * Supabase Deal Store
 *
 * Primary source of deals. Replaces hardcoded curated-deals.ts.
 * Falls back to curated deals if Supabase is unavailable.
 */

import { createServerSupabase } from "@/lib/supabase";
import { InternetDeal } from "@/lib/types";

type DbDeal = {
  id: string;
  marketplace: string;
  title: string;
  category: string;
  image_url: string | null;
  current_price: number | null;
  original_price: number | null;
  discount_percent: number | null;
  product_url: string;
  category_url: string | null;
  category_title: string | null;
  source: string;
  score: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
};

function dbDealToInternetDeal(d: DbDeal): InternetDeal {
  const now = new Date().toISOString();
  return {
    id: `db-${d.id}`,
    marketplace: d.marketplace as InternetDeal["marketplace"],
    title: d.title,
    category: d.category || "General",
    imageUrl: d.image_url,
    currentPrice: d.current_price ? Number(d.current_price) : null,
    originalPrice: d.original_price ? Number(d.original_price) : null,
    discountPercent: d.discount_percent ? Number(d.discount_percent) : null,
    originalUrl: d.product_url,
    canonicalUrl: d.product_url,
    categoryUrl: d.category_url,
    categoryTitle: d.category_title,
    mentionsCount: 1,
    channelsCount: 1,
    channelNames: [d.marketplace],
    firstSeenAt: d.created_at || now,
    lastSeenAt: d.updated_at || now,
    freshnessHours: 0,
    score: Number(d.score) || 10,
    confidenceScore: 85,
    validationStatus: "validated",
    stockStatus: "in_stock",
    sourceEvidence: [d.source],
  };
}

/**
 * Fetch all active deals from Supabase.
 * Returns empty array if Supabase is unavailable.
 */
export async function fetchDealsFromDb(): Promise<InternetDeal[]> {
  try {
    const sb = createServerSupabase();
    const { data, error } = await sb
      .from("deals")
      .select("*")
      .eq("is_active", true)
      .order("score", { ascending: false });

    if (error || !data) {
      console.error("[supabase-deals] Error fetching:", error?.message);
      return [];
    }

    // Amazon is not integrated with HYPD — filter it out at the source so any
    // legacy Amazon rows in the DB don't leak into the UI.
    return (data as DbDeal[])
      .filter((d) => d.marketplace !== "Amazon")
      .map(dbDealToInternetDeal);
  } catch (err) {
    console.error("[supabase-deals] Connection error:", err);
    return [];
  }
}

/**
 * Fetch deals by marketplace from Supabase.
 */
export async function fetchDealsByMarketplace(marketplace: string): Promise<InternetDeal[]> {
  try {
    const sb = createServerSupabase();
    const { data, error } = await sb
      .from("deals")
      .select("*")
      .eq("marketplace", marketplace)
      .eq("is_active", true)
      .order("score", { ascending: false });

    if (error || !data) return [];
    return (data as DbDeal[]).map(dbDealToInternetDeal);
  } catch {
    return [];
  }
}

/**
 * Upsert scraped/telegram deals into Supabase.
 */
export async function upsertDeals(deals: InternetDeal[], source: "scraped" | "telegram" | "hypd"): Promise<number> {
  try {
    const sb = createServerSupabase();
    const rows = deals.map((d) => ({
      marketplace: d.marketplace,
      title: d.title,
      category: d.category || "General",
      image_url: d.imageUrl || null,
      current_price: d.currentPrice,
      original_price: d.originalPrice,
      discount_percent: d.discountPercent,
      product_url: d.originalUrl || d.canonicalUrl,
      category_url: d.categoryUrl || null,
      category_title: d.categoryTitle || null,
      source,
      score: d.score,
      is_active: true,
      updated_at: new Date().toISOString(),
    }));

    // Delete-then-insert per marketplace for EVERY source. Each 2hr
    // refresh wipes the previous batch and writes the fresh one — so
    // visitors see different deals every refresh window instead of an
    // ever-growing pile of stale entries. Telegram used to be append-
    // only ("tracks mention history") but in practice that just buried
    // today's deals under last week's; rotation > mention-history for
    // the public feed.
    {
      const marketplaces = Array.from(new Set(rows.map((r) => r.marketplace)));
      for (const mp of marketplaces) {
        await sb
          .from("deals")
          .delete()
          .eq("source", source)
          .eq("marketplace", mp);
      }
    }

    const { data, error } = await sb.from("deals").insert(rows).select("id");

    if (error) {
      console.error("[supabase-deals] Insert error:", error.message);
      return 0;
    }
    return data?.length ?? 0;
  } catch {
    return 0;
  }
}

/**
 * Update deal image URL in Supabase.
 */
export async function updateDealImage(dealDbId: string, imageUrl: string): Promise<void> {
  try {
    const sb = createServerSupabase();
    await sb.from("deals").update({ image_url: imageUrl }).eq("id", dealDbId);
  } catch {
    // skip
  }
}
