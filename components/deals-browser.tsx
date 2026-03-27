"use client";

import { useEffect, useMemo, useState } from "react";
import { FilterChipRow } from "@/components/filter-chip-row";
import { TrendingUpIcon } from "@/components/icons";
import { InternetDeal } from "@/lib/types";

type DealsResponse = {
  deals: InternetDeal[];
};

function formatPrice(value: number | null) {
  return value ? `₹${value.toLocaleString("en-IN")}` : "Price unavailable";
}

function getExternalHref(url: string) {
  try {
    return new URL(url).toString();
  } catch {
    return null;
  }
}

export function DealsBrowser() {
  const [deals, setDeals] = useState<InternetDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeMarketplace, setActiveMarketplace] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("50000");

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/deals");
      const result = (await response.json()) as DealsResponse;
      setDeals(result.deals ?? []);
      setLoading(false);
    }

    load().catch(() => {
      setDeals([]);
      setLoading(false);
    });
  }, []);

  const marketplaces = useMemo(
    () => ["All", ...Array.from(new Set(deals.map((deal) => deal.marketplace)))],
    [deals]
  );

  const categories = useMemo(
    () => ["All", ...Array.from(new Set(deals.map((deal) => deal.category).filter(Boolean)))],
    [deals]
  );

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const marketplaceMatch = activeMarketplace === "All" || deal.marketplace === activeMarketplace;
      const categoryMatch = activeCategory === "All" || deal.category === activeCategory;
      const currentPrice = deal.currentPrice ?? 0;
      const priceMatch =
        currentPrice >= Number(minPrice || 0) && currentPrice <= Number(maxPrice || 999999);
      return marketplaceMatch && categoryMatch && priceMatch;
    });
  }, [activeCategory, activeMarketplace, deals, maxPrice, minPrice]);

  if (loading) {
    return (
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-sm text-muted">Loading live deal feed...</p>
      </section>
    );
  }

  if (deals.length === 0) {
    return (
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Live Feed</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          No live deals available yet
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          As soon as Telegram ingestion or marketplace validation returns live products, they will appear here
          automatically. No placeholder deals are shown.
        </p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <div className="space-y-4">
        <FilterChipRow
          items={marketplaces}
          active={activeMarketplace}
          onChange={setActiveMarketplace}
        />
        <FilterChipRow items={categories} active={activeCategory} onChange={setActiveCategory} />
        <div className="grid gap-3 rounded-[1.5rem] bg-surface-card p-4 shadow-ambient sm:grid-cols-2">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Min price</span>
            <input
              value={minPrice}
              onChange={(event) => setMinPrice(event.target.value)}
              className="w-full rounded-xl bg-surface-top px-4 py-3 text-sm text-text outline-none"
            />
          </label>
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Max price</span>
            <input
              value={maxPrice}
              onChange={(event) => setMaxPrice(event.target.value)}
              className="w-full rounded-xl bg-surface-top px-4 py-3 text-sm text-text outline-none"
            />
          </label>
        </div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center gap-2">
          <TrendingUpIcon className="h-5 w-5 text-primary" />
          <h3 className="font-headline text-lg font-bold tracking-[-0.03em] text-text">
            Top 10 Hot Deals
          </h3>
        </div>
        {filteredDeals.length === 0 ? (
          <div className="rounded-[1.35rem] bg-surface-card p-5 text-sm text-muted shadow-ambient">
            No live deals match the current filters.
          </div>
        ) : null}
        <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
          {filteredDeals.slice(0, 10).map((deal) => (
            (() => {
              const href = getExternalHref(deal.originalUrl);

              return (
                <article key={deal.id} className="min-w-[280px] rounded-[1.35rem] bg-surface-card p-5 shadow-ambient sm:min-w-0">
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{deal.marketplace}</p>
                  <h4 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{deal.title}</h4>
                  <p className="mt-2 text-sm text-muted">{deal.category}</p>
                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <p className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
                        {formatPrice(deal.currentPrice)}
                      </p>
                      <p className="text-xs uppercase tracking-[0.22em] text-muted">
                        {deal.discountPercent ? `${deal.discountPercent}% off` : "Live tracked deal"}
                      </p>
                    </div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-surface-top px-4 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
                      >
                        Open
                      </a>
                    ) : (
                      <span className="rounded-xl bg-surface-top px-4 py-3 font-headline text-sm font-bold text-muted">
                        No link
                      </span>
                    )}
                  </div>
                </article>
              );
            })()
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-headline text-lg font-bold tracking-[-0.03em] text-text">
          Recent Opportunities
        </h3>
        {filteredDeals.length === 0 ? (
          <div className="rounded-[1.35rem] bg-surface-card p-5 text-sm text-muted shadow-ambient">
            Broaden the filters to see live opportunities.
          </div>
        ) : null}
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredDeals.map((deal) => (
            (() => {
              const href = getExternalHref(deal.originalUrl);

              return (
                <article key={deal.id} className="rounded-[1.35rem] bg-surface-card p-5 shadow-ambient">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="rounded-full bg-primary/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                          {deal.marketplace}
                        </span>
                      </div>
                      <h4 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{deal.title}</h4>
                      <p className="mt-2 text-sm text-muted">{deal.category}</p>
                    </div>
                    <div className="rounded-2xl bg-surface-top px-3 py-2 text-right">
                      <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                        {deal.discountPercent ? `${deal.discountPercent}% off` : "Tracked"}
                      </div>
                      <div className="text-sm text-muted">
                        {deal.originalPrice ? `₹${deal.originalPrice.toLocaleString("en-IN")}` : "No MRP"}
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 flex items-end justify-between gap-4">
                    <div>
                      <div className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
                        {formatPrice(deal.currentPrice)}
                      </div>
                      <p className="text-xs uppercase tracking-[0.22em] text-muted">
                        {deal.originalPrice ? `MRP ₹${deal.originalPrice.toLocaleString("en-IN")}` : "Fresh live deal"}
                      </p>
                    </div>
                    {href ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="rounded-xl bg-cta-gradient px-4 py-3 font-headline text-sm font-bold text-white shadow-glow"
                      >
                        Open source
                      </a>
                    ) : (
                      <span className="rounded-xl bg-cta-gradient/30 px-4 py-3 font-headline text-sm font-bold text-white/70">
                        No link
                      </span>
                    )}
                  </div>
                </article>
              );
            })()
          ))}
        </div>
      </section>
    </div>
  );
}
