"use client";

import { useEffect, useState } from "react";
import { InternetDeal } from "@/lib/types";

type QueueResponse = {
  topDealsByMarketplace: Record<string, InternetDeal[]>;
};

export function DashboardLiveQueue() {
  const [deals, setDeals] = useState<InternetDeal[]>([]);

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((result: QueueResponse) => {
        setDeals(
          Object.values(result.topDealsByMarketplace)
            .flat()
            .sort((a, b) => b.score - a.score)
            .slice(0, 6)
        );
      })
      .catch(() => setDeals([]));
  }, []);

  if (deals.length === 0) {
    return <div className="rounded-xl bg-surface-card p-5 text-sm text-muted">No live queue items yet.</div>;
  }

  return (
    <div className="rounded-xl bg-surface-card p-5">
      <h3 className="font-headline text-lg font-bold text-text">Live Queue</h3>
      <div className="mt-4 grid gap-2 sm:grid-cols-2">
        {deals.map((deal, i) => (
          <div key={deal.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-high px-4 py-3">
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-text line-clamp-1">{deal.title}</p>
              <p className="text-xs text-muted">{deal.marketplace} · {deal.category}</p>
            </div>
            <div className="text-right shrink-0">
              <p className="font-headline text-sm font-bold text-text">
                {deal.currentPrice ? `₹${deal.currentPrice.toLocaleString("en-IN")}` : "—"}
              </p>
              <p className="text-[10px] text-primary">#{i + 1}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
