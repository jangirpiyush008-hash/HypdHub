/**
 * Human-like Browser Agent
 *
 * Mimics real browser behavior at the HTTP level:
 * - Full browser header sets (sec-ch-ua, sec-fetch-*, etc.)
 * - Cookie jar — visit homepage first, collect cookies, reuse on API calls
 * - Realistic timing with random delays
 * - Multiple browser profiles to rotate
 * - Proper referer chains (navigate like a human would)
 */

// ─── Browser Profiles ───
// Each profile perfectly replicates a real browser's header fingerprint
const BROWSER_PROFILES = [
  {
    name: "Chrome 124 Android",
    ua: "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.113 Mobile Safari/537.36",
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    secChUaPlatform: '"Android"',
    secChUaMobile: "?1",
  },
  {
    name: "Chrome 123 Windows",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/123.0.0.0 Safari/537.36",
    secChUa: '"Chromium";v="123", "Google Chrome";v="123", "Not:A-Brand";v="8"',
    secChUaPlatform: '"Windows"',
    secChUaMobile: "?0",
  },
  {
    name: "Chrome 124 Mac",
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    secChUaPlatform: '"macOS"',
    secChUaMobile: "?0",
  },
  {
    name: "Safari iPhone",
    ua: "Mozilla/5.0 (iPhone; CPU iPhone OS 17_4_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4.1 Mobile/15E148 Safari/604.1",
    secChUa: "",
    secChUaPlatform: "",
    secChUaMobile: "",
  },
  {
    name: "Chrome 122 Android",
    ua: "Mozilla/5.0 (Linux; Android 13; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.6261.105 Mobile Safari/537.36",
    secChUa: '"Chromium";v="122", "Google Chrome";v="122", "Not(A:Brand";v="24"',
    secChUaPlatform: '"Android"',
    secChUaMobile: "?1",
  },
];

export type BrowserProfile = (typeof BROWSER_PROFILES)[number];

// ─── Cookie Jar ───
// Simple in-memory cookie store per domain
const cookieStore = new Map<string, Map<string, string>>();

function parseCookies(setCookieHeaders: string[]): Record<string, string> {
  const cookies: Record<string, string> = {};
  for (const header of setCookieHeaders) {
    const match = header.match(/^([^=]+)=([^;]*)/);
    if (match) cookies[match[1].trim()] = match[2].trim();
  }
  return cookies;
}

function storeCookies(domain: string, cookies: Record<string, string>) {
  if (!cookieStore.has(domain)) cookieStore.set(domain, new Map());
  const jar = cookieStore.get(domain)!;
  for (const [k, v] of Object.entries(cookies)) {
    jar.set(k, v);
  }
}

function getCookieString(domain: string): string {
  const jar = cookieStore.get(domain);
  if (!jar || jar.size === 0) return "";
  return Array.from(jar.entries()).map(([k, v]) => `${k}=${v}`).join("; ");
}

function getDomain(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

// ─── Random Utilities ───
function randomDelay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.floor(Math.random() * (maxMs - minMs)) + minMs;
  return new Promise((r) => setTimeout(r, ms));
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ─── Human Agent ───
export interface AgentRequestOptions {
  url: string;
  referer?: string;
  extraHeaders?: Record<string, string>;
  profile?: BrowserProfile;
  timeout?: number;
  acceptJson?: boolean;
  method?: "GET" | "POST";
  body?: string;
}

export interface AgentResponse {
  ok: boolean;
  status: number;
  text: string;
  headers: Record<string, string>;
}

/**
 * Make an HTTP request that looks exactly like a real browser visit.
 */
export async function humanFetch(opts: AgentRequestOptions): Promise<AgentResponse> {
  const profile = opts.profile ?? pickRandom(BROWSER_PROFILES);
  const domain = getDomain(opts.url);
  const timeout = opts.timeout ?? 10000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  // Build headers in exact browser order
  const headers: Record<string, string> = {};

  // Core headers (order matters for fingerprinting)
  headers["host"] = new URL(opts.url).host;
  headers["user-agent"] = profile.ua;
  headers["accept"] = opts.acceptJson
    ? "application/json, text/plain, */*"
    : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8";
  headers["accept-language"] = "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6";
  headers["accept-encoding"] = "gzip, deflate, br";

  // Security headers (Chrome sends these, Safari doesn't)
  if (profile.secChUa) {
    headers["sec-ch-ua"] = profile.secChUa;
    headers["sec-ch-ua-mobile"] = profile.secChUaMobile;
    headers["sec-ch-ua-platform"] = profile.secChUaPlatform;
    headers["sec-fetch-dest"] = opts.acceptJson ? "empty" : "document";
    headers["sec-fetch-mode"] = opts.acceptJson ? "cors" : "navigate";
    headers["sec-fetch-site"] = opts.referer ? "same-origin" : "none";
    headers["sec-fetch-user"] = opts.acceptJson ? undefined! : "?1";
  }

  // Referer
  if (opts.referer) {
    headers["referer"] = opts.referer;
  }

  // Cookies
  const cookies = getCookieString(domain);
  if (cookies) {
    headers["cookie"] = cookies;
  }

  // Connection
  headers["connection"] = "keep-alive";
  headers["upgrade-insecure-requests"] = opts.acceptJson ? undefined! : "1";

  // Extra headers (marketplace-specific)
  if (opts.extraHeaders) {
    Object.assign(headers, opts.extraHeaders);
  }

  // Remove undefined values
  for (const key of Object.keys(headers)) {
    if (headers[key] === undefined) delete headers[key];
  }

  try {
    const res = await fetch(opts.url, {
      method: opts.method ?? "GET",
      headers,
      body: opts.body,
      cache: "no-store",
      signal: controller.signal,
      redirect: "follow",
    });

    // Store cookies from response
    const setCookies = res.headers.getSetCookie?.() ?? [];
    if (setCookies.length > 0) {
      storeCookies(domain, parseCookies(setCookies));
    }

    const text = await res.text();

    // Collect response headers
    const respHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { respHeaders[k] = v; });

    return { ok: res.ok, status: res.status, text, headers: respHeaders };
  } catch {
    return { ok: false, status: 0, text: "", headers: {} };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Visit a page first (like opening homepage), collect cookies,
 * then make the actual API/data request. This simulates real navigation.
 */
export async function humanNavigate(
  homepageUrl: string,
  targetUrl: string,
  opts?: {
    extraHeaders?: Record<string, string>;
    acceptJson?: boolean;
    delayMs?: [number, number];
  }
): Promise<AgentResponse> {
  const profile = pickRandom(BROWSER_PROFILES);

  // Step 1: Visit homepage (collect cookies & establish session)
  await humanFetch({
    url: homepageUrl,
    profile,
    timeout: 8000,
  });

  // Step 2: Random human-like delay (150-600ms)
  const [minDelay, maxDelay] = opts?.delayMs ?? [150, 600];
  await randomDelay(minDelay, maxDelay);

  // Step 3: Make the actual request with cookies from step 1
  return humanFetch({
    url: targetUrl,
    referer: homepageUrl,
    profile,
    extraHeaders: opts?.extraHeaders,
    acceptJson: opts?.acceptJson ?? true,
    timeout: 10000,
  });
}

/**
 * Try multiple strategies in order. Returns first successful result.
 */
export async function tryStrategies(
  strategies: Array<{
    name: string;
    fn: () => Promise<AgentResponse>;
  }>
): Promise<{ response: AgentResponse; strategy: string } | null> {
  for (const strategy of strategies) {
    try {
      const response = await strategy.fn();
      if (response.ok && response.text.length > 100) {
        return { response, strategy: strategy.name };
      }
    } catch {
      // Continue to next strategy
    }
    // Small delay between retries
    await randomDelay(100, 400);
  }
  return null;
}

/**
 * Get a random browser profile
 */
export function getRandomProfile(): BrowserProfile {
  return pickRandom(BROWSER_PROFILES);
}

/**
 * Clear cookies for a domain (useful for retry with fresh session)
 */
export function clearCookies(domain?: string) {
  if (domain) {
    cookieStore.delete(domain);
  } else {
    cookieStore.clear();
  }
}
