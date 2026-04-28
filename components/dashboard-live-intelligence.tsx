"use client";

import { useEffect, useState } from "react";

type DashboardDealsResponse = {
  totalDealsCount: number;
  history: { trackedDeals: number; trackedSnapshots: number };
  refresh: { lastRefreshAt: string | null; nextRefreshAt: string | null; lastStatus: string };
};

function fmt(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function DashboardLiveIntelligence() {
  const [data, setData] = useState<DashboardDealsResponse | null>(null);

  useEffect(() => {
    fetch("/api/deals")
      .then((r) => r.json())
      .then((result: DashboardDealsResponse) => setData(result))
      .catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <div className="rounded-xl bg-surface-card p-5">
        <p className="text-sm text-muted">Loading pipeline metrics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl bg-surface-card p-4">
          <p className="text-xs text-muted">Live Deals</p>
          <p className="mt-1 font-headline text-2xl font-bold text-text">{data.totalDealsCount}</p>
        </div>
        <div className="rounded-xl bg-surface-card p-4">
          <p className="text-xs text-muted">Tracked</p>
          <p className="mt-1 font-headline text-2xl font-bold text-text">{data.history.trackedDeals}</p>
        </div>
        <div className="rounded-xl bg-surface-card p-4">
          <p className="text-xs text-muted">Snapshots</p>
          <p className="mt-1 font-headline text-2xl font-bold text-text">{data.history.trackedSnapshots}</p>
        </div>
        <div className="rounded-xl bg-surface-card p-4">
          <p className="text-xs text-muted">Refresh</p>
          <p className="mt-1 font-headline text-2xl font-bold text-text">2h</p>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <div className="rounded-lg bg-surface-high px-4 py-3">
          <p className="text-[10px] font-bold uppercase text-muted">Last Refresh</p>
          <p className="mt-1 text-sm font-semibold text-text">{fmt(data.refresh.lastRefreshAt)}</p>
        </div>
        <div className="rounded-lg bg-surface-high px-4 py-3">
          <p className="text-[10px] font-bold uppercase text-muted">Next Refresh</p>
          <p className="mt-1 text-sm font-semibold text-text">{fmt(data.refresh.nextRefreshAt)}</p>
        </div>
        <div className="rounded-lg bg-surface-high px-4 py-3">
          <p className="text-[10px] font-bold uppercase text-muted">Status</p>
          <p className="mt-1 text-sm font-semibold text-text">{data.refresh.lastStatus}</p>
        </div>
      </div>
    </div>
  );
}
