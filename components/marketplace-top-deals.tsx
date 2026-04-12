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

function DealImage({ src, alt, marketplace }: { src?: string | null; alt: string; marketplace?: string }) {
  const [failed, setFailed] = useState(false);

  const placeholder = (
    <div className="flex h-full w-full flex-col items-center justify-center gap-1 rounded-lg bg-gradient-to-br from-surface-high to-surface-bright">
      <span className="text-2xl font-bold text-primary/50">{(marketplace ?? alt).charAt(0)}</span>
      <span className="text-[10px] text-muted">{marketplace ?? "Deal"}</span>
    </div>
  );

  if (!src || failed) return placeholder;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-full w-full rounded-lg object-contain bg-white"
      onError={() => setFailed(true)}
    />
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

  // Collect all deals into a flat list
  const allDeals = useMemo(() => {
    if (!data) return [];
    const deals: InternetDeal[] = [];
    for (const [, marketDeals] of Object.entries(data.topDealsByMarketplace)) {
      deals.push(...marketDeals);
    }
    return deals;
  }, [data]);

  // Count deals per marketplace
  const marketplaceCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const deal of allDeals) {
      counts[deal.marketplace] = (counts[deal.marketplace] || 0) + 1;
    }
    return counts;
  }, [allDeals]);

  // Filter deals
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
                className={`flex-shrink-0 rounded-lg px-3 py-2 text-xs font-bold transition-all ${
                  isActive
                    ? "bg-primary text-white shadow-sm"
                    : "bg-surface-high text-muted hover:bg-surface-bright hover:text-text"
                }`}
              >
                {m}
                {count > 0 && (
                  <span className={`ml-1.5 rounded-full px-1.5 py-0.5 text-[10px] ${
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
            return (
              <div key={deal.id} className="card-hover rounded-xl bg-surface-card p-3 flex flex-col">
                {/* Product image */}
                <div className="h-32 w-full overflow-hidden rounded-lg">
                  <DealImage src={deal.imageUrl} alt={deal.title} marketplace={deal.marketplace} />
                </div>

                {/* Marketplace badge */}
                <div className="mt-2 flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-1.5 py-0.5 text-[10px] font-bold text-primary">
                    {deal.marketplace}
                  </span>
                  {deal.category && deal.category !== "General" && (
                    <span className="text-[10px] text-muted">{deal.category}</span>
                  )}
                </div>

                {/* Title */}
                <h4 className="mt-1.5 text-sm font-bold text-text line-clamp-2 flex-1">{deal.title}</h4>

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
                    className="mt-3 block rounded-lg bg-primary/10 py-2 text-center text-xs font-bold text-primary transition-colors hover:bg-primary/20"
                  >
                    View Deal →
                  </a>
                ) : null}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
