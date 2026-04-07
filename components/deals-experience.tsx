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
    setRefreshStatus("Refreshing...");
    try {
      const res = await fetch("/api/refresh", { method: "POST" });
      const data = (await res.json()) as { message?: string };
      setRefreshKey((k) => k + 1);
      setRefreshStatus(data.message ?? "Refreshed.");
    } catch { setRefreshStatus("Refresh failed."); }
    finally { setIsRefreshing(false); }
  }

  return (
    <div className="space-y-6">
      {/* Refresh bar */}
      <div className="flex items-center justify-between gap-3 rounded-xl bg-surface-card p-4">
        <div className="flex items-center gap-3">
          <span className="h-2 w-2 rounded-full bg-tertiary" />
          <span className="text-sm text-muted">{refreshStatus}</span>
        </div>
        <button
          onClick={() => void refreshDeals()}
          disabled={isRefreshing}
          className="rounded-lg bg-cta-gradient px-4 py-2 text-xs font-bold text-white shadow-glow disabled:opacity-50"
        >
          {isRefreshing ? "Refreshing..." : "Refresh Deals"}
        </button>
      </div>

      <MarketplaceTopDeals refreshKey={refreshKey} />

      {isAuthenticated ? <DealsBrowser refreshKey={refreshKey} /> : (
        <div className="rounded-xl bg-surface-card p-6 text-center">
          <h3 className="font-headline text-lg font-bold text-text">Login to unlock full deal feed</h3>
          <p className="mt-2 text-sm text-muted">
            Access filters, converter, dashboard, and automation tools.
          </p>
          <Link
            href="/login"
            className="mt-4 inline-block rounded-lg bg-cta-gradient px-6 py-3 text-sm font-bold text-white shadow-glow"
          >
            Login with HYPD
          </Link>
        </div>
      )}
    </div>
  );
}
