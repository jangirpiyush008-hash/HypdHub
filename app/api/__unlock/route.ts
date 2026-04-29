import { NextRequest, NextResponse } from "next/server";
import { SITE_GATE } from "@/middleware";

export const runtime = "edge";
export const dynamic = "force-dynamic";

/**
 * Unlock submit handler. Verifies the password against SITE_PASSWORD,
 * mints an HMAC-signed cookie, and bounces the user to whatever URL
 * they originally requested.
 *
 * Mild brute-force protection: a fixed 600ms delay regardless of
 * outcome so we don't reveal timing differences between right/wrong
 * passwords. (Edge runtime can't easily do counters per-IP — that'd
 * need Redis. The per-request delay is the cheap deterrent.)
 */
export async function POST(req: NextRequest) {
  const expected = process.env.SITE_PASSWORD;
  if (!expected) {
    return NextResponse.json({ ok: false, error: "Gate not configured" }, { status: 500 });
  }

  const form = await req.formData();
  const submitted = String(form.get("password") ?? "");
  const next = String(form.get("next") ?? "/");

  // Fixed delay before responding — same on success and failure.
  await new Promise((r) => setTimeout(r, 600));

  // Constant-time compare so we don't leak password length.
  const match =
    submitted.length === expected.length &&
    constantTimeEqual(submitted, expected);

  const url = new URL(req.url);
  if (!match) {
    const back = new URL("/__unlock", url);
    back.searchParams.set("next", next);
    back.searchParams.set("error", "1");
    return NextResponse.redirect(back, 303);
  }

  const cookieValue = await SITE_GATE.makeCookieValue();
  if (!cookieValue) {
    return NextResponse.json({ ok: false, error: "Gate not configured" }, { status: 500 });
  }

  // Sanitise `next` so an attacker can't redirect to an external site
  // using our gate as an open redirect.
  let safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/";
  if (safeNext.startsWith("/__unlock")) safeNext = "/";

  const dest = new URL(safeNext, url);
  const res = NextResponse.redirect(dest, 303);
  res.cookies.set({
    name: SITE_GATE.COOKIE_NAME,
    value: cookieValue,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: SITE_GATE.COOKIE_TTL_SECONDS,
  });
  return res;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) acc |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return acc === 0;
}
