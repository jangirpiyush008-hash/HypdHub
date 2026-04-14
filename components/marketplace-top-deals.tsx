"use client";

import { useEffect, useMemo, useState, useCallback } from "react";
import { InternetDeal } from "@/lib/types";

type DealsApiResponse = {
  generatedAt: string;
  refreshWindowHours: number;
  isLoggedIn?: boolean;
  creatorUsername?: string;
  telegramDealsCount: number;
  validatedDealsCount: number;
  history: {
    lastRefreshAt: string | null;
    trackedDeals: number;
    trackedSnapshots: number;
  };
  deals?: InternetDeal[];
  topDealsByMarketplace: Record<string, InternetDeal[]>;
  hypd: {
    status: string;
    hotSellingProducts: Array<{
      id: string;
      title: string;
      brandName: string;
      imageUrl: string | null;
      orderCount: number;
      productUrl: string | null;
    }>;
    hotSellingBrands: Array<{
      id: string;
      name: string;
      imageUrl: string | null;
      orderCount: number;
    }>;
    marketplaceCommissions: Array<{
      label: string;
      commission: string;
    }>;
    stats: {
      sales: string | null;
      orders: string | null;
      withdrawable: string | null;
      pending: string | null;
    };
  };
};

const ALL_MARKETPLACES = ["All", "Myntra", "Amazon", "Flipkart", "Ajio", "Nykaa", "Shopsy", "HYPD"] as const;

const PRICE_RANGES = [
  { label: "All Prices", min: 0, max: 999999 },
  { label: "Under ₹500", min: 0, max: 500 },
  { label: "₹500 – ₹1K", min: 500, max: 1000 },
  { label: "₹1K – ₹2K", min: 1000, max: 2000 },
  { label: "₹2K – ₹5K", min: 2000, max: 5000 },
  { label: "₹5K+", min: 5000, max: 999999 },
];

const MARKETPLACE_BRANDING: Record<string, { color: string; bg: string; logoBg: string; logoFile: string; fallbackLetter: string }> = {
  Myntra: { color: "#ff3f6c", bg: "#ff3f6c15", logoBg: "#ffffff", logoFile: "/logos/myntra.png", fallbackLetter: "M" },
  Amazon: { color: "#ff9900", bg: "#ff990015", logoBg: "#ffffff", logoFile: "/logos/amazon.png", fallbackLetter: "a" },
  Flipkart: { color: "#2874f0", bg: "#2874f015", logoBg: "transparent", logoFile: "/logos/flipkart.png", fallbackLetter: "F" },
  Ajio: { color: "#3b3b3b", bg: "#3b3b3b15", logoBg: "#ffffff", logoFile: "/logos/ajio.png", fallbackLetter: "A" },
  Nykaa: { color: "#fc2779", bg: "#fc277915", logoBg: "#ffffff", logoFile: "/logos/nykaa.png", fallbackLetter: "N" },
  Shopsy: { color: "#7b2ff7", bg: "#7b2ff715", logoBg: "transparent", logoFile: "/logos/shopsy.png", fallbackLetter: "S" },
  HYPD: { color: "#fb6c23", bg: "#fb6c2315", logoBg: "transparent", logoFile: "/logos/hypd.png", fallbackLetter: "H" },
};

function MarketplaceLogo({ marketplace, size = 20 }: { marketplace: string; size?: number }) {
  const [useFallback, setUseFallback] = useState(false);
  const branding = MARKETPLACE_BRANDING[marketplace] ?? MARKETPLACE_BRANDING.HYPD;

  if (useFallback) {
    return (
      <span
        className="inline-flex flex-shrink-0 items-center justify-center rounded font-bold text-white"
        style={{ width: size, height: size, fontSize: size * 0.55, backgroundColor: branding.color }}
      >
        {branding.fallbackLetter}
      </span>
    );
  }

  return (
    <span
      className="inline-flex flex-shrink-0 items-center justify-center overflow-hidden rounded"
      style={{ width: size, height: size, backgroundColor: branding.logoBg }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={branding.logoFile}
        alt={marketplace}
        className="h-full w-full object-contain"
        style={{ padding: size > 20 ? 2 : 1 }}
        onError={() => setUseFallback(true)}
      />
    </span>
  );
}

function decodeEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'").replace(/&#39;/g, "'").replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

/** Extract where a URL will take the user */
function getDestinationLabel(url: string): string {
  try {
    const u = new URL(url);
    const p = u.pathname + u.search;
    if (u.searchParams.has("q") || u.searchParams.has("k") || u.searchParams.has("rawQuery") || u.searchParams.has("text")) {
      const q = u.searchParams.get("q") || u.searchParams.get("k") || u.searchParams.get("rawQuery") || u.searchParams.get("text") || "";
      return q.replace(/\+/g, " ").slice(0, 40);
    }
    if (p.includes("/search")) return "search results";
    if (p.includes("/sale") || p.includes("/deals") || p.includes("/offers")) return "deals & offers";
    if (p.includes("/men-")) return p.split("/").pop()?.replace(/-/g, " ") || "category";
    if (p.includes("/women-")) return p.split("/").pop()?.replace(/-/g, " ") || "category";
    const clean = u.pathname.split("/").filter(Boolean).pop() || "";
    return clean.replace(/-/g, " ").slice(0, 30) || "marketplace";
  } catch { return "marketplace"; }
}

// ─── PRODUCT CARD (single product focus) ───
function ProductCard({ deal, branding }: { deal: InternetDeal; branding: typeof MARKETPLACE_BRANDING["Myntra"] }) {
  const [imgFailed, setImgFailed] = useState(false);
  const cleanTitle = decodeEntities(deal.title);
  const href = deal.originalUrl || deal.canonicalUrl;
  const dest = href ? getDestinationLabel(href) : "";

  return (
    <a
      href={href || "#"}
      target="_blank"
      rel="noreferrer"
      className="card-hover overflow-hidden rounded-xl bg-surface-card flex flex-col transition-all hover:shadow-lg group"
    >
      {/* Product image area */}
      <div className="aspect-[4/3] w-full overflow-hidden">
        {deal.imageUrl && !imgFailed ? (
          <div className="relative h-full w-full rounded-t-lg bg-white">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={deal.imageUrl}
              alt={cleanTitle}
              loading="lazy"
              className="h-full w-full rounded-t-lg object-contain p-2 group-hover:scale-105 transition-transform"
              onError={() => setImgFailed(true)}
            />
            <div className="absolute bottom-1.5 right-1.5 rounded-md shadow-sm" style={{ backgroundColor: branding.logoBg === "transparent" ? undefined : "white" }}>
              <MarketplaceLogo marketplace={deal.marketplace} size={22} />
            </div>
          </div>
        ) : (
          <div className="flex h-full w-full flex-col items-center justify-center gap-3 rounded-t-lg bg-surface-high p-4 group-hover:bg-surface-bright transition-colors">
            <MarketplaceLogo marketplace={deal.marketplace} size={48} />
            <span className="line-clamp-2 text-center text-[11px] font-semibold leading-tight text-muted">{cleanTitle}</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex flex-1 flex-col p-3">
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1 rounded-md px-1.5 py-1 text-[10px] font-bold" style={{ backgroundColor: branding.bg, color: branding.color }}>
            <MarketplaceLogo marketplace={deal.marketplace} size={14} />
            {deal.marketplace}
          </span>
          {deal.category && deal.category !== "General" && (
            <span className="text-[10px] text-muted">{deal.category}</span>
          )}
        </div>

        <h4 className="mt-1.5 text-sm font-bold text-text line-clamp-2 flex-1">{cleanTitle}</h4>

        <div className="mt-2 flex items-center gap-2">
          {deal.currentPrice ? (
            <p className="font-headline text-base font-bold text-text">₹{deal.currentPrice.toLocaleString("en-IN")}</p>
          ) : null}
          {deal.originalPrice ? (
            <p className="text-xs text-muted line-through">₹{deal.originalPrice.toLocaleString("en-IN")}</p>
          ) : null}
          {deal.discountPercent ? (
            <span className="rounded bg-tertiary/15 px-1.5 py-0.5 text-[10px] font-bold text-tertiary">{deal.discountPercent}% off</span>
          ) : null}
        </div>

        {/* Product link button */}
        <div
          className="mt-3 flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all group-hover:opacity-90"
          style={{ backgroundColor: branding.color, color: "white" }}
        >
          <MarketplaceLogo marketplace={deal.marketplace} size={16} />
          Buy on {deal.marketplace} →
        </div>
        {dest && (
          <p className="mt-1 text-center text-[9px] text-muted truncate">→ {dest}</p>
        )}
      </div>
    </a>
  );
}

// ─── CATEGORY CARD (browse category focus) ───
function CategoryCard({ deal, branding }: { deal: InternetDeal; branding: typeof MARKETPLACE_BRANDING["Myntra"] }) {
  const cleanTitle = decodeEntities(deal.title);
  const href = deal.categoryUrl || deal.originalUrl || deal.canonicalUrl;
  const dest = href ? getDestinationLabel(href) : "";
  const categoryName = deal.category && deal.category !== "General" ? deal.category : deal.marketplace;

  return (
    <a
      href={href || "#"}
      target="_blank"
      rel="noreferrer"
      className="card-hover overflow-hidden rounded-xl flex flex-col transition-all hover:shadow-lg group"
      style={{ backgroundColor: branding.bg, border: `1px solid ${branding.color}20` }}
    >
      {/* Category header */}
      <div className="flex items-center gap-3 px-4 pt-4 pb-2">
        <div className="rounded-lg p-2" style={{ backgroundColor: "white" }}>
          <MarketplaceLogo marketplace={deal.marketplace} size={28} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: branding.color }}>
            {deal.marketplace} · {categoryName}
          </p>
          <p className="text-xs font-semibold text-text mt-0.5 truncate">{cleanTitle}</p>
        </div>
      </div>

      {/* Deal info */}
      <div className="px-4 pb-3 flex-1">
        <div className="flex items-center gap-2 mt-1">
          {deal.currentPrice ? (
            <p className="font-headline text-lg font-bold text-text">₹{deal.currentPrice.toLocaleString("en-IN")}</p>
          ) : null}
          {deal.originalPrice ? (
            <p className="text-xs text-muted line-through">₹{deal.originalPrice.toLocaleString("en-IN")}</p>
          ) : null}
          {deal.discountPercent ? (
            <span className="rounded px-1.5 py-0.5 text-[10px] font-bold" style={{ backgroundColor: branding.color + "20", color: branding.color }}>
              {deal.discountPercent}% off
            </span>
          ) : null}
        </div>

        {/* Similar products hint */}
        <p className="mt-2 text-[10px] text-muted">
          Browse more {categoryName.toLowerCase()} deals on {deal.marketplace}
        </p>
      </div>

      {/* Category button */}
      <div className="px-4 pb-4">
        <div
          className="flex items-center justify-center gap-1.5 rounded-lg py-2.5 text-xs font-bold transition-all group-hover:opacity-90 border"
          style={{ borderColor: branding.color + "40", color: branding.color, backgroundColor: "white" }}
        >
          <MarketplaceLogo marketplace={deal.marketplace} size={16} />
          Browse {categoryName} →
        </div>
        {dest && (
          <p className="mt-1 text-center text-[9px] text-muted truncate">→ {dest}</p>
        )}
      </div>
    </a>
  );
}

export function MarketplaceTopDeals({ refreshKey = 0, isLoggedIn = false }: { refreshKey?: number; isLoggedIn?: boolean }) {
  const [data, setData] = useState<DealsApiResponse | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);
  const [linkMode, setLinkMode] = useState<"product" | "category">("product");
  const [lastRefresh, setLastRefresh] = useState<string>("");

  const loadDeals = useCallback(() => {
    fetch("/api/deals")
      .then((res) => res.json())
      .then((result: DealsApiResponse) => {
        setData(result);
        setLastRefresh(new Date().toLocaleTimeString());
      })
      .catch(() => setData(null));
  }, []);

  useEffect(() => { loadDeals(); }, [refreshKey, loadDeals]);

  // Auto-refresh every 2 hours
  useEffect(() => {
    const interval = setInterval(loadDeals, 2 * 60 * 60 * 1000);
    return () => clearInterval(interval);
  }, [loadDeals]);

  const allDeals = useMemo(() => {
    if (!data) return [];
    const deals: InternetDeal[] = [];
    for (const [, marketDeals] of Object.entries(data.topDealsByMarketplace)) {
      deals.push(...marketDeals);
    }
    return deals;
  }, [data]);

  const marketplaceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const deal of allDeals) {
      counts[deal.marketplace] = (counts[deal.marketplace] || 0) + 1;
    }
    return counts;
  }, [allDeals]);

  const filteredDeals = useMemo(() => {
    const range = PRICE_RANGES[selectedPriceRange];
    return allDeals.filter((deal) => {
      const marketplaceMatch = selectedMarketplace === "All" || deal.marketplace === selectedMarketplace;
      const price = deal.currentPrice ?? 0;
      const priceMatch = deal.currentPrice === null || (price >= range.min && price <= range.max);
      return marketplaceMatch && priceMatch;
    });
  }, [allDeals, selectedMarketplace, selectedPriceRange]);

  if (!data) {
    return (
      <div className="space-y-4">
        <div className="h-12 animate-pulse rounded-xl bg-surface-card" />
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-surface-card" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* ── Filter Header ── */}
      <div className="rounded-xl bg-surface-card p-4 space-y-3">
        {/* Link mode toggle + Marketplace tabs */}
        <div className="hide-scrollbar -mx-1 flex items-center gap-2 overflow-x-auto px-1 pb-1">
          {/* Product / Category toggle */}
          <div className="flex flex-shrink-0 items-center rounded-lg bg-surface-high p-0.5">
            <button
              onClick={() => setLinkMode("product")}
              className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition-all ${
                linkMode === "product"
                  ? "bg-blue-600 text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              🛒 Product Link
            </button>
            <button
              onClick={() => setLinkMode("category")}
              className={`rounded-md px-3 py-1.5 text-[11px] font-bold transition-all ${
                linkMode === "category"
                  ? "bg-purple-600 text-white shadow-sm"
                  : "text-muted hover:text-text"
              }`}
            >
              📂 Category Link
            </button>
          </div>

          <div className="h-6 w-px flex-shrink-0 bg-border" />

          {ALL_MARKETPLACES.map((m) => {
            const isActive = selectedMarketplace === m;
            const count = m === "All" ? allDeals.length : (marketplaceCounts[m] || 0);
            return (
              <button
                key={m}
                onClick={() => setSelectedMarketplace(m)}
                className={`flex-shrink-0 flex items-center gap-1.5 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-high text-muted hover:bg-surface-bright hover:text-text"
                }`}
              >
                {m !== "All" && <MarketplaceLogo marketplace={m} size={16} />}
                {m}
                {count > 0 && (
                  <span className={`rounded-full px-1.5 py-0.5 text-[10px] ${
                    isActive ? "bg-white/20 text-white" : "bg-surface-card text-muted"
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Price range */}
        <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1">
          {PRICE_RANGES.map((range, idx) => (
            <button
              key={range.label}
              onClick={() => setSelectedPriceRange(idx)}
              className={`flex-shrink-0 rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-all ${
                selectedPriceRange === idx
                  ? "bg-tertiary/15 text-tertiary ring-1 ring-tertiary/30"
                  : "bg-surface-high text-muted hover:text-text"
              }`}
            >
              {range.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Mode indicator + Results count ── */}
      <div className="flex items-center justify-between px-1">
        <div className="flex items-center gap-2">
          <span className={`rounded-md px-2 py-1 text-[10px] font-bold ${
            linkMode === "product"
              ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400"
              : "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400"
          }`}>
            {linkMode === "product" ? "🛒 PRODUCT MODE" : "📂 CATEGORY MODE"}
          </span>
          <p className="text-xs text-muted">
            {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""}
            {selectedMarketplace !== "All" ? ` on ${selectedMarketplace}` : ""}
          </p>
        </div>
        {selectedMarketplace !== "All" || selectedPriceRange !== 0 ? (
          <button
            onClick={() => { setSelectedMarketplace("All"); setSelectedPriceRange(0); }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/* ── Deal Cards — COMPLETELY DIFFERENT layout per mode ── */}
      {filteredDeals.length === 0 ? (
        <div className="rounded-xl bg-surface-card p-8 text-center">
          <p className="text-sm text-muted">No deals match your filters.</p>
        </div>
      ) : (
        <div className={`grid gap-3 ${
          linkMode === "product"
            ? "sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
            : "sm:grid-cols-1 lg:grid-cols-2 xl:grid-cols-3"
        }`}>
          {filteredDeals.map((deal) => {
            const branding = MARKETPLACE_BRANDING[deal.marketplace] ?? MARKETPLACE_BRANDING.HYPD;

            if (linkMode === "product") {
              return <ProductCard key={deal.id} deal={deal} branding={branding} />;
            } else {
              return <CategoryCard key={deal.id} deal={deal} branding={branding} />;
            }
          })}
        </div>
      )}

      {/* Login prompt for more deals */}
      {!isLoggedIn && filteredDeals.length > 0 && (
        <div className="rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-tertiary/10 p-6 text-center border border-primary/20">
          <h3 className="font-headline text-lg font-bold text-text">
            Login to see 10+ deals per marketplace
          </h3>
          <p className="mt-1 text-sm text-muted">
            Get personalized affiliate links with your HYPD creator account
          </p>
          <a
            href="/login"
            className="mt-3 inline-block rounded-lg bg-cta-gradient px-6 py-2.5 text-sm font-bold text-white shadow-glow"
          >
            Login with HYPD
          </a>
        </div>
      )}

      {/* Creator badge when logged in */}
      {isLoggedIn && data?.creatorUsername && (
        <div className="flex items-center justify-center gap-2 rounded-lg bg-tertiary/10 px-4 py-2 text-xs">
          <span className="h-2 w-2 rounded-full bg-tertiary" />
          <span className="font-semibold text-tertiary">Affiliate links for @{data.creatorUsername}</span>
        </div>
      )}
    </div>
  );
}
