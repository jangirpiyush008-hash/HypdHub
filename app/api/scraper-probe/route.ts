import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const only = searchParams.get("only"); // e.g. ?only=Meesho

  const mod = await import("@/lib/scraper/marketplace-agents");
  const scrapers: Array<{ name: string; fn: () => Promise<unknown[]> }> = [
    { name: "Myntra", fn: mod.scrapeMyntra },
    { name: "Flipkart", fn: mod.scrapeFlipkart },
    { name: "Meesho", fn: mod.scrapeMeesho },
    { name: "Ajio", fn: mod.scrapeAjio },
    { name: "Nykaa", fn: mod.scrapeNykaa },
    { name: "Shopsy", fn: mod.scrapeShopsy },
  ];

  const picked = only ? scrapers.filter((s) => s.name.toLowerCase() === only.toLowerCase()) : scrapers;
  const results: Array<{ name: string; count: number; elapsedMs: number; sample?: unknown; error?: string }> = [];

  for (const s of picked) {
    const t0 = Date.now();
    try {
      const deals = await s.fn();
      results.push({
        name: s.name,
        count: deals.length,
        elapsedMs: Date.now() - t0,
        sample: deals[0] ?? null,
      });
    } catch (e) {
      results.push({
        name: s.name,
        count: 0,
        elapsedMs: Date.now() - t0,
        error: e instanceof Error ? e.message : String(e),
      });
    }
  }

  return NextResponse.json({ results });
}
