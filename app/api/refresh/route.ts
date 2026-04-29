import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { fetchTelegramWebDeals } from "@/lib/scraper/telegram-web";
import { upsertDeals } from "@/lib/scraper/supabase-deals";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { getRefreshStatus, recordRefreshSuccess } from "@/lib/runtime/refresh-state";
import { clearDealsCache } from "@/app/api/deals/route";

export async function GET() {
  const status = await getRefreshStatus();
  return NextResponse.json(status);
}

export async function POST() {
  // Pull fresh Telegram-sourced deals via the HTTP web scraper. The
  // MTProto path is unusable from cloud IPs (handshake hangs), so this
  // is the only path that works in production. Marketplace scraper
  // (Nova) runs on the GH Actions cron worker — calling it from here
  // would either start a Playwright browser inside the Next.js server
  // (slow, fragile) or return zero. Better to trust the cron.
  const tgDeals = await fetchTelegramWebDeals();
  if (tgDeals.length) {
    await upsertDeals(tgDeals, "telegram");
  }

  clearDealsCache();

  const history = await getDealHistorySummary();
  await recordRefreshSuccess("manual-refresh", tgDeals.length, tgDeals.length);
  const refresh = await getRefreshStatus();

  return NextResponse.json({
    ok: true,
    // Generic message — source mix is a server-side detail.
    message: `Refreshed ${tgDeals.length} live deals.`,
    totalDealsCount: tgDeals.length,
    history,
    refresh
  });
}
