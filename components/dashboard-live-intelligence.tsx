"use client";

import { useEffect, useState } from "react";

type DashboardDealsResponse = {
  telegramDealsCount: number;
  validatedDealsCount: number;
  history: {
    trackedDeals: number;
    trackedSnapshots: number;
  };
  refresh: {
    lastRefreshAt: string | null;
    nextRefreshAt: string | null;
    lastStatus: string;
  };
};

const accents = [
  "from-primary/30 to-primary-deep/30",
  "from-emerald-400/20 to-emerald-500/10",
  "from-sky-400/20 to-sky-500/10",
  "from-amber-300/20 to-amber-500/10"
];

function formatTimestamp(value: string | null) {
  if (!value) return "Pending";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

export function DashboardLiveIntelligence() {
  const [data, setData] = useState<DashboardDealsResponse | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/deals");
      const result = (await response.json()) as DashboardDealsResponse;
      setData(result);
    }

    load().catch(() => setData(null));
  }, []);

  if (!data) {
    return (
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Live Intelligence</p>
        <p className="mt-3 text-sm text-muted">Loading live deal metrics...</p>
      </section>
    );
  }

  const stats = [
    { label: "Unique Telegram deals", value: String(data.telegramDealsCount) },
    { label: "Validated public pages", value: String(data.validatedDealsCount) },
    { label: "Tracked deals in history", value: String(data.history.trackedDeals) },
    { label: "Stored snapshots", value: String(data.history.trackedSnapshots) }
  ];

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat, index) => (
          <article
            key={stat.label}
            className={`rounded-[1.5rem] bg-gradient-to-br ${accents[index]} p-[1px] shadow-ambient`}
          >
            <div className="rounded-[calc(1.5rem-1px)] bg-surface-card p-5">
              <p className="text-sm text-muted">{stat.label}</p>
              <p className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.05em] text-text">
                {stat.value}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.4rem] bg-surface-card p-5 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Last refresh</p>
          <p className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
            {formatTimestamp(data.refresh.lastRefreshAt)}
          </p>
        </div>
        <div className="rounded-[1.4rem] bg-surface-card p-5 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Next refresh</p>
          <p className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
            {formatTimestamp(data.refresh.nextRefreshAt)}
          </p>
        </div>
        <div className="rounded-[1.4rem] bg-surface-card p-5 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Auto refresh status</p>
          <p className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
            {data.refresh.lastStatus}
          </p>
        </div>
      </section>
    </div>
  );
}
