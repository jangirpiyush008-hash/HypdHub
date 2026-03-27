"use client";

import { useState } from "react";
import { DashboardActions } from "@/components/dashboard-actions";
import { DashboardLiveIntelligence } from "@/components/dashboard-live-intelligence";
import { DashboardLiveQueue } from "@/components/dashboard-live-queue";
import { DashboardPipeline } from "@/components/dashboard-pipeline";
import { DashboardSidePanel } from "@/components/dashboard-side-panel";
import { SimpleBarChart } from "@/components/simple-bar-chart";
import { StoreMix } from "@/components/store-mix";
import { recentLinks } from "@/data/mock";

const resources = [
  { label: "Connected social accounts", value: "09" },
  { label: "Tracked stores this month", value: "06" },
  { label: "Queued deal pushes", value: "18" }
];

const manualPushes = [
  { title: "Flash sneaker push", audience: "VIP Telegram", status: "Scheduled 6:30 PM", note: "High demand product with fast click velocity." },
  { title: "Fashion combo drop", audience: "WhatsApp Broadcast A", status: "Pending approval", note: "Waiting for final CTA and coupon confirmation." },
  { title: "Audio hero placement", audience: "Homepage + channels", status: "Live boost", note: "Pinned to increase creator visibility this evening." }
];

const filters = [
  "Price under 2,500",
  "Rating above 4.2",
  "Fashion and electronics",
  "Only high-demand deals",
  "Exclude out-of-stock products",
  "Boost HYPD-native inventory"
];

const botSettings = [
  { title: "Posting cadence", body: "Telegram posts 5 times daily. WhatsApp sends 3 curated pushes with manual override enabled." },
  { title: "Caption style", body: "Short opener, one-line benefit, price callout, then HYPD CTA link for both platforms." },
  { title: "Failure handling", body: "If conversion fails, queue the product for review instead of publishing a broken link." }
];

const socialAccounts = [
  { name: "Telegram Main Deals", handle: "@hypd_deals", status: "Connected" },
  { name: "Telegram VIP Deals", handle: "@hypd_vipdrops", status: "Connected" },
  { name: "WhatsApp Broadcast A", handle: "+91 creator list", status: "Connected" },
  { name: "WhatsApp Broadcast B", handle: "+91 premium list", status: "Needs template review" }
];

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

function OverviewPanel() {
  return (
    <div className="space-y-6">
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Dashboard overview</p>
            <h2 className="mt-3 font-headline text-4xl font-extrabold tracking-[-0.05em] text-text">
              Welcome back, Piyush Jangir Jangir.
            </h2>
            <p className="mt-2 text-sm leading-7 text-muted">
              This is your command center for deal performance, platform flow, bot health, and creator distribution.
            </p>
          </div>
          <div className="rounded-[1.4rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.12),rgba(138,35,135,0.18))] px-5 py-4 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Data window</p>
            <p className="mt-2 font-headline text-lg font-bold tracking-[-0.03em] text-text">March 2026 snapshot</p>
          </div>
        </div>
      </section>

      <DashboardActions />
      <DashboardLiveIntelligence />

      <section className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
          <SimpleBarChart />
        </div>
        <StoreMix />
      </section>
    </div>
  );
}

function TopDealsQueuePanel() {
  return (
    <SectionShell
      eyebrow="Queue"
      title="Top Deals Queue"
      description="Review the highest-priority products waiting to be pushed through HYPD, Telegram, and WhatsApp."
    >
      <DashboardPipeline />
      <DashboardLiveQueue />
    </SectionShell>
  );
}

function ManualPushesPanel() {
  return (
    <SectionShell
      eyebrow="Campaigns"
      title="Manual Pushes"
      description="Use this view for sponsored placements, priority campaigns, and any deal that needs human review before publishing."
    >
      <div className="grid gap-4 xl:grid-cols-3">
        {manualPushes.map((push) => (
          <article key={push.title} className="rounded-[1.35rem] bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{push.status}</p>
            <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{push.title}</h3>
            <p className="mt-2 text-sm text-muted">{push.audience}</p>
            <p className="mt-4 text-sm leading-7 text-muted">{push.note}</p>
          </article>
        ))}
      </div>

      <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.18),rgba(138,35,135,0.34))] p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Recent converted links</p>
        <div className="mt-5 grid gap-4">
          {recentLinks.map((link) => (
            <div key={link.id} className="rounded-[1.2rem] bg-white/10 px-4 py-4 backdrop-blur-sm">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h3 className="font-headline text-lg font-bold tracking-[-0.03em] text-text">{link.title}</h3>
                  <p className="mt-2 break-all text-sm text-text/80">{link.convertedUrl}</p>
                </div>
                <div className="text-right">
                  <p className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">{link.clicks}</p>
                  <p className="text-xs uppercase tracking-[0.24em] text-primary">Clicks</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </SectionShell>
  );
}

function TelegramFlowPanel() {
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
        {["Pull from queue", "Format caption", "Post to channel"].map((step, index) => (
          <article key={step} className="rounded-[1.3rem] bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Step {index + 1}</p>
            <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{step}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              Telegram posts should include the strongest hook, the best visible discount, and a clean HYPD link.
            </p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function WhatsAppFlowPanel() {
  return (
    <SectionShell
      eyebrow="WhatsApp"
      title="WhatsApp Flow"
      description="Review how broadcast-ready deals are selected, formatted, and distributed through WhatsApp lists."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {[
          "Select high-conversion products",
          "Apply approved templates",
          "Send to broadcast segments"
        ].map((step, index) => (
          <article key={step} className="rounded-[1.3rem] bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Phase {index + 1}</p>
            <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{step}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">
              WhatsApp performs best with shorter copy, stronger urgency, and one clear CTA linked to HYPD tracking.
            </p>
          </article>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {resources.map((resource) => (
          <div key={resource.label} className="rounded-[1.3rem] bg-surface-low px-5 py-5">
            <p className="text-sm text-muted">{resource.label}</p>
            <p className="mt-2 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">{resource.value}</p>
          </div>
        ))}
      </div>
    </SectionShell>
  );
}

function FiltersPanel() {
  return (
    <SectionShell
      eyebrow="Rules"
      title="Filters"
      description="Shape the deal queue with pricing, category, demand, and marketplace filters before distribution begins."
    >
      <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {filters.map((filter) => (
          <div key={filter} className="rounded-[1.2rem] bg-surface-low px-4 py-4 text-sm text-text">
            {filter}
          </div>
        ))}
      </div>
      <div className="rounded-[1.5rem] bg-surface-low p-6">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Filtering strategy</p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Use stricter filters for WhatsApp premium lists and broader filters for Telegram discovery channels.
          That helps you protect audience quality while still testing more products in wider public feeds.
        </p>
      </div>
    </SectionShell>
  );
}

function BotSettingsPanel() {
  return (
    <SectionShell
      eyebrow="Configuration"
      title="Bot Settings"
      description="Control how your Telegram and WhatsApp automations behave when publishing, retrying, or waiting for approval."
    >
      <div className="grid gap-4 lg:grid-cols-3">
        {botSettings.map((setting) => (
          <article key={setting.title} className="rounded-[1.35rem] bg-surface-low p-5">
            <h3 className="font-headline text-xl font-bold tracking-[-0.03em] text-text">{setting.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{setting.body}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

function SocialAccountsPanel() {
  return (
    <SectionShell
      eyebrow="Accounts"
      title="Social Accounts"
      description="See which channel destinations are connected and where more setup or review is still required."
    >
      <div className="grid gap-4 md:grid-cols-2">
        {socialAccounts.map((account) => (
          <article key={account.name} className="rounded-[1.35rem] bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{account.status}</p>
            <h3 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">{account.name}</h3>
            <p className="mt-2 text-sm text-muted">{account.handle}</p>
          </article>
        ))}
      </div>
    </SectionShell>
  );
}

export function DashboardOverview() {
  const [activeKey, setActiveKey] = useState<SectionKey>("dashboard");

  return (
    <div className="grid gap-6 xl:grid-cols-[0.28fr_0.72fr]">
      <DashboardSidePanel activeKey={activeKey} onSelect={(key) => setActiveKey(key as SectionKey)} />

      <div className="space-y-6">
        {activeKey === "dashboard" ? <OverviewPanel /> : null}
        {activeKey === "topDealsQueue" ? <TopDealsQueuePanel /> : null}
        {activeKey === "manualPushes" ? <ManualPushesPanel /> : null}
        {activeKey === "telegramFlow" ? <TelegramFlowPanel /> : null}
        {activeKey === "whatsAppFlow" ? <WhatsAppFlowPanel /> : null}
        {activeKey === "filters" ? <FiltersPanel /> : null}
        {activeKey === "botSettings" ? <BotSettingsPanel /> : null}
        {activeKey === "socialAccounts" ? <SocialAccountsPanel /> : null}
      </div>
    </div>
  );
}
