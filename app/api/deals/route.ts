import { NextRequest, NextResponse } from "next/server";
import { rankDeals } from "@/lib/deals/ranking";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const marketplace = searchParams.get("marketplace");
  const minPrice = Number(searchParams.get("minPrice") ?? "0");
  const maxPrice = Number(searchParams.get("maxPrice") ?? "999999");

  const ranked = rankDeals().filter((deal) => {
    const marketplaceMatch = !marketplace || marketplace === "All" || deal.source === marketplace;
    const priceMatch = deal.price >= minPrice && deal.price <= maxPrice;
    return marketplaceMatch && priceMatch;
  });

  return NextResponse.json({
    generatedAt: new Date().toISOString(),
    refreshWindowHours: 2,
    deals: ranked
  });
}
