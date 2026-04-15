import path from "path";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: []
  },
  outputFileTracingRoot: path.join(__dirname),
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
