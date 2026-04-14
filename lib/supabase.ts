import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Server-side client with service role key for admin operations
export function createServerSupabase() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY ?? supabaseAnonKey;
  return createClient(supabaseUrl, serviceKey);
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
