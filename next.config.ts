import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: []
  },
  outputFileTracingRoot: path.join(__dirname),
  // ── Anti-inspection hardening ──────────────────────────────────────
  // None of this stops a determined dev with a proxy — but it raises the
  // bar against right-click/F12/view-source snooping and removes obvious
  // framework + module-path fingerprints from the bundle.
  productionBrowserSourceMaps: false,
  poweredByHeader: false,
  compiler: {
    // Strip console.log/info/warn from prod (keep console.error for real
    // runtime issues). Kills any debug logs that might narrate scraper
    // internals to someone watching the browser console.
    removeConsole:
      process.env.NODE_ENV === "production" ? { exclude: ["error"] } : false,
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), interest-cohort=()" },
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
  // Keep Playwright + stealth plugin out of the webpack bundle — they use
  // dynamic require()s (puppeteer-extra-plugin → clone-deep) that webpack
  // can't statically analyze. Loading at runtime via Node's native resolver
  // is both faster and correct for server-only scraper code.
  serverExternalPackages: [
    "playwright",
    "playwright-core",
    "playwright-extra",
    "puppeteer-extra",
    "puppeteer-extra-plugin",
    "puppeteer-extra-plugin-stealth",
    "clone-deep",
    "merge-deep",
  ],
};

export default nextConfig;
