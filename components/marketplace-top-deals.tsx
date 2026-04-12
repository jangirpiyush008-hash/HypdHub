"use client";

import { useEffect, useMemo, useState } from "react";
import { InternetDeal } from "@/lib/types";

type DealsApiResponse = {
  generatedAt: string;
  refreshWindowHours: number;
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

// Marketplace branding — uses /public/logos/ files if uploaded, falls back to inline SVG
const MARKETPLACE_BRANDING: Record<string, { color: string; bg: string; logoFile: string; fallbackLetter: string }> = {
  Myntra: { color: "#ff3f6c", bg: "#fff0f3", logoFile: "/logos/myntra.png", fallbackLetter: "M" },
  Amazon: { color: "#ff9900", bg: "#fff8ee", logoFile: "/logos/amazon.png", fallbackLetter: "a" },
  Flipkart: { color: "#2874f0", bg: "#eef4ff", logoFile: "/logos/flipkart.png", fallbackLetter: "F" },
  Ajio: { color: "#3b3b3b", bg: "#f5f5f5", logoFile: "/logos/ajio.png", fallbackLetter: "A" },
  Nykaa: { color: "#fc2779", bg: "#fff0f6", logoFile: "/logos/nykaa.png", fallbackLetter: "N" },
  Shopsy: { color: "#7b2ff7", bg: "#f3eeff", logoFile: "/logos/shopsy.png", fallbackLetter: "S" },
  HYPD: { color: "#fb6c23", bg: "#fff4ee", logoFile: "/logos/hypd.png", fallbackLetter: "H" },
};

/** Marketplace logo component — tries real logo file, falls back to styled letter */
function MarketplaceLogo({ marketplace, size = 20 }: { marketplace: string; size?: number }) {
  const [useFallback, setUseFallback] = useState(false);
  const branding = MARKETPLACE_BRANDING[marketplace] ?? MARKETPLACE_BRANDING.HYPD;

  if (useFallback) {
    return (
      <span
        className="inline-flex items-center justify-center rounded font-bold text-white"
        style={{
          width: size,
          height: size,
          fontSize: size * 0.55,
          backgroundColor: branding.color,
        }}
      >
        {branding.fallbackLetter}
      </span>
    );
  }

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={branding.logoFile}
      alt={marketplace}
      width={size}
      height={size}
      className="rounded object-contain"
      style={{ width: size, height: size }}
      onError={() => setUseFallback(true)}
    />
  );
}

/** Decode HTML entities in deal titles */
function decodeEntities(text: string): string {
  return text
    .replace(/&#x27;/g, "'")
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(parseInt(n)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, n) => String.fromCharCode(parseInt(n, 16)));
}

function DealImage({ src, alt, marketplace }: { src?: string | null; alt: string; marketplace: string }) {
  const [failed, setFailed] = useState(false);
  const branding = MARKETPLACE_BRANDING[marketplace] ?? MARKETPLACE_BRANDING.HYPD;

  // Fallback: marketplace logo with product name
  if (!src || failed) {
    return (
      <div
        className="flex h-full w-full flex-col items-center justify-center gap-2 rounded-t-lg p-4"
        style={{ backgroundColor: branding.bg }}
      >
        <MarketplaceLogo marketplace={marketplace} size={36} />
        <span
          className="line-clamp-2 text-center text-xs font-semibold leading-tight"
          style={{ color: branding.color }}
        >
          {decodeEntities(alt)}
        </span>
      </div>
    );
  }

  return (
    <div className="relative h-full w-full rounded-t-lg bg-white">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt={decodeEntities(alt)}
        loading="lazy"
        className="h-full w-full rounded-t-lg object-cover"
        onError={() => setFailed(true)}
      />
      {/* Small marketplace logo badge overlay */}
      <div className="absolute bottom-2 right-2">
        <MarketplaceLogo marketplace={marketplace} size={20} />
      </div>
    </div>
  );
}

export function MarketplaceTopDeals({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<DealsApiResponse | null>(null);
  const [selectedMarketplace, setSelectedMarketplace] = useState<string>("All");
  const [selectedPriceRange, setSelectedPriceRange] = useState(0);

  useEffect(() => {
    fetch("/api/deals")
      .then((res) => res.json())
      .then((result: DealsApiResponse) => setData(result))
      .catch(() => setData(null));
  }, [refreshKey]);

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

  function getExternalHref(deal: InternetDeal) {
    const candidate = deal.originalUrl || deal.canonicalUrl;
    if (!candidate) return null;
    try { return new URL(candidate).toString(); } catch { return null; }
  }

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
        {/* Marketplace tabs */}
        <div className="hide-scrollbar -mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
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

      {/* ── Results count ── */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs text-muted">
          {filteredDeals.length} deal{filteredDeals.length !== 1 ? "s" : ""} found
          {selectedMarketplace !== "All" ? ` on ${selectedMarketplace}` : ""}
        </p>
        {selectedMarketplace !== "All" || selectedPriceRange !== 0 ? (
          <button
            onClick={() => { setSelectedMarketplace("All"); setSelectedPriceRange(0); }}
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear filters
          </button>
        ) : null}
      </div>

      {/* ── Deal Cards Grid ── */}
      {filteredDeals.length === 0 ? (
        <div className="rounded-xl bg-surface-card p-8 text-center">
          <p className="text-sm text-muted">No deals match your filters. Try a different marketplace or price range.</p>
        </div>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredDeals.map((deal) => {
            const href = getExternalHref(deal);
            const branding = MARKETPLACE_BRANDING[deal.marketplace] ?? MARKETPLACE_BRANDING.HYPD;
            const cleanTitle = decodeEntities(deal.title);
            return (
              <div key={deal.id} className="card-hover overflow-hidden rounded-xl bg-surface-card flex flex-col">
                {/* Product image — fixed aspect ratio */}
                <div className="aspect-[4/3] w-full overflow-hidden">
                  <DealImage src={deal.imageUrl} alt={deal.title} marketplace={deal.marketplace} />
                </div>

                {/* Content */}
                <div className="flex flex-1 flex-col p-3">
                  {/* Marketplace badge */}
                  <div className="flex items-center gap-2">
                    <span
                      className="flex items-center gap-1 rounded px-1.5 py-0.5 text-[10px] font-bold"
                      style={{ backgroundColor: branding.bg, color: branding.color }}
                    >
                      <MarketplaceLogo marketplace={deal.marketplace} size={12} />
                      {deal.marketplace}
                    </span>
                    {deal.category && deal.category !== "General" && (
                      <span className="text-[10px] text-muted">{deal.category}</span>
                    )}
                  </div>

                  {/* Title */}
                  <h4 className="mt-1.5 text-sm font-bold text-text line-clamp-2 flex-1">{cleanTitle}</h4>

                  {/* Price + discount */}
                  <div className="mt-2 flex items-center gap-2">
                    {deal.currentPrice ? (
                      <p className="font-headline text-base font-bold text-text">
                        ₹{deal.currentPrice.toLocaleString("en-IN")}
                      </p>
                    ) : null}
                    {deal.originalPrice ? (
                      <p className="text-xs text-muted line-through">₹{deal.originalPrice.toLocaleString("en-IN")}</p>
                    ) : null}
                    {deal.discountPercent ? (
                      <span className="rounded bg-tertiary/15 px-1.5 py-0.5 text-[10px] font-bold text-tertiary">
                        {deal.discountPercent}% off
                      </span>
                    ) : null}
                  </div>

                  {/* View Deal button */}
                  {href ? (
                    <a
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 flex items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-bold transition-opacity hover:opacity-80"
                      style={{ backgroundColor: branding.bg, color: branding.color }}
                    >
                      <MarketplaceLogo marketplace={deal.marketplace} size={16} />
                      View on {deal.marketplace} →
                    </a>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
