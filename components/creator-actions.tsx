"use client";

import Link from "next/link";
import { useCreatorAuth } from "@/components/auth-provider";

export function CreatorActions() {
  const { isAuthenticated, creator } = useCreatorAuth();

  if (isAuthenticated) {
    return (
      <div className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Creator unlocked</p>
        <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
          Welcome, {creator?.name}
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted">
          Full deal discovery, conversion tools, and distribution controls are now available from the
          dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/dashboard"
            className="rounded-xl bg-cta-gradient px-5 py-3 text-center font-headline text-sm font-bold text-white shadow-glow"
          >
            Open Creator Dashboard
          </Link>
          <Link
            href="/deals"
            className="rounded-xl bg-surface-top px-5 py-3 text-center font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
          >
            View Full Deal Feed
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Creator login required</p>
      <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
        Public users only see preview deals
      </h3>
      <p className="mt-3 text-sm leading-7 text-muted">
        Full marketplace feed, filters, link conversion, and automation controls open only after creator
        login.
      </p>
      <Link
        href="/login"
        className="mt-6 rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow transition-transform active:scale-[0.98]"
      >
        Login with HYPD OTP
      </Link>
    </div>
  );
}
