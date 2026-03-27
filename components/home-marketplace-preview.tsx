"use client";

import Link from "next/link";
import { MarketplaceTopDeals } from "@/components/marketplace-top-deals";

export function HomeMarketplacePreview() {
  return (
    <section className="space-y-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-3xl">
          <p className="text-xs font-bold uppercase tracking-[0.32em] text-primary">
            Marketplace Preview
          </p>
          <h2 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text sm:text-4xl">
            Live marketplace boards update from the real pipeline
          </h2>
          <p className="mt-3 text-base leading-7 text-muted">
            This section no longer uses seeded examples. It reflects only the live deals currently collected
            from connected sources.
          </p>
        </div>
        <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.12),rgba(138,35,135,0.18))] px-5 py-4 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Live only</p>
          <p className="mt-2 text-sm leading-6 text-text">
            Empty marketplaces stay empty until live deals arrive.
          </p>
        </div>
      </div>
      <MarketplaceTopDeals />

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
