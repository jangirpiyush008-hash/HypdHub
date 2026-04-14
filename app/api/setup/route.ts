import { NextResponse } from "next/server";
import { createServerSupabase } from "@/lib/supabase";

const SETUP_SQL = `
-- Deals table: stores all marketplace deals
CREATE TABLE IF NOT EXISTS deals (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  marketplace TEXT NOT NULL,
  title TEXT NOT NULL,
  category TEXT DEFAULT 'General',
  image_url TEXT,
  current_price NUMERIC,
  original_price NUMERIC,
  discount_percent NUMERIC,
  product_url TEXT NOT NULL,
  category_url TEXT,
  source TEXT DEFAULT 'curated' CHECK (source IN ('curated', 'scraped', 'telegram')),
  score NUMERIC DEFAULT 10,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Deal price history
CREATE TABLE IF NOT EXISTS deal_history (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  deal_id UUID REFERENCES deals(id) ON DELETE CASCADE,
  current_price NUMERIC,
  original_price NUMERIC,
  seen_at TIMESTAMPTZ DEFAULT now()
);

-- Creator sessions (replaces JSON file)
CREATE TABLE IF NOT EXISTS creator_sessions (
  creator_id TEXT PRIMARY KEY,
  hypd_username TEXT NOT NULL,
  name TEXT,
  email TEXT,
  mobile_number TEXT,
  cookies_encrypted TEXT,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Refresh state
CREATE TABLE IF NOT EXISTS refresh_state (
  id TEXT PRIMARY KEY DEFAULT 'global',
  last_refresh_at TIMESTAMPTZ,
  next_refresh_at TIMESTAMPTZ,
  refresh_window_hours INTEGER DEFAULT 2,
  last_status TEXT DEFAULT 'idle',
  last_reason TEXT,
  telegram_deals_count INTEGER DEFAULT 0,
  validated_deals_count INTEGER DEFAULT 0
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_deals_marketplace ON deals(marketplace);
CREATE INDEX IF NOT EXISTS idx_deals_active ON deals(is_active);
CREATE INDEX IF NOT EXISTS idx_deals_score ON deals(score DESC);
CREATE INDEX IF NOT EXISTS idx_deal_history_deal_id ON deal_history(deal_id);

-- Insert default refresh state
INSERT INTO refresh_state (id) VALUES ('global') ON CONFLICT (id) DO NOTHING;
`;

export async function POST() {
  try {
    const sb = createServerSupabase();

    // Execute SQL via Supabase's rpc or raw query
    // Using individual table creates since Supabase JS doesn't support raw SQL directly
    // We'll use the REST API instead

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!supabaseUrl || !serviceKey) {
      return NextResponse.json({ error: "Supabase not configured" }, { status: 500 });
    }

    // Execute SQL via Supabase's SQL endpoint
    const res = await fetch(`${supabaseUrl}/rest/v1/rpc/`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    // Try the pg_query approach via Supabase Management API
    // Actually, let's use the SQL editor endpoint
    const sqlRes = await fetch(`${supabaseUrl}/rest/v1/`, {
      headers: {
        apikey: serviceKey,
        Authorization: `Bearer ${serviceKey}`,
      },
    });

    // Check if tables already exist by trying to query them
    const { data: dealsCheck, error: dealsError } = await sb
      .from("deals")
      .select("id")
      .limit(1);

    if (dealsError && dealsError.message.includes("does not exist")) {
      // Tables don't exist - user needs to run SQL manually
      return NextResponse.json({
        status: "tables_needed",
        message: "Run this SQL in your Supabase SQL Editor (Dashboard > SQL Editor > New Query)",
        sql: SETUP_SQL,
      });
    }

    if (!dealsError) {
      // Tables exist, check if we need to seed
      const { count } = await sb
        .from("deals")
        .select("*", { count: "exact", head: true });

      if (count === 0) {
        return NextResponse.json({
          status: "ready_to_seed",
          message: "Tables exist but empty. Hit POST /api/setup/seed to populate with deals.",
          tablesExist: true,
          dealCount: 0,
        });
      }

      return NextResponse.json({
        status: "ready",
        message: "Database is set up and has deals.",
        dealCount: count,
      });
    }

    return NextResponse.json({
      status: "tables_needed",
      message: "Run this SQL in your Supabase SQL Editor",
      sql: SETUP_SQL,
    });
  } catch (err) {
    return NextResponse.json({
      error: String(err),
      message: "Setup failed",
    }, { status: 500 });
  }
}

export async function GET() {
  return POST();
}
