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

export function MarketplaceTopDeals({ refreshKey = 0 }: { refreshKey?: number }) {
  const [data, setData] = useState<DealsApiResponse | null>(null);

  useEffect(() => {
    fetch("/api/deals")
      .then((res) => res.json())
      .then((result: DealsApiResponse) => setData(result))
      .catch(() => setData(null));
  }, [refreshKey]);

  if (!data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-surface-card" />
        ))}
      </div>
    );
  }

  function getExternalHref(deal: InternetDeal) {
    const candidate = deal.originalUrl || deal.canonicalUrl;
    if (!candidate) return null;
    try { return new URL(candidate).toString(); } catch { return null; }
  }

  return (
    <div className="space-y-6">
      {/* HYPD trending */}
      {data.hypd.status === "live" ? (
        <div className="grid gap-4 lg:grid-cols-[1.3fr_0.7fr]">
          <div className="rounded-xl bg-surface-card p-5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="font-headline text-lg font-bold text-text">HYPD Trending</h3>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Live</span>
            </div>
            <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
              {data.hypd.hotSellingProducts.slice(0, 6).map((p) => (
                <a
                  key={p.id}
                  href={p.productUrl ?? "#"}
                  target={p.productUrl ? "_blank" : undefined}
                  rel={p.productUrl ? "noreferrer" : undefined}
                  className="card-hover rounded-lg bg-surface-high p-3"
                >
                  <p className="text-xs font-bold text-primary">{p.orderCount} orders</p>
                  <p className="mt-1 text-sm font-semibold text-text line-clamp-2">{p.title}</p>
                  <p className="mt-0.5 text-xs text-muted">{p.brandName}</p>
                </a>
              ))}
            </div>
          </div>

          <div className="rounded-xl bg-surface-card p-5">
            <h3 className="font-headline text-lg font-bold text-text">Commission Rates</h3>
            <div className="mt-4 flex flex-wrap gap-1.5">
              {data.hypd.marketplaceCommissions.slice(0, 10).map((c) => (
                <span key={`${c.label}-${c.commission}`} className="rounded bg-surface-high px-2.5 py-1 text-xs text-text">
                  {c.label}: {c.commission}
                </span>
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <div className="rounded-lg bg-surface-high p-3">
                <p className="text-[10px] font-bold uppercase text-muted">Sales</p>
                <p className="mt-1 font-headline text-lg font-bold text-text">{data.hypd.stats.sales ?? "—"}</p>
              </div>
              <div className="rounded-lg bg-surface-high p-3">
                <p className="text-[10px] font-bold uppercase text-muted">Orders</p>
                <p className="mt-1 font-headline text-lg font-bold text-text">{data.hypd.stats.orders ?? "—"}</p>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* Marketplace boards */}
      {Object.entries(data.topDealsByMarketplace)
        .filter(([, deals]) => deals.length > 0)
        .map(([marketplace, deals]) => (
        <div key={marketplace} className="rounded-xl bg-surface-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-headline text-lg font-bold text-text">{marketplace}</h3>
            <span className="text-xs text-muted">{deals.length} deals</span>
          </div>
          <div className="mt-4 hide-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 xl:grid-cols-3">
            {deals.map((deal) => {
              const href = getExternalHref(deal);
              return (
                <div key={deal.id} className="min-w-[260px] card-hover rounded-lg bg-surface-high p-4 sm:min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="text-xs text-muted">{deal.category}</p>
                      <h4 className="mt-1 text-sm font-bold text-text line-clamp-2">{deal.title}</h4>
                    </div>
                    {deal.discountPercent ? (
                      <span className="shrink-0 rounded bg-tertiary/15 px-2 py-0.5 text-xs font-bold text-tertiary">
                        {deal.discountPercent}%
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-3 flex items-end justify-between gap-2">
                    <div>
                      {deal.currentPrice ? (
                        <p className="font-headline text-lg font-bold text-text">
                          ₹{deal.currentPrice.toLocaleString("en-IN")}
                        </p>
                      ) : deal.mentionsCount > 1 ? (
                        <p className="text-xs font-bold text-primary">{deal.mentionsCount} orders</p>
                      ) : null}
                      {deal.originalPrice ? (
                        <p className="text-xs text-muted line-through">₹{deal.originalPrice.toLocaleString("en-IN")}</p>
                      ) : null}
                    </div>
                    {href ? (
                      <a href={href} target="_blank" rel="noreferrer" className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary">
                        View
                      </a>
                    ) : null}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
