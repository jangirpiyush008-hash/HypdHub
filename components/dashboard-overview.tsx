"use client";

import { useEffect, useMemo, useState } from "react";
import { useCreatorAuth } from "@/components/auth-provider";
import { DashboardActions } from "@/components/dashboard-actions";
import { DashboardLiveIntelligence } from "@/components/dashboard-live-intelligence";
import { DashboardLiveQueue } from "@/components/dashboard-live-queue";
import { DashboardPipeline } from "@/components/dashboard-pipeline";
import { DashboardSidePanel } from "@/components/dashboard-side-panel";
import { SimpleBarChart } from "@/components/simple-bar-chart";
import { StoreMix } from "@/components/store-mix";
import { InternetDeal } from "@/lib/types";

type DealsApiResponse = {
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
  topDealsByMarketplace: Record<string, InternetDeal[]>;
};

type RankingApiResponse = {
  integrations: {
    hypd: {
      status: string;
      notes: string[];
    };
    marketplaces: {
      status: string;
      marketplaces: string[];
      rankingPriority: string[];
    };
    telegram: {
      accessibleNow: number;
      blockedPendingAccess: number;
      addlistsPendingExpansion: number;
      rateLimitedTemporarily: number;
      totalChannels: number;
      accessibleChannels: Array<{ id: number; title: string | null; handle: string | null }>;
    };
  };
  refresh: {
    lastRefreshAt: string | null;
    nextRefreshAt: string | null;
    lastStatus: string;
  };
  topDeals: InternetDeal[];
};

type DashboardData = {
  deals: DealsApiResponse | null;
  ranking: RankingApiResponse | null;
};

type SectionKey =
  | "dashboard"
  | "topDealsQueue"
  | "manualPushes"
  | "telegramFlow"
  | "whatsAppFlow"
  | "filters"
  | "botSettings"
  | "socialAccounts";

function SectionShell({
  eyebrow,
  title,
  description,
  children
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-6 rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{eyebrow}</p>
          <h2 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">{title}</h2>
          <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">{description}</p>
        </div>
      </div>
      {children}
    </section>
  );
}

function formatTimestamp(value: string | null) {
  if (!value) return "Pending";
  return new Date(value).toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    hour: "2-digit",
    minute: "2-digit"
  });
}

function OverviewPanel({ data }: { data: DashboardData }) {
  const { creator } = useCreatorAuth();

  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Dashboard overview</p>
            <h2 className="mt-3 font-headline text-4xl font-extrabold tracking-[-0.05em] text-text">
              Welcome back, @{creator?.hypdUsername ?? "creator"}.
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              This is your live command center for deal performance, ranking flow, refresh state, and creator operations.
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.12),rgba(138,35,135,0.18))] px-5 py-4 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Data window</p>
            <p className="mt-2 font-headline text-lg font-bold tracking-[-0.03em] text-text">Live pipeline status</p>
          </div>
        </div>
      </section>

      <DashboardActions />
      <DashboardLiveIntelligence />

      {data.deals ? (
        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-[1.35rem] bg-surface-card p-5 shadow-ambient">
            <p className="text-sm text-muted">Marketplace boards</p>
            <p className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.05em] text-text">
              {Object.values(data.deals.topDealsByMarketplace).filter((deals) => deals.length > 0).length}
            </p>
          </article>
          <article className="rounded-[1.35rem] bg-surface-card p-5 shadow-ambient">
            <p className="text-sm text-muted">Live queue items</p>
            <p className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.05em] text-text">
              {Object.values(data.deals.topDealsByMarketplace).flat().length}
            </p>
          </article>
          <article className="rounded-[1.35rem] bg-surface-card p-5 shadow-ambient">
            <p className="text-sm text-muted">Refresh status</p>
            <p className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.05em] text-text">
              {data.deals.refresh.lastStatus}
            </p>
          </article>
          <article className="rounded-[1.35rem] bg-surface-card p-5 shadow-ambient">
            <p className="text-sm text-muted">Next refresh</p>
            <p className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.05em] text-text">
              {formatTimestamp(data.deals.refresh.nextRefreshAt)}
            </p>
          </article>
        </section>
      ) : null}

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
          <SimpleBarChart />
        </div>
        <StoreMix />
      </section>
    </div>
  );
}

function TopDealsQueuePanel({ data }: { data: DashboardData }) {
  const topDeals = data.ranking?.topDeals ?? [];

  return (
    <SectionShell
      eyebrow="Queue"
      title="Top Deals Queue"
      description="Review the highest-priority products waiting to be pushed through HYPD, Telegram, and WhatsApp."
    >
      <DashboardPipeline />
      <DashboardLiveQueue />
      {topDeals.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {topDeals.slice(0, 3).map((deal, index) => (
            <article key={deal.id} className="rounded-[1.35rem] bg-surface-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Priority #{index + 1}</p>
              <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{deal.title}</h3>
              <p className="mt-2 text-sm text-muted">
                {deal.marketplace} • {deal.channelsCount} channels • score {deal.score}
              </p>
            </article>
          ))}
        </div>
      ) : null}
    </SectionShell>
  );
}

function ManualPushesPanel({ data }: { data: DashboardData }) {
  const topDeals = data.ranking?.topDeals ?? [];

  return (
    <SectionShell
      eyebrow="Campaigns"
      title="Manual Pushes"
      description="This panel is now reserved for real manual push operations. It will stay empty until connected publishing actions write live records here."
    >
      <div className="rounded-[1.5rem] bg-surface-low p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Manual queue status</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          {topDeals.length > 0
            ? `${topDeals.length} live ranked deals are available to turn into manual pushes.`
            : "No live ranked deals are available for manual push yet."}
        </p>
        {topDeals.length > 0 ? (
          <div className="mt-5 grid gap-3">
            {topDeals.slice(0, 5).map((deal) => (
              <div key={deal.id} className="rounded-[1.2rem] bg-surface-card px-4 py-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="font-headline text-lg font-bold tracking-[-0.03em] text-text">{deal.title}</h3>
                    <p className="mt-2 text-sm text-muted">
                      {deal.marketplace} • {deal.channelsCount} channels • validation {deal.validationStatus ?? "unverified"}
                    </p>
                  </div>
                  <p className="font-headline text-xl font-extrabold tracking-[-0.04em] text-text">
                    {deal.currentPrice ? `₹${deal.currentPrice.toLocaleString("en-IN")}` : "N/A"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </SectionShell>
  );
}

function TelegramFlowPanel({ data }: { data: DashboardData }) {
  const telegram = data.ranking?.integrations.telegram;

  return (
    <SectionShell
      eyebrow="Telegram"
      title="Telegram Flow"
      description="Track the content path from ranked deal queue to approved caption to posted Telegram update."
    >
      <div className="rounded-[1.5rem] bg-surface-low p-6">
        <SimpleBarChart />
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {[
          `Readable channels ${telegram?.accessibleNow ?? 0}`,
          `Blocked channels ${telegram?.blockedPendingAccess ?? 0}`,
          `Addlists pending ${telegram?.addlistsPendingExpansion ?? 0}`
        ].map((step, index) => (
          <article key={step} className="rounded-[1.3rem] bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Step {index + 1}</p>
            <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{step}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              {index === 0
                ? "These channels are currently available for live Telegram discovery."
                : index === 1
                  ? "These sources still need account access before they can contribute deal signals."
                  : "These Telegram folders still need channel expansion into direct sources."}
            </p>
          </article>
        ))}
      </div>
      {telegram?.accessibleChannels?.length ? (
        <div className="grid gap-3 md:grid-cols-2">
          {telegram.accessibleChannels.slice(0, 6).map((channel) => (
            <div key={channel.id} className="rounded-[1.2rem] bg-surface-low px-4 py-4 text-sm text-text">
              {channel.title ?? channel.handle ?? `Channel ${channel.id}`}
            </div>
          ))}
        </div>
      ) : null}
    </SectionShell>
  );
}

function WhatsAppFlowPanel({ data }: { data: DashboardData }) {
  return (
    <SectionShell
      eyebrow="WhatsApp"
      title="WhatsApp Flow"
      description="Review how broadcast-ready deals are selected, formatted, and distributed through WhatsApp lists."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          `${data.deals?.validatedDealsCount ?? 0} validated deals`,
          `${data.deals?.telegramDealsCount ?? 0} Telegram-sourced deals`,
          data.deals?.refresh.lastStatus ?? "Refresh pending"
        ].map((step, index) => (
          <article key={step} className="rounded-[1.3rem] bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Phase {index + 1}</p>
            <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{step}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              {index === 0
                ? "These are the strongest candidates for short-form broadcast pushes once delivery is connected."
                : index === 1
                  ? "These are the raw discovery inputs currently feeding the overall marketplace queue."
                  : "This is the current pipeline refresh state that downstream delivery will depend on."}
            </p>
          </article>
        ))}
      </div>

      <div className="rounded-[1.3rem] bg-surface-low px-5 py-5">
        <p className="text-sm text-muted">Status</p>
        <p className="mt-2 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">Awaiting live WhatsApp delivery integration</p>
      </div>
    </SectionShell>
  );
}

function FiltersPanel({ data }: { data: DashboardData }) {
  const marketplaceCoverage = useMemo(
    () =>
      Object.entries(data.deals?.topDealsByMarketplace ?? {}).map(([marketplace, deals]) => ({
        marketplace,
        count: deals.length
      })),
    [data.deals]
  );

  return (
    <SectionShell
      eyebrow="Rules"
      title="Filters"
      description="Shape the deal queue with real marketplace, price, and freshness rules before distribution begins."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {marketplaceCoverage.map((item) => (
          <div key={item.marketplace} className="rounded-[1.2rem] bg-surface-low px-4 py-4 text-sm text-text">
            {item.marketplace}: {item.count} live deals
          </div>
        ))}
      </div>
      <div className="rounded-[1.5rem] bg-surface-low p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Filtering strategy</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Filters now come only from live deal attributes. There are no seeded filter presets in the app anymore.
          Use stricter rules for broadcast channels and broader rules for discovery feeds.
        </p>
      </div>
    </SectionShell>
  );
}

function BotSettingsPanel({ data }: { data: DashboardData }) {
  const priorities = data.ranking?.integrations.marketplaces.rankingPriority ?? [];

  return (
    <SectionShell
      eyebrow="Configuration"
      title="Bot Settings"
      description="Control how your Telegram and WhatsApp automations behave when publishing, retrying, or waiting for approval."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        <article className="rounded-[1.35rem] bg-surface-low p-5">
          <h3 className="font-headline text-xl font-bold tracking-[-0.03em] text-text">Refresh cadence</h3>
          <p className="mt-3 text-sm leading-7 text-muted">Next run {formatTimestamp(data.ranking?.refresh.nextRefreshAt ?? null)}</p>
        </article>
        <article className="rounded-[1.35rem] bg-surface-low p-5">
          <h3 className="font-headline text-xl font-bold tracking-[-0.03em] text-text">Pipeline status</h3>
          <p className="mt-3 text-sm leading-7 text-muted">{data.ranking?.refresh.lastStatus ?? "Pending"}</p>
        </article>
        <article className="rounded-[1.35rem] bg-surface-low p-5">
          <h3 className="font-headline text-xl font-bold tracking-[-0.03em] text-text">HYPD integration</h3>
          <p className="mt-3 text-sm leading-7 text-muted">{data.ranking?.integrations.hypd.status ?? "Pending"}</p>
        </article>
      </div>
      {priorities.length ? (
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {priorities.map((priority) => (
            <div key={priority} className="rounded-[1.2rem] bg-surface-low px-4 py-4 text-sm text-text">
              {priority}
            </div>
          ))}
        </div>
      ) : null}
    </SectionShell>
  );
}

function SocialAccountsPanel({ data }: { data: DashboardData }) {
  const telegram = data.ranking?.integrations.telegram;

  return (
    <SectionShell
      eyebrow="Accounts"
      title="Social Accounts"
      description="See which channel destinations are connected and where more setup or review is still required."
    >
      <div className="grid gap-4 md:grid-cols-2">
        <article className="rounded-[1.35rem] bg-surface-low p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Telegram readable</p>
          <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{telegram?.accessibleNow ?? 0}</h3>
          <p className="mt-2 text-sm text-muted">of {telegram?.totalChannels ?? 0} tracked sources</p>
        </article>
        <article className="rounded-[1.35rem] bg-surface-low p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Pending access</p>
          <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">
            {(telegram?.blockedPendingAccess ?? 0) + (telegram?.addlistsPendingExpansion ?? 0)}
          </h3>
          <p className="mt-2 text-sm text-muted">blocked or addlist sources</p>
        </article>
      </div>
    </SectionShell>
  );
}

export function DashboardOverview() {
  const [activeKey, setActiveKey] = useState<SectionKey>("dashboard");
  const [data, setData] = useState<DashboardData>({ deals: null, ranking: null });

  useEffect(() => {
    async function load() {
      const [dealsResponse, rankingResponse] = await Promise.all([
        fetch("/api/deals"),
        fetch("/api/ranking")
      ]);

      const [deals, ranking] = (await Promise.all([
        dealsResponse.json(),
        rankingResponse.json()
      ])) as [DealsApiResponse, RankingApiResponse];

      setData({ deals, ranking });
    }

    load().catch(() => setData({ deals: null, ranking: null }));
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.28fr_0.72fr]">
      <DashboardSidePanel activeKey={activeKey} onSelect={(key) => setActiveKey(key as SectionKey)} />

      <div className="space-y-6">
        {activeKey === "dashboard" ? <OverviewPanel data={data} /> : null}
        {activeKey === "topDealsQueue" ? <TopDealsQueuePanel data={data} /> : null}
        {activeKey === "manualPushes" ? <ManualPushesPanel data={data} /> : null}
        {activeKey === "telegramFlow" ? <TelegramFlowPanel data={data} /> : null}
        {activeKey === "whatsAppFlow" ? <WhatsAppFlowPanel data={data} /> : null}
        {activeKey === "filters" ? <FiltersPanel data={data} /> : null}
        {activeKey === "botSettings" ? <BotSettingsPanel data={data} /> : null}
        {activeKey === "socialAccounts" ? <SocialAccountsPanel data={data} /> : null}
      </div>
    </div>
  );
}
