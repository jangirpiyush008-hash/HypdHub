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
    return NextResponse.json({
      ok: res.ok,
      stage: "fetch",
      status: res.status,
      finalUrl: res.finalUrl,
      textLength: res.text.length,
      textHead: res.text.slice(0, 400),
      contentType: res.headers["content-type"] ?? null,
      elapsedMs: Date.now() - started,
    });
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
