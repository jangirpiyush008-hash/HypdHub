-- Supabase schema for HYPD Hub
-- Run this in Supabase SQL editor to set up the backend

-- Deals table: stores scraped deals from all sources
create table if not exists deals (
  id text primary key,
  title text not null,
  marketplace text not null,
  category text,
  current_price numeric,
  original_price numeric,
  discount_percent numeric,
  original_url text,
  canonical_url text,
  image_url text,
  source text default 'scraper',
  source_channel text,
  validation_status text default 'unverified',
  stock_status text,
  score numeric default 0,
  mentions integer default 0,
  scraped_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Creator sessions: tracks logged-in creators
create table if not exists creator_sessions (
  id text primary key,
  hypd_username text not null,
  email text,
  mobile text,
  role text,
  logged_in_at timestamp with time zone default now(),
  last_active_at timestamp with time zone default now()
);

-- Telegram automations
create table if not exists telegram_automations (
  id text primary key,
  creator_id text not null references creator_sessions(id),
  destination_channel_username text,
  destination_channel_id text,
  source_mode text default 'official_hypd',
  source_channel_id text,
  source_channel_label text,
  bot_username text,
  bot_token text,
  enabled boolean default true,
  auto_posting_enabled boolean default false,
  auto_forward_enabled boolean default false,
  link_conversion_enabled boolean default true,
  post_format text default 'with_image',
  posting_window text,
  caption_template text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Conversion logs: tracks link conversions
create table if not exists conversion_logs (
  id serial primary key,
  creator_id text references creator_sessions(id),
  source_url text not null,
  marketplace text,
  short_link text,
  expanded_link text,
  converted_at timestamp with time zone default now()
);

-- Scraper state: tracks last scrape times per source
create table if not exists scraper_state (
  source text primary key,
  last_scraped_at timestamp with time zone,
  deals_found integer default 0,
  status text default 'idle',
  updated_at timestamp with time zone default now()
);

-- Indexes
create index if not exists idx_deals_marketplace on deals(marketplace);
create index if not exists idx_deals_score on deals(score desc);
create index if not exists idx_deals_scraped_at on deals(scraped_at desc);
create index if not exists idx_telegram_automations_creator on telegram_automations(creator_id);
create index if not exists idx_conversion_logs_creator on conversion_logs(creator_id);

-- Enable RLS
alter table deals enable row level security;
alter table creator_sessions enable row level security;
alter table telegram_automations enable row level security;
alter table conversion_logs enable row level security;
alter table scraper_state enable row level security;

-- Policies: deals are publicly readable
create policy "Deals are publicly readable" on deals for select using (true);
create policy "Service role can manage deals" on deals for all using (true);

-- Scraper state is publicly readable
create policy "Scraper state readable" on scraper_state for select using (true);
create policy "Service role can manage scraper state" on scraper_state for all using (true);

-- Creator sessions managed by service role
create policy "Service role manages sessions" on creator_sessions for all using (true);

-- Telegram automations: creators see their own
create policy "Service role manages automations" on telegram_automations for all using (true);

-- Conversion logs: creators see their own
create policy "Service role manages logs" on conversion_logs for all using (true);
