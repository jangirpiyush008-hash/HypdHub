/**
 * Marketplace Scraper — Bridge Module
 *
 * Delegates to the new human-agent scraper system.
 * Maintains the same public API for the deals route.
 */

import { InternetDeal } from "@/lib/types";
import { scrapeAllMarketplaces } from "@/lib/scraper/index";

export async function scrapeMarketplaceDeals(): Promise<{
  deals: InternetDeal[];
  sources: string[];
  scrapedAt: string;
}> {
  return scrapeAllMarketplaces();
}
