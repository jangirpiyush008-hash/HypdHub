import { NextResponse } from "next/server";
import { fetchTelegramDeals, fetchTelegramSignalSummary } from "@/lib/integrations/telegram";
import { ensureAutomaticRefresh, getRefreshStatus } from "@/lib/runtime/refresh-state";

export async function GET() {
  await ensureAutomaticRefresh("api-ingestion-telegram");
  const [summary, telegram, refresh] = await Promise.all([
    fetchTelegramSignalSummary(),
    fetchTelegramDeals(),
    getRefreshStatus()
  ]);
  return NextResponse.json({
    ...summary,
    uniqueDealsCount: telegram.deals.length,
    refresh
  });
}
