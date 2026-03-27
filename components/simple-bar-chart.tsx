"use client";

import { useEffect, useMemo, useState } from "react";
import { InternetDeal } from "@/lib/types";

type DealsResponse = {
  topDealsByMarketplace: Record<string, InternetDeal[]>;
};

export function SimpleBarChart() {
  const [data, setData] = useState<Record<string, InternetDeal[]>>({});

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/deals");
      const result = (await response.json()) as DealsResponse;
      setData(result.topDealsByMarketplace ?? {});
    }

    load().catch(() => setData({}));
  }, []);

  const rows = useMemo(
    () =>
      Object.entries(data).map(([marketplace, deals]) => {
        const validated = deals.filter((deal) => deal.validationStatus === "validated").length;
        return {
          marketplace,
          live: deals.length,
          validated,
          unverified: Math.max(0, deals.length - validated)
        };
      }),
    [data]
  );

  const maxValue = Math.max(1, ...rows.map((item) => item.live));

  if (rows.length === 0) {
    return (
      <div className="rounded-[1.5rem] bg-surface-low p-6">
        <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
          Platform activity
        </h3>
        <p className="mt-3 text-sm text-muted">
          Live activity bars will appear here once the deal pipeline has enough refreshed marketplace data.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
          Platform activity
        </h3>
        <div className="flex gap-3 text-xs font-bold uppercase tracking-[0.24em] text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Live deals
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            Validated
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            Unverified
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 items-end gap-3 md:grid-cols-3 xl:grid-cols-6">
        {rows.map((item) => (
          <div key={item.marketplace} className="space-y-2">
            <div className="flex h-48 items-end justify-center gap-1 rounded-[1.25rem] bg-surface-low px-2 py-3">
              <div
                className="w-2 rounded-full bg-emerald-400/80"
                style={{ height: `${(item.validated / maxValue) * 100}%` }}
              />
              <div
                className="w-2 rounded-full bg-sky-400/80"
                style={{ height: `${(item.unverified / maxValue) * 100}%` }}
              />
              <div
                className="w-2 rounded-full bg-cta-gradient"
                style={{ height: `${(item.live / maxValue) * 100}%` }}
              />
            </div>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              {item.marketplace}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
