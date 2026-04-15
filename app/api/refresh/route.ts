import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { scrapeMarketplaceDeals } from "@/lib/integrations/marketplace-scraper";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";
import { getRefreshStatus, recordRefreshSuccess } from "@/lib/runtime/refresh-state";
import { clearDealsCache } from "@/app/api/deals/route";
import { clearScraperMemCache } from "@/lib/scraper/index";

export async function GET() {
  const status = await getRefreshStatus();
  return NextResponse.json(status);
}

export async function POST() {
  // Bust upstream memory caches BEFORE scraping so this call goes to the wire.
  clearScraperMemCache();

  // Refresh from all sources: Telegram + marketplace scraper
  const [telegram, scraped] = await Promise.all([
    fetchTelegramDeals(true),
    // force: wait for Nova to actually finish scraping so this response
     // reports real counts instead of "0 from marketplaces" while a background
     // job is still crawling.
     scrapeMarketplaceDeals({ force: true }).catch(() => ({ deals: [], sources: [], scrapedAt: new Date().toISOString() }))
  ]);

  // Bust the per-creator converted-deals cache so the next /api/deals GET
  // goes all the way back to the fresh source data we just pulled.
  clearDealsCache();

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
