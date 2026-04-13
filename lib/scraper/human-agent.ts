/**
 * Human Browser Agent — Lightweight HTTP fetcher with Chrome headers.
 * No cookie engine, no session management — just proper headers.
 */

import { gunzipSync } from "zlib";

const CHROME_PROFILES = [
  {
    name: "Chrome 125 Android Samsung",
    ua: "Mozilla/5.0 (Linux; Android 14; SM-S928B Build/UP1A.231005.007) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36",
    secChUa: '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    secChUaPlatform: '"Android"',
    secChUaMobile: "?1",
    acceptLanguage: "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
  },
  {
    name: "Chrome 124 Android Pixel",
    ua: "Mozilla/5.0 (Linux; Android 13; Pixel 8 Pro Build/TQ3A.230901.001) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.6367.179 Mobile Safari/537.36",
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    secChUaPlatform: '"Android"',
    secChUaMobile: "?1",
    acceptLanguage: "en-IN,en;q=0.9,hi;q=0.8",
  },
  {
    name: "Chrome 125 Windows",
    ua: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    secChUa: '"Google Chrome";v="125", "Chromium";v="125", "Not.A/Brand";v="24"',
    secChUaPlatform: '"Windows"',
    secChUaMobile: "?0",
    acceptLanguage: "en-US,en;q=0.9,en-IN;q=0.8",
  },
  {
    name: "Chrome 124 macOS",
    ua: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    secChUa: '"Chromium";v="124", "Google Chrome";v="124", "Not-A.Brand";v="99"',
    secChUaPlatform: '"macOS"',
    secChUaMobile: "?0",
    acceptLanguage: "en-IN,en-GB;q=0.9,en;q=0.8",
  },
];

type BrowserProfile = (typeof CHROME_PROFILES)[number];

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function delay(minMs: number, maxMs: number): Promise<void> {
  const ms = Math.round(minMs + Math.random() * (maxMs - minMs));
  return new Promise((r) => setTimeout(r, ms));
}

export interface FetchOptions {
  url: string;
  profile?: BrowserProfile;
  referer?: string;
  extraHeaders?: Record<string, string>;
  timeout?: number;
  acceptJson?: boolean;
  method?: "GET" | "POST";
  body?: string;
}

export interface FetchResult {
  ok: boolean;
  status: number;
  text: string;
  headers: Record<string, string>;
}

export async function humanFetch(opts: FetchOptions): Promise<FetchResult> {
  const profile = opts.profile ?? pickRandom(CHROME_PROFILES);
  const timeout = opts.timeout ?? 10000;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeout);

  const h: [string, string][] = [];
  h.push(["accept", opts.acceptJson
    ? "application/json, text/plain, */*"
    : "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8"
  ]);
  h.push(["accept-language", profile.acceptLanguage]);
  if (profile.secChUa) h.push(["sec-ch-ua", profile.secChUa]);
  if (profile.secChUaMobile) h.push(["sec-ch-ua-mobile", profile.secChUaMobile]);
  if (profile.secChUaPlatform) h.push(["sec-ch-ua-platform", profile.secChUaPlatform]);
  h.push(["sec-fetch-dest", opts.acceptJson ? "empty" : "document"]);
  h.push(["sec-fetch-mode", opts.acceptJson ? "cors" : "navigate"]);
  h.push(["sec-fetch-site", opts.referer ? "same-origin" : "none"]);
  if (!opts.acceptJson) h.push(["upgrade-insecure-requests", "1"]);
  h.push(["user-agent", profile.ua]);
  if (opts.referer) h.push(["referer", opts.referer]);
  if (opts.extraHeaders) {
    for (const [k, v] of Object.entries(opts.extraHeaders)) h.push([k, v]);
  }

  const headers = new Headers();
  for (const [k, v] of h) {
    if (v !== undefined && v !== "") headers.set(k, v);
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

    let text: string;
    const encoding = res.headers.get("content-encoding");
    if (encoding === "gzip") {
      try {
        const buf = Buffer.from(await res.arrayBuffer());
        text = gunzipSync(buf).toString("utf-8");
      } catch { text = await res.text(); }
    } else {
      text = await res.text();
    }

    const respHeaders: Record<string, string> = {};
    res.headers.forEach((v, k) => { respHeaders[k] = v; });
    return { ok: res.ok, status: res.status, text, headers: respHeaders };
  } catch {
    return { ok: false, status: 0, text: "", headers: {} };
  } finally {
    clearTimeout(timer);
  }
}

export async function humanNavigate(
  homepageUrl: string,
  targetUrl: string,
  opts?: { extraHeaders?: Record<string, string>; acceptJson?: boolean; delayMs?: [number, number] }
): Promise<FetchResult> {
  const profile = pickRandom(CHROME_PROFILES);
  await humanFetch({ url: homepageUrl, profile, timeout: 8000 });
  const [min, max] = opts?.delayMs ?? [150, 500];
  await delay(min, max);
  return humanFetch({
    url: targetUrl,
    referer: homepageUrl,
    profile,
    extraHeaders: opts?.extraHeaders,
    acceptJson: opts?.acceptJson ?? true,
    timeout: 10000,
  });
}

export async function humanDeepNavigate(
  steps: string[],
  opts?: { extraHeaders?: Record<string, string>; acceptJson?: boolean }
): Promise<FetchResult> {
  if (steps.length < 2) {
    return humanFetch({ url: steps[0], acceptJson: opts?.acceptJson });
  }
  const profile = pickRandom(CHROME_PROFILES);
  for (let i = 0; i < steps.length - 1; i++) {
    await humanFetch({ url: steps[i], profile, referer: i > 0 ? steps[i - 1] : undefined, timeout: 8000 });
    await delay(100, 300);
  }
  return humanFetch({
    url: steps[steps.length - 1],
    referer: steps[steps.length - 2],
    profile,
    extraHeaders: opts?.extraHeaders,
    acceptJson: opts?.acceptJson,
    timeout: 10000,
  });
}

export async function tryStrategies(
  strategies: Array<{ name: string; fn: () => Promise<FetchResult> }>
): Promise<{ response: FetchResult; strategy: string } | null> {
  for (const strategy of strategies) {
    try {
      const response = await strategy.fn();
      if (response.ok && response.text.length > 200) {
        return { response, strategy: strategy.name };
      }
    } catch { /* next */ }
  }
  return null;
}

export function getRandomProfile(): BrowserProfile {
  return pickRandom(CHROME_PROFILES);
}
