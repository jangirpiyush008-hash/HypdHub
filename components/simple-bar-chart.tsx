"use client";

import { useEffect, useMemo, useState } from "react";
import { InternetDeal } from "@/lib/types";

type DealsResponse = {
  topDealsByMarketplace: Record<string, InternetDeal[]>;
};

export function SimpleBarChart() {
  const [data, setData] = useState<Record<string, InternetDeal[]>>({});

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((result: DealsResponse) => setData(result.topDealsByMarketplace ?? {}))
      .catch(() => setData({}));
  }, []);

  const rows = useMemo(
    () =>
      Object.entries(data).map(([marketplace, deals]) => {
        const validated = deals.filter((d) => d.validationStatus === "validated").length;
        return { marketplace, live: deals.length, validated, unverified: Math.max(0, deals.length - validated) };
      }),
    [data]
  );

  const maxValue = Math.max(1, ...rows.map((r) => r.live));

  if (rows.length === 0) {
    return (
      <div>
        <h3 className="font-headline text-lg font-bold text-text">Platform Activity</h3>
        <p className="mt-2 text-sm text-muted">No data yet.</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-headline text-lg font-bold text-text">Platform Activity</h3>
        <div className="flex gap-3 text-[10px] font-bold uppercase text-muted">
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-primary" /> Live</span>
          <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-tertiary" /> Verified</span>
        </div>
      </div>
      <div className="mt-4 grid grid-cols-3 items-end gap-2 lg:grid-cols-6">
        {rows.map((r) => (
          <div key={r.marketplace} className="space-y-1">
            <div className="flex h-32 items-end justify-center gap-0.5 rounded-lg bg-surface-high px-2 py-2">
              <div className="w-2 rounded-full bg-tertiary" style={{ height: `${(r.validated / maxValue) * 100}%` }} />
              <div className="w-2 rounded-full bg-primary" style={{ height: `${(r.live / maxValue) * 100}%` }} />
            </div>
            <p className="text-center text-[9px] font-bold uppercase text-muted">{r.marketplace}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
