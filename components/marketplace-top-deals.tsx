"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
  topDealsByMarketplace: Record<string, InternetDeal[]>;
};

export function MarketplaceTopDeals() {
  const [data, setData] = useState<DealsApiResponse | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/deals");
      const result = (await response.json()) as DealsApiResponse;
      setData(result);
    }

    load().catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Marketplace Top 10</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Loading marketplace deal boards
        </h3>
      </section>
    );
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Marketplace Top 10</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Best public deals refreshed every {data.refreshWindowHours} hours
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted">
          These sections are structured to surface the strongest public deals from across internet sources,
          then organize them into top 10 boards per marketplace for fast creator conversion.
        </p>
        <p className="mt-3 text-xs font-bold uppercase tracking-[0.24em] text-muted">
          {data.telegramDealsCount} unique Telegram-sourced deals in current cache
        </p>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.24em] text-muted">
          {data.validatedDealsCount} deals validated against marketplace public pages
        </p>
        <p className="mt-2 text-xs font-bold uppercase tracking-[0.24em] text-muted">
          {data.history.trackedDeals} tracked deals across {data.history.trackedSnapshots} stored snapshots
        </p>
      </div>

      {Object.entries(data.topDealsByMarketplace).map(([marketplace, deals]) => (
        <section key={marketplace} className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{marketplace}</p>
              <h4 className="mt-2 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
                Top 10 {marketplace} deals
              </h4>
            </div>
            <p className="text-xs uppercase tracking-[0.24em] text-muted">
              {deals.length} deals in current board
            </p>
          </div>

          <div className="mt-5 hide-scrollbar -mx-4 flex gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-3">
            {deals.map((deal) => (
              <article
                key={deal.id}
                className="min-w-[280px] rounded-[1.35rem] bg-surface-low p-5 shadow-ambient sm:min-w-0"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                      {deal.category}
                    </p>
                    <h5 className="mt-2 font-headline text-lg font-extrabold tracking-[-0.03em] text-text">
                      {deal.title}
                    </h5>
                  </div>
                  <div className="rounded-xl bg-surface-card px-3 py-2 text-right">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                      Score {deal.score}
                    </p>
                    <p className="text-xs text-muted">
                      {deal.discountPercent ? `${deal.discountPercent}% off` : "No price diff"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <div className="rounded-xl bg-surface-card px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Mentions</p>
                    <p className="mt-2 font-headline text-xl font-bold text-text">{deal.mentionsCount}</p>
                  </div>
                  <div className="rounded-xl bg-surface-card px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Channels</p>
                    <p className="mt-2 font-headline text-xl font-bold text-text">{deal.channelsCount}</p>
                  </div>
                  <div className="rounded-xl bg-surface-card px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Validation</p>
                    <p className="mt-2 text-sm font-bold text-text">
                      {deal.validationStatus === "validated" ? "Public page verified" : "Telegram-only"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-card px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Stock</p>
                    <p className="mt-2 text-sm font-bold text-text">
                      {deal.stockStatus === "in_stock"
                        ? "In stock"
                        : deal.stockStatus === "out_of_stock"
                          ? "Out of stock"
                      : "Unknown"}
                    </p>
                  </div>
                  <div className="rounded-xl bg-surface-card px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Confidence</p>
                    <p className="mt-2 text-sm font-bold text-text">{deal.confidenceScore ?? 0}</p>
                  </div>
                  <div className="rounded-xl bg-surface-card px-3 py-3">
                    <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">Price history</p>
                    <p className="mt-2 text-sm font-bold text-text">
                      {deal.priceDropSinceFirstSeen ? `${deal.priceDropSinceFirstSeen}% drop` : "Stable"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
                      {deal.currentPrice ? `₹${deal.currentPrice.toLocaleString("en-IN")}` : "Price in post"}
                    </p>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted">
                      last seen {(deal.freshnessHours ?? 0).toFixed(1)}h ago
                    </p>
                  </div>
                  <Link
                    href={deal.originalUrl || deal.canonicalUrl || "#"}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl bg-cta-gradient px-4 py-3 font-headline text-sm font-bold text-white shadow-glow"
                  >
                    Open deal
                  </Link>
                </div>
              </article>
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
