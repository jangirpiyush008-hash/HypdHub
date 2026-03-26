"use client";

import { useMemo, useState } from "react";
import { categories, deals, marketplaces } from "@/data/mock";
import { DealCard } from "@/components/deal-card";
import { FilterChipRow } from "@/components/filter-chip-row";
import { TrendingUpIcon } from "@/components/icons";

export function DealsBrowser() {
  const [activeMarketplace, setActiveMarketplace] = useState("All");
  const [activeCategory, setActiveCategory] = useState("All");
  const [minPrice, setMinPrice] = useState("0");
  const [maxPrice, setMaxPrice] = useState("50000");

  const filteredDeals = useMemo(() => {
    return deals.filter((deal) => {
      const marketplaceMatch = activeMarketplace === "All" || deal.source === activeMarketplace;
      const categoryMatch = activeCategory === "All" || deal.category === activeCategory;
      const priceMatch =
        deal.price >= Number(minPrice || 0) && deal.price <= Number(maxPrice || 999999);
      return marketplaceMatch && categoryMatch && priceMatch;
    });
  }, [activeCategory, activeMarketplace, maxPrice, minPrice]);

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
        <div className="hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3">
          {filteredDeals.slice(0, 5).map((deal) => (
            <div key={deal.id} className="min-w-[280px] sm:min-w-0">
              <DealCard deal={deal} compact />
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-4">
        <h3 className="font-headline text-lg font-bold tracking-[-0.03em] text-text">
          Recent Opportunities
        </h3>
        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {filteredDeals.map((deal) => (
            <DealCard key={deal.id} deal={deal} />
          ))}
        </div>
      </section>
    </div>
  );
}
