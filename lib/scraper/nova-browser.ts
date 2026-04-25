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
  /**
   * Force the Android mobile profile (touch viewport, real phone UA).
   * Mobile pages often have lighter bot checks and render prices in SSR
   * where desktop lazy-loads via XHR. On by default for marketplaces.
   */
  mobile?: boolean;
  /**
   * Scroll the page deeply (multiple viewport heights) to trigger lazy-loaded
   * product tiles. Default true; set false for JSON endpoints.
   */
  deepScroll?: boolean;
  /**
   * If set, capture the first XHR/fetch response whose URL matches this
   * regex and return its body as the result text. Used to scrape SPAs that
   * don't SSR product data (Ajio, Shopsy) — navigate to the page, let the
   * app fire its product-list XHR, snatch that JSON.
   */
  waitForXhr?: RegExp;
};

export type NovaXhrResult = NovaFetchResult & { xhrUrl?: string };

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

function pickProfile(mobile?: boolean): typeof CONTEXT_PROFILES[number] {
  if (mobile) return CONTEXT_PROFILES[2]; // Android Galaxy S24
  // Default: 50% Android, 25% Windows, 25% Mac — phone-heavy to look like
  // real Indian shopper traffic (70% mobile per Meesho/Flipkart telemetry).
  const r = Math.random();
  if (r < 0.5) return CONTEXT_PROFILES[2];
  if (r < 0.75) return CONTEXT_PROFILES[0];
  return CONTEXT_PROFILES[1];
}

async function createContext(
  browser: Browser,
  referer?: string,
  opts: { mobile?: boolean } = {}
): Promise<BrowserContext> {
  const profile = pickProfile(opts.mobile);
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

async function humanScroll(page: Page, deep = false): Promise<void> {
  // Scroll pattern that mimics a human thumb-flicking on a phone.
  // Deep mode goes to the bottom in multiple passes so lazy-loaded tiles get
  // triggered (React/Intersection-Observer product grids only render when
  // tiles enter viewport; without this scroll the DOM stays empty).
  try {
    await page.evaluate(async (isDeep) => {
      const total = document.documentElement.scrollHeight;
      const vh = window.innerHeight;
      const step = Math.max(400, vh * 0.8);
      const stops = isDeep ? Math.min(20, Math.ceil(total / step)) : 5;
      for (let i = 1; i <= stops; i += 1) {
        const y = Math.min(total, step * i);
        window.scrollTo({ top: y, behavior: "instant" });
        // Variable dwell — simulates reading. Lazy-load tiles typically
        // fire their IntersectionObserver within 300-600ms.
        await new Promise((r) => setTimeout(r, 280 + Math.random() * 380));
      }
      // Back to top so client-side virtualized grids (Meesho) keep the
      // earlier tiles mounted instead of recycling them out.
      window.scrollTo({ top: 0, behavior: "instant" });
      await new Promise((r) => setTimeout(r, 300));
    }, deep);
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
    // Default: mobile profile on. Marketplaces serve lighter, less bot-protected
    // HTML to Android Chrome because of their huge mobile user share.
    const useMobile = opts.mobile !== false;
    context = await createContext(browser, opts.referer, { mobile: useMobile });
    page = await context.newPage();

    // If the caller wants an XHR body, hook before navigation so we don't
    // miss early requests.
    let xhrPromise: Promise<{ url: string; body: string } | null> | null = null;
    if (opts.waitForXhr) {
      const pat = opts.waitForXhr;
      xhrPromise = page
        .waitForResponse(
          (r) => pat.test(r.url()) && r.status() >= 200 && r.status() < 400,
          { timeout: Math.max(5000, timeoutMs - 2000) }
        )
        .then(async (r) => ({ url: r.url(), body: await r.text() }))
        .catch(() => null);
    }

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
    const settle = Math.min(6000, Math.max(0, opts.settleMs ?? 1200));
    if (settle > 0) await page.waitForTimeout(settle);

    // Trigger lazy loads — deep by default so SPA product pages actually render.
    const doScroll = opts.deepScroll !== false;
    if (doScroll) {
      await humanScroll(page, true);
      // Extra dwell after scroll so IntersectionObserver fetches settle.
      await page.waitForTimeout(Math.min(2000, settle));
    }

    const status = response?.status() ?? 0;
    const finalUrl = page.url();

    // If caller asked for an XHR, resolve it now (we've given scroll + settle
    // time for the app to fire its requests).
    if (xhrPromise) {
      const xhr = await xhrPromise;
      if (xhr) {
        return {
          ok: xhr.body.length > 50,
          status: 200,
          text: xhr.body,
          headers: {},
          finalUrl: xhr.url,
        };
      }
    }

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
    const useMobile = opts.mobile !== false;
    context = await createContext(browser, opts.referer, { mobile: useMobile });
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

    const settle = Math.min(6000, Math.max(0, opts.settleMs ?? 1500));
    if (settle > 0) await page.waitForTimeout(settle);
    if (opts.deepScroll !== false) {
      await humanScroll(page, true);
      await page.waitForTimeout(Math.min(2000, settle));
    }

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

/**
 * Diagnostic helper — tries to launch Chromium and returns raw error messages.
 * Used by /api/nova-probe to surface why the browser won't start on a given
 * deploy (missing system libs, wrong path, permission denied, etc).
 */
export async function novaLaunchProbe(): Promise<{
  ok: boolean;
  stage: string;
  error?: string;
  chromePath?: string;
  browserVersion?: string;
}> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const launched = await (chromiumExtra as any).launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox", "--disable-dev-shm-usage"],
    });
    const version = await launched.version().catch(() => "unknown");
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const chromePath = ((chromiumExtra as any).executablePath?.() ?? "unknown") as string;
    await launched.close();
    return { ok: true, stage: "launched", browserVersion: version, chromePath };
  } catch (e) {
    return {
      ok: false,
      stage: "launch-failed",
      error:
        e instanceof Error
          ? `${e.name}: ${e.message}\n${e.stack?.split("\n").slice(0, 10).join("\n")}`
          : String(e),
    };
  }
}

/**
 * Diagnostic — navigate a URL and return every XHR/fetch URL the page
 * issues, so we can pick which endpoint to hook for SPA product scraping.
 */
export async function listXhrs(
  url: string,
  opts: { timeoutMs?: number; settleMs?: number } = {}
): Promise<Array<{ url: string; status: number; contentType: string; bodyLen: number }>> {
  await acquire();
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  const xhrs: Array<{ url: string; status: number; contentType: string; bodyLen: number }> = [];
  try {
    const browser = await getBrowser();
    context = await createContext(browser, undefined, { mobile: true });
    page = await context.newPage();
    page.on("response", async (r) => {
      try {
        const req = r.request();
        const type = req.resourceType();
        if (type !== "xhr" && type !== "fetch") return;
        const u = r.url();
        const ct = r.headers()["content-type"] ?? "";
        let len = 0;
        try {
          const body = await r.body();
          len = body.length;
        } catch { /* ignore */ }
        xhrs.push({ url: u, status: r.status(), contentType: ct, bodyLen: len });
      } catch { /* ignore */ }
    });
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: opts.timeoutMs ?? 25000 });
    await page.waitForTimeout(opts.settleMs ?? 2500);
    await humanScroll(page, true);
    await page.waitForTimeout(1500);
  } catch { /* ignore */ } finally {
    try { await page?.close(); } catch { /* ignore */ }
    try { await context?.close(); } catch { /* ignore */ }
    release();
  }
  return xhrs;
}

/**
 * Diagnostic — navigate a URL and dump top-level `window.*` keys plus a
 * shallow preview of each. Used to find where SPAs stash product data
 * (__NEXT_DATA__, __INITIAL_STATE__, Apollo cache, etc).
 */
export async function dumpWindowState(
  url: string
): Promise<{ keys: string[]; samples: Record<string, unknown> }> {
  await acquire();
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  try {
    const browser = await getBrowser();
    context = await createContext(browser, undefined, { mobile: true });
    page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 25000 });
    await page.waitForTimeout(2500);
    await humanScroll(page, true);
    await page.waitForTimeout(1500);
    const result = await page.evaluate(() => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const w = window as any;
      const interesting = [
        "__NEXT_DATA__", "__INITIAL_STATE__", "__REDUX_STATE__", "__PRELOADED_STATE__",
        "__APP_STATE__", "__APOLLO_STATE__", "APP_CONFIG", "__DATA__", "initialState",
        "__STORE__", "__FLIPKART__", "adminApp", "appState",
      ];
      const samples: Record<string, unknown> = {};
      for (const k of interesting) {
        if (w[k] !== undefined) {
          try {
            const s = typeof w[k] === "string" ? w[k] : JSON.stringify(w[k]);
            samples[k] = (s ?? "").slice(0, 1500);
          } catch {
            samples[k] = "[unstringifiable]";
          }
        }
      }
      // Also list top-level window keys that look custom (not built-in).
      const builtins = new Set([
        "window","self","document","location","history","navigator","screen","parent",
        "top","frames","length","closed","opener","origin","frameElement",
      ]);
      const customKeys = Object.keys(w).filter((k) => !builtins.has(k) && /^[A-Z_$]/.test(k));
      return { keys: customKeys.slice(0, 80), samples };
    });
    return result;
  } finally {
    try { await page?.close(); } catch { /* ignore */ }
    try { await context?.close(); } catch { /* ignore */ }
    release();
  }
}

/**
 * Generic product extractor for SPA marketplaces. Navigates the URL with deep
 * scroll, then in-page tree-walks every known window state global
 * (`__NEXT_DATA__`, `__PRELOADED_STATE__`, `__staticRouterHydrationData`,
 * `__APOLLO_STATE__`, etc) collecting objects shaped like products: must have
 * a name-ish field, a numeric price, and ideally an image URL.
 */
export type ExtractedProduct = {
  name: string;
  price: number;
  mrp?: number;
  image?: string;
  url?: string;
  brand?: string;
};

export async function extractWindowProducts(
  url: string,
  opts: { imgHostHint?: string; productUrlPrefix?: string; maxProducts?: number; settleMs?: number } = {}
): Promise<ExtractedProduct[]> {
  const max = opts.maxProducts ?? 60;
  await acquire();
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  try {
    const browser = await getBrowser();
    context = await createContext(browser, undefined, { mobile: true });
    page = await context.newPage();
    await page.goto(url, { waitUntil: "domcontentloaded", timeout: 30000 });
    await page.waitForTimeout(opts.settleMs ?? 4000);
    await humanScroll(page, true);
    await page.waitForTimeout(2500);
    await humanScroll(page, true);
    await page.waitForTimeout(2500);

    const products = await page.evaluate(
      ({ max, imgHint, urlPrefix }: { max: number; imgHint: string; urlPrefix: string }) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const w = window as any;
        const roots: unknown[] = [];
        const rootKeys = [
          "__NEXT_DATA__", "__PRELOADED_STATE__", "__INITIAL_STATE__",
          "__REDUX_STATE__", "__APP_STATE__", "__APOLLO_STATE__",
          "__staticRouterHydrationData", "__DATA__", "initialState",
        ];
        for (const k of rootKeys) if (w[k] !== undefined) roots.push(w[k]);

        const NAME_KEYS = ["name", "title", "productName", "product_name", "displayName", "shortDescription"];
        const PRICE_KEYS = ["price", "finalPrice", "sellingPrice", "selling_price", "currentPrice", "discountedPrice", "offerPrice", "offer_price", "min_price", "minPrice"];
        const MRP_KEYS = ["mrp", "originalPrice", "original_price", "listPrice", "list_price", "strikePrice", "strike_price", "wasPriceData"];
        const IMG_KEYS = ["image", "images", "imageUrl", "image_url", "imgUrl", "thumbnail", "img", "media", "mediaList"];
        const URL_KEYS = ["url", "permalink", "productUrl", "product_url", "pdpUrl", "link", "slug"];
        const BRAND_KEYS = ["brand", "brandName", "brand_name", "store"];

        const pickStr = (o: Record<string, unknown>, keys: string[]): string | undefined => {
          for (const k of keys) {
            const v = o[k];
            if (typeof v === "string" && v.trim().length > 1 && v.length < 250) return v.trim();
            if (Array.isArray(v) && typeof v[0] === "string") return v[0];
            if (v && typeof v === "object") {
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
              const inner = (v as any).url ?? (v as any).src ?? (v as any).href;
              if (typeof inner === "string") return inner;
            }
          }
          return undefined;
        };
        const pickNum = (o: Record<string, unknown>, keys: string[]): number | undefined => {
          for (const k of keys) {
            let v: unknown = o[k];
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            if (v && typeof v === "object" && (v as any).value !== undefined) v = (v as any).value;
            const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v.replace(/[^\d.]/g, "")) : NaN;
            if (Number.isFinite(n) && n > 9 && n < 1_000_000) return n;
          }
          return undefined;
        };

        const seen = new Set<string>();
        const out: ExtractedProduct[] = [];
        const stack: unknown[] = [...roots];
        const visited = new WeakSet<object>();
        let steps = 0;
        while (stack.length && steps < 200_000 && out.length < max) {
          steps++;
          const node = stack.pop();
          if (!node || typeof node !== "object") continue;
          if (visited.has(node as object)) continue;
          visited.add(node as object);

          if (Array.isArray(node)) {
            for (const v of node) stack.push(v);
            continue;
          }
          const o = node as Record<string, unknown>;
          const name = pickStr(o, NAME_KEYS);
          const price = pickNum(o, PRICE_KEYS);
          if (name && price && name.length >= 4 && /[a-zA-Z]/.test(name)) {
            let img = pickStr(o, IMG_KEYS);
            if (img && imgHint && !img.includes(imgHint) && !img.startsWith("http")) img = undefined;
            if (img && !img.startsWith("http")) img = "https:" + (img.startsWith("//") ? img : "//" + img);
            let purl = pickStr(o, URL_KEYS);
            if (purl && urlPrefix && !purl.startsWith("http")) purl = urlPrefix + (purl.startsWith("/") ? purl : "/" + purl);
            const key = `${name}|${price}`;
            if (!seen.has(key)) {
              seen.add(key);
              const p: ExtractedProduct = { name, price };
              const mrp = pickNum(o, MRP_KEYS);
              if (mrp && mrp > price) p.mrp = mrp;
              if (img) p.image = img;
              if (purl) p.url = purl;
              const brand = pickStr(o, BRAND_KEYS);
              if (brand) p.brand = brand;
              out.push(p);
            }
          }
          for (const v of Object.values(o)) {
            if (v && typeof v === "object") stack.push(v);
          }
        }
        // DOM fallback — when window-state walking yields too few products,
        // scan every <img> on the page, find its enclosing card-like
        // ancestor, and pull (alt|title|nearest-text) + nearest ₹price.
        if (out.length < 5) {
          const allImgs = Array.from(document.querySelectorAll("img"));
          const RUPEE_RE = /₹\s*([0-9][0-9,]{1,7})/;
          for (const img of allImgs) {
            if (out.length >= max) break;
            const src = img.getAttribute("src") || img.getAttribute("data-src") || "";
            if (!src || !/^https?:|^\/\//.test(src)) continue;
            if (imgHint && !src.includes(imgHint)) continue;
            // Walk up to find a card with rupee price
            let card: HTMLElement | null = img.closest<HTMLElement>("a,article,li,div");
            let priceText = "";
            for (let i = 0; i < 6 && card; i++) {
              const t = card.innerText || card.textContent || "";
              const m = t.match(RUPEE_RE);
              if (m) { priceText = m[1]; break; }
              card = card.parentElement;
            }
            if (!priceText) continue;
            const price = parseInt(priceText.replace(/,/g, ""), 10);
            if (!Number.isFinite(price) || price < 30 || price > 1_000_000) continue;
            // Get name: prefer alt/title, then aria-label/h*/parent first text line
            let name = (img.getAttribute("alt") || img.getAttribute("title") || "").trim();
            const GENERIC = /^(?:header|footer|banner|image|img|logo|icon|photo|picture|thumbnail|product|deal|offer|sale|shop|card|tile|hero|main|default|placeholder|)$/i;
            if (!name || GENERIC.test(name) || /^\d+$/.test(name)) {
              const aria = img.getAttribute("aria-label");
              if (aria) name = aria.trim();
            }
            if (!name || GENERIC.test(name) || /^\d+$/.test(name)) {
              // try nearest h1-h6 / span text
              let cur: HTMLElement | null = img.parentElement;
              for (let i = 0; i < 5 && cur && (!name || GENERIC.test(name)); i++) {
                const h = cur.querySelector("h1,h2,h3,h4,h5,h6");
                const candidate = (h?.textContent || cur.textContent || "").trim().split("\n")[0]?.trim();
                if (candidate && candidate.length >= 4 && !GENERIC.test(candidate) && /[a-zA-Z]/.test(candidate)) {
                  name = candidate;
                  break;
                }
                cur = cur.parentElement;
              }
            }
            if (!name || name.length < 4 || GENERIC.test(name) || !/[a-zA-Z]/.test(name)) continue;
            name = name.slice(0, 140);
            const key = `${name.toLowerCase().slice(0, 40)}|${price}`;
            if (seen.has(key)) continue;
            seen.add(key);
            const fullSrc = src.startsWith("http") ? src : "https:" + (src.startsWith("//") ? src : "//" + src);
            const linkEl = img.closest("a");
            let purl = linkEl?.getAttribute("href") || "";
            if (purl && !purl.startsWith("http") && urlPrefix) purl = urlPrefix + (purl.startsWith("/") ? purl : "/" + purl);
            out.push({ name, price, image: fullSrc, url: purl || undefined });
          }
        }
        return out;
      },
      { max, imgHint: opts.imgHostHint ?? "", urlPrefix: opts.productUrlPrefix ?? "" }
    );
    return products as ExtractedProduct[];
  } finally {
    try { await page?.close(); } catch { /* ignore */ }
    try { await context?.close(); } catch { /* ignore */ }
    release();
  }
}

/**
 * Land on `landingUrl` (so cookies + Akamai/DataDome session are established),
 * then call `apiUrls` from inside the page via fetch(). Returns the first
 * endpoint that responds with JSON (status 2xx, parsable). Bypasses TLS
 * fingerprinting because the request originates from the real browser.
 */
export async function inPageJson<T = unknown>(
  landingUrl: string,
  apiUrls: string[],
  opts: { headers?: Record<string, string>; timeoutMs?: number } = {}
): Promise<{ url: string; data: T } | null> {
  await acquire();
  let context: BrowserContext | null = null;
  let page: Page | null = null;
  try {
    const browser = await getBrowser();
    context = await createContext(browser, undefined, { mobile: true });
    page = await context.newPage();
    await page.goto(landingUrl, { waitUntil: "domcontentloaded", timeout: opts.timeoutMs ?? 25000 });
    await page.waitForTimeout(1800);
    await humanScroll(page, false);
    await page.waitForTimeout(800);

    const result = await page.evaluate(
      async ({ urls, headers }: { urls: string[]; headers: Record<string, string> }) => {
        for (const u of urls) {
          try {
            const r = await fetch(u, {
              method: "GET",
              credentials: "include",
              headers: { Accept: "application/json,*/*;q=0.8", ...headers },
            });
            if (!r.ok) continue;
            const ct = (r.headers.get("content-type") ?? "").toLowerCase();
            if (!ct.includes("json")) continue;
            const text = await r.text();
            try {
              return { url: u, data: JSON.parse(text) };
            } catch {
              /* not JSON, skip */
            }
          } catch {
            /* try next */
          }
        }
        return null;
      },
      { urls: apiUrls, headers: opts.headers ?? {} }
    );
    return result as { url: string; data: T } | null;
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
