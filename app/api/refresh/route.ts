import { NextResponse } from "next/server";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { scrapeMarketplaceDeals } from "@/lib/integrations/marketplace-scraper";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { getRefreshStatus, recordRefreshSuccess } from "@/lib/runtime/refresh-state";

export async function GET() {
  const status = await getRefreshStatus();
  return NextResponse.json(status);
}

export async function POST() {
  // Refresh from all sources: Telegram + marketplace scraper
  const [telegram, scraped] = await Promise.all([
    fetchTelegramDeals(true),
    scrapeMarketplaceDeals().catch(() => ({ deals: [], sources: [], scrapedAt: new Date().toISOString() }))
  ]);

  const history = await getDealHistorySummary();
  const totalDeals = telegram.deals.length + scraped.deals.length;
  const validatedDealsCount = telegram.deals.filter((d) => d.validationStatus === "validated").length;
  await recordRefreshSuccess("manual-refresh", totalDeals, validatedDealsCount);
  const refresh = await getRefreshStatus();

  return NextResponse.json({
    ok: true,
    message: `Refreshed: ${telegram.deals.length} from Telegram, ${scraped.deals.length} from marketplaces.`,
    telegramDealsCount: telegram.deals.length,
    scrapedDealsCount: scraped.deals.length,
    validatedDealsCount,
    history,
    refresh
  });
}
