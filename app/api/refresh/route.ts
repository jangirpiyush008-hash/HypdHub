import { NextResponse } from "next/server";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { getRefreshStatus, recordRefreshSuccess } from "@/lib/runtime/refresh-state";

export async function GET() {
  const status = await getRefreshStatus();
  return NextResponse.json(status);
}

export async function POST() {
  const telegram = await fetchTelegramDeals(true);
  const history = await getDealHistorySummary();
  const validatedDealsCount = telegram.deals.filter((deal) => deal.validationStatus === "validated").length;
  await recordRefreshSuccess("manual-dashboard-refresh", telegram.deals.length, validatedDealsCount);
  const refresh = await getRefreshStatus();

  return NextResponse.json({
    ok: true,
    message: "Refresh completed with Telegram ingestion, public-page validation, and history tracking.",
    telegramDealsCount: telegram.deals.length,
    validatedDealsCount,
    history,
    refresh
  });
}
