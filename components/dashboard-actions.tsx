"use client";

import { useState } from "react";

async function copyText(value: string) {
  await navigator.clipboard.writeText(value);
}

export function DashboardActions() {
  const [status, setStatus] = useState("Idle");

  async function runRefresh() {
    setStatus("Refreshing...");
    const response = await fetch("/api/refresh", { method: "POST" });
    const data = (await response.json()) as { message: string };
    setStatus(data.message);
  }

  async function exportSummary() {
    const response = await fetch("/api/deals");
    const data = await response.json();
    await copyText(JSON.stringify(data, null, 2));
    setStatus("Deals JSON copied");
  }

  async function openRanking() {
    const response = await fetch("/api/ranking");
    const data = await response.json();
    await copyText(JSON.stringify(data, null, 2));
    setStatus("Ranking model copied");
  }

  return (
    <div className="flex flex-col gap-3 rounded-[1.75rem] bg-surface-card p-6 shadow-ambient md:flex-row md:items-center md:justify-between">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Dashboard actions</p>
        <p className="mt-2 text-sm text-muted">Primary dashboard buttons now trigger real scaffold actions.</p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row">
        <button
          type="button"
          onClick={runRefresh}
          className="rounded-xl bg-cta-gradient px-4 py-3 font-headline text-sm font-bold text-white shadow-glow"
        >
          Refresh deals
        </button>
        <button
          type="button"
          onClick={exportSummary}
          className="rounded-xl bg-surface-top px-4 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
        >
          Export deal snapshot
        </button>
        <button
          type="button"
          onClick={openRanking}
          className="rounded-xl bg-surface-top px-4 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
        >
          Copy ranking model
        </button>
      </div>
      <div className="text-sm font-medium text-muted">{status}</div>
    </div>
  );
}
