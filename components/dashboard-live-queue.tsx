"use client";

import { useEffect, useState } from "react";
import { InternetDeal } from "@/lib/types";

type QueueResponse = {
  topDealsByMarketplace: Record<string, InternetDeal[]>;
};

export function DashboardLiveQueue() {
  const [deals, setDeals] = useState<InternetDeal[]>([]);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/deals");
      const result = (await response.json()) as QueueResponse;
      const flattened = Object.values(result.topDealsByMarketplace)
        .flat()
        .sort((left, right) => right.score - left.score)
        .slice(0, 6);
      setDeals(flattened);
    }

    load().catch(() => setDeals([]));
  }, []);

  if (deals.length === 0) {
    return (
      <div className="rounded-[1.4rem] bg-surface-low p-5 text-sm text-muted">
        Loading queue from live deal pipeline...
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {deals.map((deal, index) => (
        <article key={deal.id} className="rounded-[1.35rem] bg-surface-low p-5">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Queue #{index + 1}</p>
              <h3 className="mt-2 font-headline text-xl font-bold tracking-[-0.03em] text-text">
                {deal.title}
              </h3>
              <p className="mt-2 text-sm text-muted">
                {deal.marketplace} • {deal.category} • {deal.channelsCount} channels
              </p>
            </div>
            <div className="text-right">
              <p className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
                {deal.currentPrice ? `₹${deal.currentPrice.toLocaleString("en-IN")}` : "N/A"}
              </p>
              <p className="text-xs uppercase tracking-[0.24em] text-primary">Confidence {deal.confidenceScore ?? 0}</p>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
