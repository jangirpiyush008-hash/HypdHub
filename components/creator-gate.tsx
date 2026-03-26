"use client";

import Link from "next/link";
import { useCreatorAuth } from "@/components/auth-provider";

export function CreatorGate({
  title,
  description,
  children
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { isAuthenticated } = useCreatorAuth();

  if (isAuthenticated) {
    return <>{children}</>;
  }

  return (
    <section className="rounded-[2rem] bg-surface-card p-8 shadow-ambient">
      <div className="max-w-2xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Creator Access</p>
        <h2 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.05em] text-text">
          {title}
        </h2>
        <p className="mt-4 text-base leading-7 text-muted">{description}</p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login"
            className="rounded-xl bg-cta-gradient px-6 py-4 font-headline text-sm font-bold text-white shadow-glow transition-transform active:scale-[0.98]"
          >
            Login with HYPD OTP
          </Link>
          <Link
            href="/"
            className="rounded-xl bg-surface-top px-6 py-4 text-center font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
          >
            Go back home
          </Link>
        </div>
      </div>
    </section>
  );
}
