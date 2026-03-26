"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { DealCard } from "@/components/deal-card";
import { homepageMarketplaces, deals } from "@/data/mock";

export function HomeMarketplacePreview() {
  const [activeMarketplace, setActiveMarketplace] = useState("HYPD");

  const activePreview = useMemo(() => {
    const preview = homepageMarketplaces.find((item) => item.name === activeMarketplace);
    const deal = deals.find((item) => item.id === preview?.dealId);
    if (!preview || !deal) return null;
    return { preview, deal };
  }, [activeMarketplace]);

  if (!activePreview) return null;

  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">
            Marketplace Preview
          </p>
          <h2 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text sm:text-4xl">
            Pick one marketplace tab to preview its best deal
          </h2>
          <p className="mt-3 text-base leading-7 text-muted">
            The home page should feel focused, so only one marketplace deal is shown at a time. HYPD
            Store stays first in the tab order because that is the managed source.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.12),rgba(138,35,135,0.18))] px-5 py-4 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Conversion rule</p>
          <p className="mt-2 text-sm leading-6 text-text">
            Only logged-in HYPD creators convert and save links here.
          </p>
        </div>
      </div>

      <div className="hide-scrollbar flex gap-2 overflow-x-auto pb-1">
        {homepageMarketplaces.map((marketplace) => {
          const selected = marketplace.name === activeMarketplace;
          return (
            <button
              key={marketplace.name}
              type="button"
              onClick={() => setActiveMarketplace(marketplace.name)}
              className={`rounded-full px-5 py-2 font-headline text-[11px] font-bold uppercase tracking-[0.24em] transition-all ${
                selected
                  ? "bg-cta-gradient text-white shadow-glow"
                  : "bg-surface-top text-text hover:bg-surface-bright"
              }`}
            >
              {marketplace.label}
            </button>
          );
        })}
      </div>

      <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
        <div className="rounded-[1.6rem] bg-surface-card p-6 shadow-ambient">
          <div className="flex items-center justify-between gap-3">
            <p className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
              {activePreview.preview.label}
            </p>
            <span className="rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              {activePreview.preview.name === "HYPD" ? "Priority" : "Selected"}
            </span>
          </div>
          <p className="mt-5 text-sm leading-7 text-text">{activePreview.preview.reason}</p>
          <div className="mt-5 rounded-[1.25rem] bg-surface-low p-4">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Why this is top</p>
            <p className="mt-3 text-sm leading-7 text-muted">{activePreview.preview.note}</p>
          </div>
          <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            <div className="rounded-[1.1rem] bg-surface-top px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Ranking inputs</p>
              <p className="mt-2 text-sm text-text">Discount, popularity, price advantage, and rating.</p>
            </div>
            <div className="rounded-[1.1rem] bg-surface-top px-4 py-4">
              <p className="text-xs uppercase tracking-[0.24em] text-muted">HYPD team control</p>
              <p className="mt-2 text-sm text-text">API ranking for HYPD plus manual boost or push control.</p>
            </div>
          </div>
        </div>

        <DealCard deal={activePreview.deal} />
      </div>

      <div className="flex justify-center">
        <Link
          href="/deals"
          className="rounded-xl bg-surface-top px-5 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
        >
          Open full marketplace feed
        </Link>
      </div>
    </section>
  );
}
