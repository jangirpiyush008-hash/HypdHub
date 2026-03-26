"use client";

import Link from "next/link";
import { DealsBrowser } from "@/components/deals-browser";
import { DealCard } from "@/components/deal-card";
import { useCreatorAuth } from "@/components/auth-provider";
import { deals } from "@/data/mock";

export function DealsExperience() {
  const { isAuthenticated } = useCreatorAuth();

  if (isAuthenticated) {
    return <DealsBrowser />;
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Deals Preview</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Preview a few deals before login
        </h3>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
          Only a limited preview is public. Login with a HYPD-registered mobile number and OTP to unlock
          the full feed, filters, converter, dashboard, and connect pages.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-cta-gradient px-6 py-4 text-center font-headline text-sm font-bold text-white shadow-glow"
          >
            Login to unlock full access
          </Link>
          <div className="rounded-xl bg-surface-top px-6 py-4 text-center font-headline text-sm font-bold text-text">
            Showing {Math.min(4, deals.length)} preview deals
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {deals.slice(0, 4).map((deal) => (
          <DealCard key={deal.id} deal={deal} compact />
        ))}
      </section>
    </div>
  );
}
