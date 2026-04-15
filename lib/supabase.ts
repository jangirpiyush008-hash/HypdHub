import { createClient, SupabaseClient } from "@supabase/supabase-js";

// Lazy-instantiated client. Needed because Next.js collects page data at
// build time, and during a Docker build env vars aren't present — calling
// createClient() at module load with empty strings throws "supabaseUrl is
// required" and fails the whole build. Proxy defers construction until a
// real method is invoked (i.e. at request time, after env is populated).

let _client: SupabaseClient | null = null;
function getClient(): SupabaseClient {
  if (_client) return _client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase env missing: set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY"
    );
  }
  _client = createClient(url, key);
  return _client;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const supabase = new Proxy({} as SupabaseClient, {
  get(_target, prop) {
    const c = getClient();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const value = (c as any)[prop];
    return typeof value === "function" ? value.bind(c) : value;
  },
});

// Server-side client with service role key for admin operations.
export function createServerSupabase(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !serviceKey) {
    throw new Error("Supabase env missing for server client");
  }
  return createClient(url, serviceKey);
}

export type DbDeal = {
  id?: string;
  marketplace: string;
  title: string;
  category: string;
  image_url: string | null;
  current_price: number | null;
  original_price: number | null;
  discount_percent: number | null;
  product_url: string;
  category_url: string | null;
  source: "curated" | "scraped" | "telegram";
  score: number;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
};

export type DbDealHistory = {
  id?: string;
  deal_id: string;
  current_price: number | null;
  original_price: number | null;
  seen_at?: string;
};

export type DbCreatorSession = {
  creator_id: string;
  hypd_username: string;
  name: string;
  email: string;
  mobile_number: string;
  cookies_encrypted: string;
  updated_at?: string;
};
