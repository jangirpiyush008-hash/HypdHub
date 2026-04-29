import { NextRequest, NextResponse } from "next/server";

/**
 * Site-wide password gate.
 *
 * The intent (per the user) is to keep the entire app — including the
 * marketing/homepage and source bundle — behind one shared password so
 * casual visitors and curious devs can't reach anything until they
 * unlock it. This is NOT per-user auth; it's a single shared secret
 * that protects the whole site from being inspected, indexed, or
 * scraped.
 *
 * How it works:
 *   1. SITE_PASSWORD env var is required. If unset, the gate is
 *      disabled (so local dev still works without setting it).
 *   2. SITE_GATE_SECRET env var is the HMAC key for signing the unlock
 *      cookie. If unset we derive one from SITE_PASSWORD — so rotating
 *      the password also invalidates outstanding cookies.
 *   3. On any request without a valid `hh_unlock` cookie, redirect to
 *      `/__unlock` (which serves a tiny password form). The unlock
 *      route validates the password, sets a 7-day signed cookie, and
 *      bounces back to the originally requested URL.
 *   4. Static assets (`/_next/*`, fonts, favicons) bypass the gate so
 *      Next.js's chunk loader keeps working AFTER unlock — the unlock
 *      page itself loads no chunks though, so leaking those is fine.
 *
 * Honest caveats:
 *   - This protects against casual snooping. A determined attacker who
 *     guesses or learns the password is in. Use a long random
 *     password (40+ chars) and rotate it.
 *   - The unlock cookie is HttpOnly + Secure + SameSite=Lax. It cannot
 *     be read by client JS, so a stolen cookie has to be exfiltrated
 *     via network — adds another step.
 *   - If you want stronger protection, layer Cloudflare Access or
 *     Vercel Password Protection on top of this.
 */

const COOKIE_NAME = "hh_unlock";
const COOKIE_TTL_SECONDS = 7 * 24 * 60 * 60; // 7 days
const UNLOCK_PATH = "/__unlock";

// Routes that must remain reachable BEFORE unlock so the gate page itself
// works. Everything else (including `/`) is gated.
const PUBLIC_PATHS: Array<RegExp> = [
  /^\/__unlock(?:\/|$)/,         // the gate page + its POST handler
  /^\/api\/__unlock(?:\/|$)/,    // unlock submit
  /^\/_next\/static\//,           // Next.js bundles (won't load until unlocked anyway, but keep clean)
  /^\/_next\/image\b/,
  /^\/favicon\.ico$/,
  /^\/robots\.txt$/,
  /^\/sitemap\.xml$/,
  /^\/.*\.(png|jpg|jpeg|webp|svg|ico|woff2?|ttf|eot|css|map)$/,
];

function isPublicPath(pathname: string): boolean {
  for (const re of PUBLIC_PATHS) if (re.test(pathname)) return true;
  return false;
}

// Web Crypto HMAC-SHA256 — runs in the Edge runtime where Node's `crypto`
// isn't available. Key bytes are derived from SITE_GATE_SECRET (or, as
// fallback, SITE_PASSWORD itself).
async function hmac(secretBytes: Uint8Array, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    secretBytes as BufferSource,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message));
  return bufferToHex(new Uint8Array(sig));
}

function bufferToHex(b: Uint8Array): string {
  let s = "";
  for (let i = 0; i < b.length; i++) s += b[i].toString(16).padStart(2, "0");
  return s;
}

function constantTimeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let acc = 0;
  for (let i = 0; i < a.length; i++) acc |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return acc === 0;
}

function getSecretBytes(): Uint8Array | null {
  const password = process.env.SITE_PASSWORD;
  if (!password) return null;
  const secret = process.env.SITE_GATE_SECRET || password;
  return new TextEncoder().encode(secret);
}

/** Build the cookie value: `<expires-unix>.<hmac>` */
async function makeCookieValue(): Promise<string | null> {
  const secret = getSecretBytes();
  if (!secret) return null;
  const expires = Math.floor(Date.now() / 1000) + COOKIE_TTL_SECONDS;
  const sig = await hmac(secret, String(expires));
  return `${expires}.${sig}`;
}

/** Validate a cookie value: check signature + non-expired. */
async function isValidCookieValue(raw: string | undefined): Promise<boolean> {
  if (!raw) return false;
  const secret = getSecretBytes();
  if (!secret) return false;
  const dot = raw.indexOf(".");
  if (dot <= 0) return false;
  const expires = raw.slice(0, dot);
  const sig = raw.slice(dot + 1);
  const expectedSig = await hmac(secret, expires);
  if (!constantTimeEqual(sig, expectedSig)) return false;
  const expiresNum = Number(expires);
  if (!Number.isFinite(expiresNum) || expiresNum <= Math.floor(Date.now() / 1000)) return false;
  return true;
}

export async function middleware(req: NextRequest) {
  const password = process.env.SITE_PASSWORD;
  // Gate disabled — let everything through. Useful in local dev when
  // SITE_PASSWORD isn't set.
  if (!password) return NextResponse.next();

  const { pathname, search } = req.nextUrl;
  if (isPublicPath(pathname)) return NextResponse.next();

  const cookie = req.cookies.get(COOKIE_NAME)?.value;
  if (await isValidCookieValue(cookie)) return NextResponse.next();

  // Not unlocked — bounce to the gate page, preserving the originally
  // requested path so we can return there after unlock.
  const url = req.nextUrl.clone();
  url.pathname = UNLOCK_PATH;
  url.search = `?next=${encodeURIComponent(pathname + search)}`;
  return NextResponse.redirect(url);
}

export const config = {
  // Match every request EXCEPT the static-asset paths above. Listing
  // explicit excludes here avoids the cost of running middleware on
  // every chunk fetch.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};

// Exported so the unlock route can mint matching cookies.
export const SITE_GATE = {
  COOKIE_NAME,
  COOKIE_TTL_SECONDS,
  makeCookieValue,
};
