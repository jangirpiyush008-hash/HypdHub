"use client";

import { useEffect, useState } from "react";
import { InternetDeal } from "@/lib/types";

type DealsApiResponse = {
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
  };
};

export function HomeDealsPreview() {
  const [data, setData] = useState<DealsApiResponse | null>(null);

  useEffect(() => {
    fetch("/api/deals")
      .then((res) => res.json())
      .then((result: DealsApiResponse) => setData(result))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-surface-card" />
        ))}
      </div>
    );
  }

  const hypdDeals = (data.hypd?.status === "live" ? data.hypd.hotSellingProducts : []).slice(0, 3);
  const marketplaceDeals = Object.values(data.topDealsByMarketplace)
    .flat()
    .sort((a, b) => (b.score ?? 0) - (a.score ?? 0))
    .slice(0, 6 - hypdDeals.length);

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {hypdDeals.map((product) => (
        <a
          key={product.id}
          href={product.productUrl ?? "#"}
          target={product.productUrl ? "_blank" : undefined}
          rel={product.productUrl ? "noreferrer" : undefined}
          className="card-hover rounded-xl bg-surface-card p-4"
        >
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">HYPD</span>
            <span className="text-[10px] font-medium text-muted">{product.orderCount} orders</span>
          </div>
          <h3 className="mt-2 font-headline text-sm font-bold text-text line-clamp-2">{product.title}</h3>
          <p className="mt-1 text-xs text-muted">{product.brandName}</p>
        </a>
      ))}

      {marketplaceDeals.map((deal) => {
        const href = deal.originalUrl || deal.canonicalUrl;
        let safeHref: string | null = null;
        if (href) {
          try { safeHref = new URL(href).toString(); } catch { /* skip */ }
        }

        return (
          <div key={deal.id} className="card-hover rounded-xl bg-surface-card p-4">
            <div className="flex items-center justify-between gap-2">
              <span className="rounded bg-secondary/15 px-2 py-0.5 text-[10px] font-bold uppercase text-secondary">
                {deal.marketplace}
              </span>
              {deal.discountPercent ? (
                <span className="text-xs font-bold text-tertiary">{deal.discountPercent}% off</span>
              ) : null}
            </div>
            <h3 className="mt-2 font-headline text-sm font-bold text-text line-clamp-2">{deal.title}</h3>
            <div className="mt-2 flex items-end justify-between gap-2">
              <div>
                {deal.currentPrice ? (
                  <p className="font-headline text-lg font-bold text-text">
                    ₹{deal.currentPrice.toLocaleString("en-IN")}
                  </p>
                ) : null}
                {deal.originalPrice ? (
                  <p className="text-xs text-muted line-through">
                    ₹{deal.originalPrice.toLocaleString("en-IN")}
                  </p>
                ) : null}
              </div>
              {safeHref ? (
                <a
                  href={safeHref}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg bg-primary/10 px-3 py-1.5 text-xs font-bold text-primary"
                >
                  View
                </a>
              ) : null}
            </div>
          </div>
        );
      })}
    </div>
  );
}
