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

function DealImage({ src, alt }: { src?: string | null; alt: string }) {
  if (!src) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-gradient-to-br from-primary/20 to-secondary/20">
        <span className="text-lg font-bold text-primary/40">{alt.charAt(0)}</span>
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      loading="lazy"
      className="h-full w-full rounded-lg object-cover"
      onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
    />
  );
}

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
          <div key={i} className="h-36 animate-pulse rounded-xl bg-surface-card" />
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
        <div className="rounded-xl bg-surface-card p-5">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-headline text-lg font-bold text-text">HYPD Trending</h3>
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">Live</span>
          </div>
          <div className="mt-4 hide-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3 xl:grid-cols-4">
            {data.hypd.hotSellingProducts.slice(0, 8).map((p) => (
              <a
                key={p.id}
                href={p.productUrl ?? "#"}
                target={p.productUrl ? "_blank" : undefined}
                rel={p.productUrl ? "noreferrer" : undefined}
                className="min-w-[180px] card-hover rounded-lg bg-surface-high p-3 sm:min-w-0"
              >
                <div className="h-24 w-full overflow-hidden rounded-lg">
                  <DealImage src={p.imageUrl} alt={p.title} />
                </div>
                <p className="mt-2 text-sm font-semibold text-text line-clamp-1">{p.title}</p>
                <p className="mt-0.5 text-xs text-muted">{p.brandName} · {p.orderCount} orders</p>
              </a>
            ))}
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
          <div className="mt-4 hide-scrollbar -mx-3 flex gap-3 overflow-x-auto px-3 pb-1 sm:mx-0 sm:grid sm:grid-cols-2 sm:px-0 lg:grid-cols-3 xl:grid-cols-4">
            {deals.map((deal) => {
              const href = getExternalHref(deal);
              return (
                <div key={deal.id} className="min-w-[180px] card-hover rounded-lg bg-surface-high p-3 sm:min-w-0">
                  {/* Product image */}
                  <div className="h-28 w-full overflow-hidden rounded-lg">
                    <DealImage src={deal.imageUrl} alt={deal.title} />
                  </div>

                  {/* Title — short */}
                  <h4 className="mt-2 text-sm font-bold text-text line-clamp-1">{deal.title}</h4>

                  {/* Price + discount */}
                  <div className="mt-1 flex items-center gap-2">
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

                  {/* Link */}
                  {href ? (
                    <a href={href} target="_blank" rel="noreferrer" className="mt-2 block rounded-lg bg-primary/10 py-1.5 text-center text-xs font-bold text-primary">
                      View Deal
                    </a>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
