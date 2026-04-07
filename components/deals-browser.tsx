"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterChipRow } from "@/components/filter-chip-row";
import { InternetDeal } from "@/lib/types";

type DealsResponse = {
  deals: InternetDeal[];
};

function formatPrice(value: number | null) {
  return value ? `₹${value.toLocaleString("en-IN")}` : "—";
}

function getExternalHref(url: string) {
  try { return new URL(url).toString(); } catch { return null; }
}

export function DealsBrowser({ refreshKey = 0 }: { refreshKey?: number }) {
  const [deals, setDeals] = useState<InternetDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMarketplace, setActiveMarketplace] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("50000");

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((result: DealsResponse) => { setDeals(result.deals ?? []); setLoading(false); })
      .catch(() => { setDeals([]); setLoading(false); });
  }, [refreshKey]);

  const marketplaces = useMemo(
    () => ["All", ...Array.from(new Set(deals.map((d) => d.marketplace)))],
    [deals]
  );
  const categories = useMemo(
    () => ["All", ...Array.from(new Set(deals.map((d) => d.category).filter(Boolean)))],
    [deals]
  );
  const filtered = useMemo(() => deals.filter((d) => {
    const mm = activeMarketplace === "All" || d.marketplace === activeMarketplace;
    const cm = activeCategory === "All" || d.category === activeCategory;
    const p = d.currentPrice ?? 0;
    return mm && cm && p >= Number(minPrice || 0) && p <= Number(maxPrice || 999999);
  }), [activeCategory, activeMarketplace, deals, maxPrice, minPrice]);

  if (loading) return <div className="rounded-xl bg-surface-card p-5 text-sm text-muted">Loading deals...</div>;
  if (deals.length === 0) return (
    <div className="rounded-xl bg-surface-card p-5">
      <p className="text-sm text-muted">No deals available yet. Hit refresh to scrape latest deals.</p>
    </div>
  );

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="space-y-3">
        <FilterChipRow items={marketplaces} active={activeMarketplace} onChange={setActiveMarketplace} />
        <FilterChipRow items={categories} active={activeCategory} onChange={setActiveCategory} />
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted">Min price</span>
            <input value={minPrice} onChange={(e) => setMinPrice(e.target.value)}
              className="w-full rounded-lg bg-surface-high px-3 py-2 text-sm text-text outline-none" />
          </label>
          <label className="block space-y-1">
            <span className="text-xs font-semibold text-muted">Max price</span>
            <input value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full rounded-lg bg-surface-high px-3 py-2 text-sm text-text outline-none" />
          </label>
        </div>
      </div>

      <p className="text-xs text-muted">{filtered.length} deals</p>

      {/* Deal cards */}
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {filtered.slice(0, 30).map((deal) => {
          const href = deal.originalUrl ? getExternalHref(deal.originalUrl) : null;
          return (
            <div key={deal.id} className="card-hover rounded-xl bg-surface-card p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
                  {deal.marketplace}
                </span>
                {deal.discountPercent ? (
                  <span className="text-xs font-bold text-tertiary">{deal.discountPercent}% off</span>
                ) : null}
              </div>
              <h4 className="mt-2 text-sm font-bold text-text line-clamp-2">{deal.title}</h4>
              <p className="mt-1 text-xs text-muted">{deal.category}</p>
              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <p className="font-headline text-lg font-bold text-text">{formatPrice(deal.currentPrice)}</p>
                  {deal.originalPrice ? (
                    <p className="text-xs text-muted line-through">₹{deal.originalPrice.toLocaleString("en-IN")}</p>
                  ) : null}
                </div>
                {href ? (
                  <a href={href} target="_blank" rel="noreferrer"
                    className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                    View
                  </a>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
