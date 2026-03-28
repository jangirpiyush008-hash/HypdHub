"use client";

import { useEffect, useState } from "react";
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

export function MarketplaceTopDeals({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<DealsApiResponse | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/deals");
      const result = (await response.json()) as DealsApiResponse;
      setData(result);
    }

    load().catch(() => setData(null));
  }, [refreshKey]);

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

  function getExternalHref(deal: InternetDeal) {
    const candidate = deal.originalUrl || deal.canonicalUrl;

    if (!candidate) return null;

    try {
      const url = new URL(candidate);
      return url.toString();
    } catch {
      return null;
    }
  }

  return (
    <section className="space-y-6">
      <div className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Marketplace Top 10</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Best public deals refreshed every {data.refreshWindowHours} hours
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted">
          These sections surface the strongest available deals and organize them into clean marketplace boards
          for fast creator conversion.
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
              (() => {
                const href = getExternalHref(deal);

                return (
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
                      {deal.discountPercent ? `${deal.discountPercent}% off` : "Live deal"}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-end justify-between gap-4">
                  <div>
                    <p className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
                      {deal.currentPrice ? `₹${deal.currentPrice.toLocaleString("en-IN")}` : "Price in post"}
                    </p>
                    <p className="text-xs uppercase tracking-[0.24em] text-muted">
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
                      Open deal
                    </a>
                  ) : (
                    <span className="rounded-xl bg-surface-card px-4 py-3 font-headline text-sm font-bold text-muted">
                      Link unavailable
                    </span>
                  )}
                </div>
              </article>
                );
              })()
            ))}
          </div>
        </section>
      ))}
    </section>
  );
}
