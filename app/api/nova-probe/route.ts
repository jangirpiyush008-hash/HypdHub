/**
 * Debug endpoint: GET /api/nova-probe?url=https://www.meesho.com/deals
 *
 * Runs novaFetch() against the given URL and returns status, first 400 chars
 * of HTML, and whether Chromium launched at all. Intended for diagnosing
 * Railway deploy issues (missing system libs, broken TLS, etc).
 *
 * Not linked from the UI and not rate-limited — remove once scrapers work.
 */
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

export async function GET(request: NextRequest) {
  const url = new URL(request.url).searchParams.get("url") ?? "https://www.meesho.com/deals";
  const started = Date.now();

  // Import lazily so a Chromium-launch failure returns a JSON error instead of
  // crashing the whole bundle at module load.
  let loadErr: string | null = null;
  let novaFetch: ((u: string, o?: Record<string, unknown>) => Promise<{
    ok: boolean; status: number; text: string; headers: Record<string, string>; finalUrl?: string;
  }>) | null = null;

  try {
    const mod = await import("@/lib/scraper/nova-browser");
    novaFetch = mod.novaFetch as typeof novaFetch;
  } catch (e) {
    loadErr = e instanceof Error ? `${e.name}: ${e.message}` : String(e);
  }

  if (!novaFetch) {
    return NextResponse.json({
      ok: false,
      stage: "module-load",
      error: loadErr,
      elapsedMs: Date.now() - started,
    });
  }

  try {
    const res = await novaFetch(url, { timeoutMs: 40000, settleMs: 1200 });
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
      error: e instanceof Error ? `${e.name}: ${e.message}\n${e.stack?.split("\n").slice(0, 6).join("\n")}` : String(e),
      elapsedMs: Date.now() - started,
    });
  }
}
