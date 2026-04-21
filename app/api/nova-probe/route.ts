/**
 * Debug endpoint: GET /api/nova-probe?url=https://www.meesho.com/deals
 *
 * Runs novaFetch() against the given URL and returns status, first 400 chars
 * of HTML, and whether Chromium launched at all. For diagnosing Railway
 * deploy issues (missing system libs, broken TLS, etc).
 */
import { NextRequest, NextResponse } from "next/server";
import type { novaFetch as NovaFetchFn, novaLaunchProbe as NovaLaunchProbeFn } from "@/lib/scraper/nova-browser";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const params = new URL(request.url).searchParams;
  const url = params.get("url") ?? "https://www.meesho.com/deals";
  const mode = params.get("mode") ?? "fetch";
  const started = Date.now();

  // Lazy import so a Chromium-launch failure returns a JSON error instead of
  // crashing the whole bundle at module load.
  let fetchFn: typeof NovaFetchFn | null = null;
  let launchProbeFn: typeof NovaLaunchProbeFn | null = null;
  let loadErr: string | null = null;
  try {
    const mod = await import("@/lib/scraper/nova-browser");
    fetchFn = mod.novaFetch;
    launchProbeFn = mod.novaLaunchProbe;
  } catch (e) {
    loadErr = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  // mode=launch → run the raw chromium launch probe and surface the real error
  if (mode === "launch" && launchProbeFn) {
    const result = await launchProbeFn();
    return NextResponse.json({ ...result, elapsedMs: Date.now() - started });
  }

  // mode=xhr → navigate the URL with Nova (mobile, deep scroll) and return
  // the list of every XHR/fetch URL the page fired, so we can figure out
  // which API endpoints to hook for SPA marketplaces.
  if (mode === "xhr") {
    try {
      const { listXhrs } = await import("@/lib/scraper/nova-browser");
      const xhrs = await listXhrs(url, { timeoutMs: 25000, settleMs: 3000 });
      return NextResponse.json({ url, count: xhrs.length, xhrs, elapsedMs: Date.now() - started });
    } catch (e) {
      return NextResponse.json({
        ok: false,
        stage: "xhr-list",
        error: e instanceof Error ? `${e.name}: ${e.message}` : String(e),
        elapsedMs: Date.now() - started,
      });
    }
  }

  if (!fetchFn) {
    return NextResponse.json({
      ok: false,
      stage: "module-load",
      error: loadErr,
      elapsedMs: Date.now() - started,
    });
  }

  try {
    const res = await fetchFn(url, { timeoutMs: 40000, settleMs: 1200 });
    const full = params.get("full") === "1";
    const diag = params.get("diag") === "1";
    const html = res.text;
    const body: Record<string, unknown> = {
      ok: res.ok,
      stage: "fetch",
      status: res.status,
      finalUrl: res.finalUrl,
      textLength: html.length,
      textHead: html.slice(0, 400),
      contentType: res.headers["content-type"] ?? null,
      elapsedMs: Date.now() - started,
    };
    if (diag) {
      const nextDataMatch = html.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]{0,3000})/i);
      body.diag = {
        hasNextData: /__NEXT_DATA__/.test(html),
        hasRupee: /₹/.test(html),
        hasRupeeEntity: /&#8377;|&#x20B9;/i.test(html),
        priceMatches: (html.match(/₹\s*[0-9][0-9,]{1,7}/g) ?? []).slice(0, 5),
        imgHostsSample: Array.from(
          new Set(
            (html.match(/https?:\/\/([a-z0-9.-]+)\/[^"' ]+\.(?:jpg|jpeg|webp|png)/gi) ?? [])
              .map((u) => new URL(u).host)
          )
        ).slice(0, 10),
        nextDataHead: nextDataMatch ? nextDataMatch[1].slice(0, 800) : null,
      };
    }
    if (full) body.text = html;
    return NextResponse.json(body);
  } catch (e) {
    return NextResponse.json({
      ok: false,
      stage: "fetch-threw",
      error:
        e instanceof Error
          ? `${e.name}: ${e.message}\n${e.stack?.split("\n").slice(0, 6).join("\n")}`
          : String(e),
      elapsedMs: Date.now() - started,
    });
  }
}
