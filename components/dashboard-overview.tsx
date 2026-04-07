"use client";

import { useEffect, useState } from "react";
import { useCreatorAuth } from "@/components/auth-provider";
import { DashboardLiveIntelligence } from "@/components/dashboard-live-intelligence";
import { DashboardLiveQueue } from "@/components/dashboard-live-queue";
import { SimpleBarChart } from "@/components/simple-bar-chart";
import { StoreMix } from "@/components/store-mix";
import { TelegramAutomation } from "@/lib/automation-config";
import { InternetDeal } from "@/lib/types";

type DealsApiResponse = {
  telegramDealsCount: number;
  validatedDealsCount: number;
  history: { trackedDeals: number; trackedSnapshots: number };
  refresh: { lastRefreshAt: string | null; nextRefreshAt: string | null; lastStatus: string };
  topDealsByMarketplace: Record<string, InternetDeal[]>;
};

type RankingApiResponse = {
  integrations: {
    hypd: { status: string; notes: string[] };
    marketplaces: { status: string; marketplaces: string[]; rankingPriority: string[] };
    telegram: {
      accessibleNow: number; blockedPendingAccess: number;
      totalChannels: number;
      accessibleChannels: Array<{ id: number; title: string | null; handle: string | null }>;
    };
  };
  refresh: { lastRefreshAt: string | null; nextRefreshAt: string | null; lastStatus: string };
  topDeals: InternetDeal[];
};

type DashboardData = { deals: DealsApiResponse | null; ranking: RankingApiResponse | null };

function fmt(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl bg-surface-card p-4">
      <p className="text-xs text-muted">{label}</p>
      <p className="mt-1 font-headline text-2xl font-bold text-text">{value}</p>
    </div>
  );
}

export function DashboardOverview() {
  const { creator } = useCreatorAuth();
  const [data, setData] = useState<DashboardData>({ deals: null, ranking: null });
  const [automations, setAutomations] = useState<TelegramAutomation[]>([]);

  useEffect(() => {
    Promise.all([fetch("/api/deals"), fetch("/api/ranking")])
      .then(([d, r]) => Promise.all([d.json(), r.json()]))
      .then(([deals, ranking]) => setData({ deals, ranking }))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("/api/automation/telegram", { cache: "no-store" })
      .then((r) => r.json())
      .then((result: { ok: boolean; automations?: TelegramAutomation[] }) => {
        if (result.ok) setAutomations(result.automations ?? []);
      })
      .catch(() => {});
  }, []);

  const activeCount = automations.filter((a) => a.enabled).length;
  const marketplaceCount = data.deals
    ? Object.values(data.deals.topDealsByMarketplace).filter((d) => d.length > 0).length
    : 0;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-card-gradient p-6">
        <h2 className="font-headline text-xl font-bold text-text">
          Welcome back, <span className="text-primary">@{creator?.hypdUsername ?? "creator"}</span>
        </h2>
        <p className="mt-1 text-sm text-muted">Live pipeline status and automation tracking.</p>
      </div>

      {/* Stats grid */}
      {data.deals ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Marketplaces Active" value={marketplaceCount} />
          <StatCard label="Total Automations" value={automations.length} />
          <StatCard label="Active Automations" value={activeCount} />
          <StatCard label="Next Refresh" value={fmt(data.deals.refresh.nextRefreshAt)} />
        </div>
      ) : null}

      {/* Intelligence */}
      <DashboardLiveIntelligence />

      {/* Charts */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl bg-surface-card p-5">
          <SimpleBarChart />
        </div>
        <StoreMix />
      </div>

      {/* Deal queue */}
      <DashboardLiveQueue />

      {/* Top ranked deals */}
      {data.ranking?.topDeals && data.ranking.topDeals.length > 0 ? (
        <div className="rounded-xl bg-surface-card p-5">
          <h3 className="font-headline text-lg font-bold text-text">Top Ranked Deals</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
            {data.ranking.topDeals.slice(0, 6).map((deal, i) => (
              <div key={deal.id} className="rounded-lg bg-surface-high p-4">
                <div className="flex items-center gap-2">
                  <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">#{i + 1}</span>
                  <span className="text-xs text-muted">{deal.marketplace}</span>
                </div>
                <p className="mt-2 text-sm font-semibold text-text line-clamp-2">{deal.title}</p>
                <p className="mt-1 text-xs text-muted">
                  Score {deal.score} · {deal.currentPrice ? `₹${deal.currentPrice.toLocaleString("en-IN")}` : "N/A"}
                </p>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Automations summary */}
      {automations.length > 0 ? (
        <div className="rounded-xl bg-surface-card p-5">
          <h3 className="font-headline text-lg font-bold text-text">Telegram Automations</h3>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {automations.map((a) => (
              <div key={a.id} className="flex items-center justify-between gap-3 rounded-lg bg-surface-high px-4 py-3">
                <div>
                  <p className="text-sm font-semibold text-text">{a.name || "Unnamed"}</p>
                  <p className="text-xs text-muted">
                    {a.sourceMode === "official_hypd" ? "HYPD Source" : "Custom"} → {a.destinationChannelUsername || "Not set"}
                  </p>
                </div>
                <span className={`rounded px-2 py-0.5 text-[10px] font-bold ${
                  a.enabled ? "bg-tertiary/15 text-tertiary" : "bg-surface-bright text-muted"
                }`}>
                  {a.enabled ? "Active" : "Paused"}
                </span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
