"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useCreatorAuth } from "@/components/auth-provider";

export function ProtectedAppShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isReady } = useCreatorAuth();

  useEffect(() => {
    if (isReady && !isAuthenticated) {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isReady, pathname, router]);

  if (!isReady || !isAuthenticated) {
    return (
      <section className="rounded-[2rem] bg-surface-card p-8 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">HYPD Access</p>
        <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Redirecting to login
        </h2>
        <p className="mt-4 text-base leading-7 text-muted">
          Converter, dashboard, and connect pages are available only after OTP login with a registered
          HYPD mobile number.
        </p>
      </section>
    );
  }

  return <>{children}</>;
}
