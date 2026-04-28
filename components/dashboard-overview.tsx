"use client";

import { useEffect, useState } from "react";
import { useCreatorAuth } from "@/components/auth-provider";
import { DashboardLiveIntelligence } from "@/components/dashboard-live-intelligence";
import { DashboardLiveQueue } from "@/components/dashboard-live-queue";
import { SimpleBarChart } from "@/components/simple-bar-chart";
import { StoreMix } from "@/components/store-mix";
import { TelegramAutomation } from "@/lib/automation-config";
import { InternetDeal } from "@/lib/types";

type HypdCommission = { label: string; commission: string };
type HypdStats = { sales: string | null; orders: string | null; withdrawable: string | null; pending: string | null };

type DealsApiResponse = {
  totalDealsCount?: number;
  history: { trackedDeals: number; trackedSnapshots: number };
  refresh: { lastRefreshAt: string | null; nextRefreshAt: string | null; lastStatus: string };
  topDealsByMarketplace: Record<string, InternetDeal[]>;
  hypd?: {
    status: string;
    marketplaceCommissions?: HypdCommission[];
    stats?: HypdStats;
  };
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

const HYPD_BOTS = [
  { name: "HYPD Converter Bot", username: "@HypdConverterbot", status: "active" as const },
];

const MARKETPLACE_COMMISSIONS_FALLBACK: HypdCommission[] = [
  { label: "Myntra", commission: "3.5% - 12%" },
  { label: "Flipkart", commission: "2% - 15%" },
  { label: "Meesho", commission: "1% - 8%" },
  { label: "Ajio", commission: "3% - 10%" },
  { label: "Nykaa", commission: "5% - 15%" },
  { label: "Shopsy", commission: "2% - 10%" },
];

function fmt(v: string | null) {
  if (!v) return "—";
  return new Date(v).toLocaleString("en-IN", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
}

function StatCard({ label, value, accent }: { label: string; value: string | number; accent?: boolean }) {
  return (
    <div className={`rounded-xl p-4 ${accent ? "bg-cta-gradient text-white" : "bg-surface-card"}`}>
      <p className={`text-xs ${accent ? "text-white/70" : "text-muted"}`}>{label}</p>
      <p className={`mt-1 font-headline text-2xl font-bold ${accent ? "text-white" : "text-text"}`}>{value}</p>
    </div>
  );
}

function BotIcon() {
  return (
    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="11" width="18" height="10" rx="2" />
      <circle cx="12" cy="5" r="2" />
      <path d="M12 7v4" />
      <line x1="8" y1="16" x2="8" y2="16" />
      <line x1="16" y1="16" x2="16" y2="16" />
    </svg>
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
  const totalDeals = data.deals
    ? Object.values(data.deals.topDealsByMarketplace).reduce((sum, d) => sum + d.length, 0)
    : 0;

  const commissions = data.deals?.hypd?.marketplaceCommissions?.length
    ? data.deals.hypd.marketplaceCommissions
    : MARKETPLACE_COMMISSIONS_FALLBACK;

  const hypdStats = data.deals?.hypd?.stats;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="rounded-xl bg-card-gradient p-6">
        <h2 className="font-headline text-2xl font-bold text-text">
          Welcome back, <span className="hypd-gradient-text">@{creator?.hypdUsername ?? "creator"}</span>
        </h2>
        <p className="mt-1 text-sm text-muted">
          Your creator engine is fueled up. Here&apos;s how your latest drops are performing today.
        </p>
      </div>

      {/* Stats grid */}
      {data.deals ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <StatCard label="Active Links" value={totalDeals} accent />
          <StatCard label="Marketplaces" value={marketplaceCount} />
          <StatCard label="Total Automations" value={automations.length} />
          <StatCard label="Active Automations" value={activeCount} />
        </div>
      ) : null}

      {/* HYPD Stats (from API) */}
      {hypdStats && (hypdStats.sales || hypdStats.orders) ? (
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {hypdStats.sales ? <StatCard label="Total Sales" value={`₹${hypdStats.sales}`} /> : null}
          {hypdStats.orders ? <StatCard label="Orders" value={hypdStats.orders} /> : null}
          {hypdStats.withdrawable ? <StatCard label="Withdrawable" value={`₹${hypdStats.withdrawable}`} /> : null}
          {hypdStats.pending ? <StatCard label="Pending" value={`₹${hypdStats.pending}`} /> : null}
        </div>
      ) : null}

      {/* Quick Actions */}
      <div className="grid gap-3 sm:grid-cols-3">
        <a
          href="https://getpapapa.com/"
          target="_blank"
          rel="noreferrer"
          className="flex items-center gap-3 rounded-xl bg-surface-card p-4 transition-colors hover:bg-surface-high"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-tertiary/15 text-tertiary">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-text">Shop Papapa</p>
            <p className="text-[10px] text-muted">Buy & earn reward points</p>
          </div>
        </a>
        <a
          href="/converter"
          className="flex items-center gap-3 rounded-xl bg-surface-card p-4 transition-colors hover:bg-surface-high"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/15 text-primary">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-text">Link Converter</p>
            <p className="text-[10px] text-muted">Convert affiliate links</p>
          </div>
        </a>
        <a
          href="/connect"
          className="flex items-center gap-3 rounded-xl bg-surface-card p-4 transition-colors hover:bg-surface-high"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-accent-blue/15 text-accent-blue">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          </div>
          <div>
            <p className="text-sm font-bold text-text">Automate</p>
            <p className="text-[10px] text-muted">Telegram & WhatsApp bots</p>
          </div>
        </a>
      </div>

      {/* HYPD Converter Bots */}
      <div className="rounded-xl bg-surface-card p-5">
        <h3 className="font-headline text-lg font-bold text-text">HYPD Converter Bots</h3>
        <p className="mt-1 text-xs text-muted">Bots available for automated link conversion and deal forwarding.</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          {HYPD_BOTS.map((bot) => (
            <div key={bot.username} className="flex items-center gap-3 rounded-lg bg-surface-high p-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/15 text-primary">
                <BotIcon />
              </div>
              <div className="flex-1">
                <p className="text-sm font-bold text-text">{bot.name}</p>
                <a
                  href={`https://t.me/${bot.username.replace("@", "")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-primary hover:underline"
                >
                  {bot.username}
                </a>
              </div>
              <span className="rounded-full bg-tertiary/15 px-2.5 py-0.5 text-[10px] font-bold text-tertiary">
                {bot.status === "active" ? "Active" : "Inactive"}
              </span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-muted/60">More converter bots will be added soon.</p>
      </div>

      {/* Commission Structure */}
      <div className="rounded-xl bg-surface-card p-5">
        <h3 className="font-headline text-lg font-bold text-text">Marketplace Commission Structure</h3>
        <p className="mt-1 text-xs text-muted">Commission rates from HYPD for each marketplace.</p>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {commissions.map((c) => (
            <div key={c.label} className="flex items-center justify-between rounded-lg bg-surface-high px-4 py-3">
              <span className="text-sm font-medium text-text">{c.label}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">{c.commission}</span>
            </div>
          ))}
        </div>
        <p className="mt-3 text-[10px] text-muted/60">
          Rates are indicative and fetched from HYPD open APIs. Actual commission may vary by category and brand.
        </p>
      </div>

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

      {/* Refresh info */}
      {data.deals ? (
        <div className="rounded-lg bg-surface-card p-4">
          <div className="flex items-center justify-between text-xs text-muted">
            <span>Last refresh: {fmt(data.deals.refresh.lastRefreshAt)}</span>
            <span>Next: {fmt(data.deals.refresh.nextRefreshAt)}</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}
