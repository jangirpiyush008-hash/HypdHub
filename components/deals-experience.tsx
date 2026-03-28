"use client";

import Link from "next/link";
import { useState } from "react";
import { DealsBrowser } from "@/components/deals-browser";
import { MarketplaceTopDeals } from "@/components/marketplace-top-deals";
import { useCreatorAuth } from "@/components/auth-provider";

export function DealsExperience() {
  const { isAuthenticated } = useCreatorAuth();
  const [refreshKey, setRefreshKey] = useState(0);
  const [refreshStatus, setRefreshStatus] = useState("Idle");
  const [isRefreshing, setIsRefreshing] = useState(false);

  async function refreshDeals() {
    setIsRefreshing(true);
    setRefreshStatus("Refreshing live deals...");

    try {
      const response = await fetch("/api/refresh", { method: "POST" });
      const data = (await response.json()) as { message?: string };
      setRefreshKey((current) => current + 1);
      setRefreshStatus(data.message ?? "Deals refreshed.");
    } catch {
      setRefreshStatus("Unable to refresh deals right now.");
    } finally {
      setIsRefreshing(false);
    }
  }

  return (
    <div className="space-y-8">
      <section className="flex flex-col gap-3 rounded-[1.75rem] bg-surface-card p-6 shadow-ambient sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Live deals</p>
          <p className="mt-2 text-sm text-muted">Refresh the current deal feed whenever you want the latest board.</p>
        </div>
        <div className="flex flex-col items-start gap-3 sm:items-end">
          <button
            type="button"
            onClick={() => void refreshDeals()}
            disabled={isRefreshing}
            className="rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRefreshing ? "Refreshing..." : "Refresh Deals"}
          </button>
          <p className="text-xs uppercase tracking-[0.24em] text-muted">{refreshStatus}</p>
        </div>
      </section>

      <MarketplaceTopDeals refreshKey={refreshKey} />

      {isAuthenticated ? <DealsBrowser refreshKey={refreshKey} /> : null}

      {!isAuthenticated ? (
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Creator Access</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Login to unlock the full live deal feed
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          Public users can browse the live top boards above. Login with a HYPD-registered mobile number
          and OTP to unlock the full feed, filters, converter, dashboard, and connect pages.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-cta-gradient px-6 py-4 text-center font-headline text-sm font-bold text-white shadow-glow"
          >
            Login to unlock full access
          </Link>
          <div className="rounded-xl bg-surface-top px-6 py-4 text-center font-headline text-sm font-bold text-text">
            Live top deals only
          </div>
        </div>
      </section>
      ) : null}
    </div>
  );
}
