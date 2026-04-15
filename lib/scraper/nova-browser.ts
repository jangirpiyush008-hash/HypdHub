/**
 * NOVA v2 — Stealth headless browser for scraping bot-protected marketplaces.
 *
 * Why this exists:
 *   Plain fetch() gets a 403 from Meesho/Flipkart/Ajio/Nykaa because the
 *   bot-protection CDNs (Akamai, DataDome, Cloudflare) fingerprint the
 *   TLS handshake (JA3) and HTTP/2 frame ordering BEFORE any HTTP byte is
 *   exchanged. No amount of User-Agent spoofing in Node fixes this — the
 *   only way to pass is to actually be Chrome.
 *
 * Architecture:
 *   - Single pooled Chromium instance (module singleton), lazily launched.
 *   - `playwright-extra` + `puppeteer-extra-plugin-stealth` patches the
 *     runtime to hide WebDriver artifacts (navigator.webdriver, missing
 *     chrome.runtime, permission API quirks, etc.).
 *   - Each novaFetch() creates a fresh BrowserContext (= incognito window)
 *     with Indian locale/timezone/UA, so cookies don't bleed between
 *     sites.
 *   - Concurrency is capped via a semaphore — headless Chrome can handle
 *     ~4 concurrent pages on Railway's hobby tier before OOM risk.
 *
 * Usage:
 *   const res = await novaFetch(url, { referer, waitForSelector, timeoutMs })
 *   res is shape-compatible with human-agent's FetchResult.
 */

import type { Browser, BrowserContext, Page } from "playwright";
import { chromium as chromiumExtra } from "playwright-extra";
// eslint-disable-next-line @typescript-eslint/no-require-imports
const StealthPlugin = require("puppeteer-extra-plugin-stealth");

// Register stealth plugin once at module load.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
(chromiumExtra as any).use(StealthPlugin());

export type NovaFetchResult = {
  ok: boolean;
  status: number;
  text: string;
  headers: Record<string, string>;
  finalUrl?: string;
};

export type NovaFetchOptions = {
  referer?: string;
  /** CSS selector to wait for before reading the page content (site-specific). */
  waitForSelector?: string;
  /** Extra wait after DOM loads — lets hydration run (default 800ms, max 4000ms). */
  settleMs?: number;
  /** Overall timeout, default 25s. */
  timeoutMs?: number;
  /** If true, intercept XHR/fetch response for a JSON endpoint instead of HTML. */
  acceptJson?: boolean;
};

const DEFAULT_TIMEOUT = 25_000;
const MAX_CONCURRENCY = 3;

let browserPromise: Promise<Browser> | null = null;
let active = 0;
const queue: Array<() => void> = [];

async function acquire(): Promise<void> {
  if (active < MAX_CONCURRENCY) {
    active += 1;
    return;
  }
  await new Promise<void>((resolve) => queue.push(resolve));
  active += 1;
}

function release(): void {
  active -= 1;
  const next = queue.shift();
  if (next) next();
}

async function getBrowser(): Promise<Browser> {
  if (!browserPromise) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    browserPromise = (chromiumExtra as any)
      .launch({
        headless: true,
        // These flags reduce the chance of detection + keep memory low on Railway.
        args: [
          "--no-sandbox",
          "--disable-setuid-sandbox",
          "--disable-dev-shm-usage",
          "--disable-gpu",
          "--disable-blink-features=AutomationControlled",
          "--disable-features=IsolateOrigins,site-per-process",
          "--disable-web-security",
          "--no-first-run",
          "--no-default-browser-check",
          "--disable-extensions",
          "--disable-background-networking",
          "--disable-sync",
          "--metrics-recording-only",
          "--mute-audio",
          "--hide-scrollbars",
        ],
      })
      .catch((err: Error) => {
        browserPromise = null;
        throw err;
      });
  }
  const b = await browserPromise;
  if (!b) throw new Error("Failed to launch Chromium");
  return b;
}

// Profiles for BrowserContext — real-user-looking Chrome on desktop/mobile India.
const CONTEXT_PROFILES = [
  {
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36",
    viewport: { width: 1366, height: 768 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
  },
  {
    userAgent:
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 2,
    isMobile: false,
    hasTouch: false,
  },
  {
    userAgent:
      "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.6422.113 Mobile Safari/537.36",
    viewport: { width: 412, height: 915 },
    deviceScaleFactor: 2.625,
    isMobile: true,
    hasTouch: true,
  },
];

function pickProfile(): typeof CONTEXT_PROFILES[number] {
  return CONTEXT_PROFILES[Math.floor(Math.random() * CONTEXT_PROFILES.length)];
}

async function createContext(browser: Browser, referer?: string): Promise<BrowserContext> {
  const profile = pickProfile();
  const ctx = await browser.newContext({
    userAgent: profile.userAgent,
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    locale: "en-IN",
    timezoneId: "Asia/Kolkata",
    geolocation: { latitude: 19.076, longitude: 72.8777, accuracy: 50 }, // Mumbai
    permissions: [],
    extraHTTPHeaders: {
      "Accept-Language": "en-IN,en-GB;q=0.9,en-US;q=0.8,en;q=0.7,hi;q=0.6",
      ...(referer ? { Referer: referer } : {}),
    },
    // Block heavy/unused resource types to speed up scraping.
    bypassCSP: true,
  });

  // Block images/fonts/media by default — we don't render, we only read DOM.
  // Exception: sometimes images are needed (for imgSrc-regex fallbacks), but
  // callers that need them can opt out. Here we keep it light.
  await ctx.route("**/*", (route) => {
    const type = route.request().resourceType();
    if (type === "image" || type === "font" || type === "media") {
      return route.abort();
    }
    return route.continue();
  });

  return ctx;
}

async function humanScroll(page: Page): Promise<void> {
  // Small, realistic scroll pattern to trigger lazy-loaded product tiles.
  try {
    await page.evaluate(async () => {
      const heights = [300, 700, 1200, 1800, 2400];
      for (const h of heights) {
        window.scrollTo({ top: h, behavior: "instant" });
        await new Promise((r) => setTimeout(r, 200 + Math.random() * 200));
      }
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  } catch {
    /* ignore */
  }
}

/**
 * Fetch a URL through a real stealth Chrome.
 * Shape-compatible with human-agent.FetchResult so callers can drop it in.
 */
export async function novaFetch(url: string, opts: NovaFetchOptions = {}): Promise<NovaFetchResult> {
  await acquire();
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;

  try {
    const browser = await getBrowser();
    context = await createContext(browser, opts.referer);
    page = await context.newPage();

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
      referer: opts.referer,
    });

    if (opts.waitForSelector) {
      await page
        .waitForSelector(opts.waitForSelector, { timeout: Math.min(8000, timeoutMs / 2) })
        .catch(() => {});
    }

    // Let client-side JS hydrate product grids.
    const settle = Math.min(4000, Math.max(0, opts.settleMs ?? 800));
    if (settle > 0) await page.waitForTimeout(settle);

    // Trigger lazy loads.
    await humanScroll(page);
    if (settle > 0) await page.waitForTimeout(Math.min(1200, settle));

    const status = response?.status() ?? 0;
    const finalUrl = page.url();
    const text = opts.acceptJson ? await extractJson(page) : await page.content();
    const headers = (response?.headers() ?? {}) as Record<string, string>;

    return {
      ok: status >= 200 && status < 400 && text.length > 200,
      status: status || (text.length > 200 ? 200 : 0),
      text,
      headers,
      finalUrl,
    };
  } catch {
    return { ok: false, status: 0, text: "", headers: {} };
  } finally {
    try { await page?.close(); } catch { /* ignore */ }
    try { await context?.close(); } catch { /* ignore */ }
    release();
  }
}

async function extractJson(page: Page): Promise<string> {
  try {
    // On JSON responses Chrome wraps the body in <pre> — extract it.
    return await page.evaluate(() => {
      const pre = document.querySelector("pre");
      if (pre?.textContent) return pre.textContent;
      return document.body?.innerText ?? "";
    });
  } catch {
    return "";
  }
}

/**
 * Deep-navigate: visit precursor URLs to warm cookies/session, then fetch target.
 * Mirrors humanDeepNavigate but all steps run in the same real Chrome context
 * so Akamai/DataDome see a consistent browsing session.
 */
export async function novaDeepNavigate(
  steps: string[],
  opts: NovaFetchOptions = {}
): Promise<NovaFetchResult> {
  if (steps.length < 2) return novaFetch(steps[0], opts);

  await acquire();
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  const timeoutMs = opts.timeoutMs ?? DEFAULT_TIMEOUT;

  try {
    const browser = await getBrowser();
    context = await createContext(browser, opts.referer);
    page = await context.newPage();

    // Visit precursors — short waits, ignore failures.
    for (let i = 0; i < steps.length - 1; i += 1) {
      try {
        await page.goto(steps[i], { waitUntil: "domcontentloaded", timeout: 12000 });
        await page.waitForTimeout(300 + Math.random() * 400);
      } catch {
        /* continue — not fatal */
      }
    }

    const last = steps[steps.length - 1];
    const response = await page.goto(last, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
      referer: steps[steps.length - 2],
    });

    if (opts.waitForSelector) {
      await page
        .waitForSelector(opts.waitForSelector, { timeout: Math.min(8000, timeoutMs / 2) })
        .catch(() => {});
    }

    const settle = Math.min(4000, Math.max(0, opts.settleMs ?? 1000));
    if (settle > 0) await page.waitForTimeout(settle);
    await humanScroll(page);
    if (settle > 0) await page.waitForTimeout(Math.min(1200, settle));

    const status = response?.status() ?? 0;
    const finalUrl = page.url();
    const text = opts.acceptJson ? await extractJson(page) : await page.content();
    const headers = (response?.headers() ?? {}) as Record<string, string>;

    return {
      ok: status >= 200 && status < 400 && text.length > 200,
      status: status || (text.length > 200 ? 200 : 0),
      text,
      headers,
      finalUrl,
    };
  } catch {
    return { ok: false, status: 0, text: "", headers: {} };
  } finally {
    try { await page?.close(); } catch { /* ignore */ }
    try { await context?.close(); } catch { /* ignore */ }
    release();
  }
}

/** Shut down the pooled browser — called on process exit / manual admin. */
export async function novaShutdown(): Promise<void> {
  if (!browserPromise) return;
  try {
    const browser = await browserPromise;
    await browser.close();
  } catch {
    /* ignore */
  } finally {
    browserPromise = null;
  }
}
