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
import {
  OFFICIAL_HYPD_SOURCE_LABEL,
  TelegramAutomation,
  WhatsAppAutomation
} from "@/lib/automation-config";
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

type AutomationData = {
  telegram: TelegramAutomation[];
  whatsApp: WhatsAppAutomation[];
};

type TelegramAutomationResponse = {
  ok: boolean;
  automations?: TelegramAutomation[];
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

function OverviewPanel({ data, automations }: { data: DashboardData; automations: AutomationData }) {
  const { creator } = useCreatorAuth();
  const totalAutomations = automations.telegram.length;
  const activeAutomations = automations.telegram.filter((item) => item.enabled).length;

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
            <p className="text-sm text-muted">Connected automations</p>
            <p className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.05em] text-text">
              {totalAutomations}
            </p>
          </article>
          <article className="rounded-[1.35rem] bg-surface-card p-5 shadow-ambient">
            <p className="text-sm text-muted">Active automations</p>
            <p className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.05em] text-text">
              {activeAutomations}
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
              <p className="mt-2 text-sm text-muted">{deal.marketplace} • score {deal.score}</p>
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
                    <p className="mt-2 text-sm text-muted">{deal.marketplace} • validation {deal.validationStatus ?? "unverified"}</p>
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

function TelegramFlowPanel({ automations }: { automations: AutomationData }) {
  const telegram = automations.telegram;

  return (
    <SectionShell
      eyebrow="Telegram"
      title="Telegram Automation"
      description="Manage creator-side Telegram automations for link conversion, forwarding, posting schedule, and image mode."
    >
      {telegram.length === 0 ? (
        <div className="rounded-[1.35rem] bg-surface-low p-5 text-sm text-muted">
          No Telegram automations configured yet. Add them from the Connect page.
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {telegram.map((automation) => (
            <article key={automation.id} className="rounded-[1.35rem] bg-surface-low p-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                    {automation.enabled ? "Enabled" : "Paused"}
                  </p>
                  <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">
                    {automation.name || "Unnamed Telegram automation"}
                  </h3>
                  <p className="mt-2 text-sm text-muted">
                    source: {automation.sourceMode === "official_hypd" ? OFFICIAL_HYPD_SOURCE_LABEL : automation.sourceChannelLabel || "Custom source"}
                  </p>
                </div>
                <div className="rounded-xl bg-surface-card px-3 py-2 text-xs font-bold uppercase tracking-[0.24em] text-text">
                  {automation.postFormat.replace("_", " ")}
                </div>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div className="rounded-xl bg-surface-card px-3 py-3 text-sm text-text">
                  Destination: {automation.destinationChannelUsername || automation.destinationChannelId || "Not set"}
                </div>
                <div className="rounded-xl bg-surface-card px-3 py-3 text-sm text-text">
                  Link convert: {automation.linkConversionEnabled ? "On" : "Off"}
                </div>
                <div className="rounded-xl bg-surface-card px-3 py-3 text-sm text-text">
                  Auto forward: {automation.autoForwardEnabled ? "On" : "Off"}
                </div>
                <div className="rounded-xl bg-surface-card px-3 py-3 text-sm text-text">
                  Auto posting: {automation.autoPostingEnabled ? "On" : "Off"}
                </div>
                <div className="rounded-xl bg-surface-card px-3 py-3 text-sm text-text">
                  Window: {automation.postingWindow || "Not set"}
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </SectionShell>
  );
}

function WhatsAppFlowPanel() {
  return (
    <SectionShell
      eyebrow="WhatsApp"
      title="WhatsApp Automation"
      description="WhatsApp will be added after the Telegram automation backend is finalized."
    >
      <div className="rounded-[1.35rem] bg-surface-low p-5 text-sm text-muted">
        WhatsApp is intentionally held for the next phase. Once you share the business credentials and template details,
        we can wire the same HYPD link conversion, auto forwarding, auto posting, and image-mode controls there too.
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

function BotSettingsPanel({ data, automations }: { data: DashboardData; automations: AutomationData }) {
  const totalWithImages = automations.telegram.filter(
    (item) => item.postFormat === "with_image" || item.postFormat === "both"
  ).length;
  const totalAutoPosting = automations.telegram.filter(
    (item) => item.autoPostingEnabled
  ).length;
  const totalLinkConvert = automations.telegram.filter(
    (item) => item.linkConversionEnabled
  ).length;

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
          <h3 className="font-headline text-xl font-bold tracking-[-0.03em] text-text">HYPD link convert</h3>
          <p className="mt-3 text-sm leading-7 text-muted">{totalLinkConvert} automations have forced HYPD conversion enabled.</p>
        </article>
      </div>
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        <div className="rounded-[1.2rem] bg-surface-low px-4 py-4 text-sm text-text">
          {totalAutoPosting} automations have auto posting enabled
        </div>
        <div className="rounded-[1.2rem] bg-surface-low px-4 py-4 text-sm text-text">
          {totalWithImages} automations can post with image
        </div>
        <div className="rounded-[1.2rem] bg-surface-low px-4 py-4 text-sm text-text">
          {data.ranking?.integrations.hypd.status ?? "pending"} HYPD API status
        </div>
      </div>
    </SectionShell>
  );
}

function SocialAccountsPanel({ automations }: { automations: AutomationData }) {
  const enabledCount = automations.telegram.filter((item) => item.enabled).length;

  return (
    <SectionShell
      eyebrow="Automation"
      title="Connected Automations"
      description="See which Telegram automations are configured for this creator."
    >
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-[1.35rem] bg-surface-low p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Telegram automations</p>
          <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{automations.telegram.length}</h3>
        </article>
        <article className="rounded-[1.35rem] bg-surface-low p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Official source option</p>
          <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">Enabled</h3>
        </article>
        <article className="rounded-[1.35rem] bg-surface-low p-5">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Enabled automations</p>
          <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{enabledCount}</h3>
        </article>
      </div>
      {automations.telegram.length > 0 ? (
        <div className="grid gap-3 md:grid-cols-2">
          {automations.telegram.map((automation) => (
            <div key={automation.id} className="rounded-[1.2rem] bg-surface-low px-4 py-4 text-sm text-text">
              {automation.name || "Unnamed automation"} • {automation.sourceMode === "official_hypd" ? "Official HYPD source" : "Custom source"}
            </div>
          ))}
        </div>
      ) : (
        <div className="rounded-[1.35rem] bg-surface-low p-5 text-sm text-muted">
          No Telegram automations configured yet.
        </div>
      )}
    </SectionShell>
  );
}

export function DashboardOverview() {
  const [activeKey, setActiveKey] = useState<SectionKey>("dashboard");
  const [data, setData] = useState<DashboardData>({ deals: null, ranking: null });
  const [automations, setAutomations] = useState<AutomationData>({ telegram: [], whatsApp: [] });

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

  useEffect(() => {
    async function loadAutomations() {
      try {
        const response = await fetch("/api/automation/telegram", { cache: "no-store" });
        const result = (await response.json()) as TelegramAutomationResponse;
        setAutomations({
          telegram: response.ok && result.ok ? result.automations ?? [] : [],
          whatsApp: []
        });
      } catch {
        setAutomations({
          telegram: [],
          whatsApp: []
        });
      }
    }

    loadAutomations().catch(() => {
      setAutomations({
        telegram: [],
        whatsApp: []
      });
    });
  }, []);

  return (
    <div className="grid gap-6 xl:grid-cols-[0.28fr_0.72fr]">
      <DashboardSidePanel activeKey={activeKey} onSelect={(key) => setActiveKey(key as SectionKey)} />

      <div className="space-y-6">
        {activeKey === "dashboard" ? <OverviewPanel data={data} automations={automations} /> : null}
        {activeKey === "topDealsQueue" ? <TopDealsQueuePanel data={data} /> : null}
        {activeKey === "manualPushes" ? <ManualPushesPanel data={data} /> : null}
        {activeKey === "telegramFlow" ? <TelegramFlowPanel automations={automations} /> : null}
        {activeKey === "whatsAppFlow" ? <WhatsAppFlowPanel /> : null}
        {activeKey === "filters" ? <FiltersPanel data={data} /> : null}
        {activeKey === "botSettings" ? <BotSettingsPanel data={data} automations={automations} /> : null}
        {activeKey === "socialAccounts" ? <SocialAccountsPanel automations={automations} /> : null}
      </div>
    </div>
  );
}
