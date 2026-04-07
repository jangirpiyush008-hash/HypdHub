"use client";

import { useEffect, useMemo, useState } from "react";
import { InternetDeal } from "@/lib/types";

type DealsResponse = {
  topDealsByMarketplace: Record<string, InternetDeal[]>;
};

const colors = ["bg-primary", "bg-secondary", "bg-tertiary", "bg-accent-blue", "bg-primary-deep", "bg-muted"];

export function StoreMix() {
  const [data, setData] = useState<Record<string, InternetDeal[]>>({});

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((result: DealsResponse) => setData(result.topDealsByMarketplace ?? {}))
      .catch(() => setData({}));
  }, []);

  const stores = useMemo(() => {
    const total = Object.values(data).reduce((s, d) => s + d.length, 0);
    return Object.entries(data)
      .map(([label, deals]) => ({ label, share: total > 0 ? Math.round((deals.length / total) * 100) : 0 }))
      .filter((s) => s.share > 0)
      .sort((a, b) => b.share - a.share);
  }, [data]);

  if (stores.length === 0) {
    return (
      <div className="rounded-xl bg-surface-card p-5">
        <h3 className="font-headline text-lg font-bold text-text">Store Mix</h3>
        <p className="mt-2 text-sm text-muted">No data yet.</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl bg-surface-card p-5">
      <h3 className="font-headline text-lg font-bold text-text">Store Mix</h3>

      {/* Horizontal bar */}
      <div className="mt-4 flex h-3 overflow-hidden rounded-full">
        {stores.map((s, i) => (
          <div
            key={s.label}
            className={`${colors[i % colors.length]} transition-all`}
            style={{ width: `${s.share}%` }}
          />
        ))}
      </div>

      <div className="mt-4 space-y-2">
        {stores.map((s, i) => (
          <div key={s.label} className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${colors[i % colors.length]}`} />
              <span className="text-sm text-text">{s.label}</span>
            </div>
            <span className="font-headline text-sm font-bold text-muted">{s.share}%</span>
          </div>
        ))}
      </div>
    </div>
  );
}
