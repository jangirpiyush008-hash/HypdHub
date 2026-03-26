import { NextResponse } from "next/server";
import { rankDeals } from "@/lib/deals/ranking";
import { fetchHypdProducts } from "@/lib/integrations/hypd";
import { fetchMarketplaceSnapshots } from "@/lib/integrations/marketplaces";
import { fetchTelegramSignalSummary } from "@/lib/integrations/telegram";

export async function GET() {
  const [hypd, marketplaces, telegram] = await Promise.all([
    fetchHypdProducts(),
    fetchMarketplaceSnapshots(),
    fetchTelegramSignalSummary()
  ]);

  return NextResponse.json({
    refreshWindowHours: 2,
    topDeals: rankDeals().slice(0, 10),
    integrations: {
      hypd,
      marketplaces,
      telegram
    }
  });
}
