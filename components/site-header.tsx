"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCreatorAuth } from "@/components/auth-provider";
import { ThemeToggle } from "@/components/theme-toggle";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/deals", label: "Deals" }
];

const privateLinks = [
  { href: "/deals", label: "Deals" },
  { href: "/converter", label: "Converter" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connect", label: "Automate" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, creator, logout } = useCreatorAuth();
  const links = isAuthenticated ? privateLinks : publicLinks;

  return (
    <header className="glass-panel fixed inset-x-0 top-0 z-50 border-b border-outline/20">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={isAuthenticated ? "/deals" : "/"}
          className="font-headline text-xl font-black tracking-tight"
        >
          <span className="hypd-gradient-text">HYPD</span>
          <span className="text-text/60"> Hub</span>
        </Link>

        <nav className="hidden items-center gap-1 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-lg px-3 py-1.5 font-headline text-sm font-semibold transition-colors ${
                  active
                    ? "bg-primary/10 text-primary"
                    : "text-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {isAuthenticated ? (
            <span className="hidden rounded-lg bg-surface-high px-3 py-1.5 text-xs font-bold text-text sm:block">
              @{creator?.hypdUsername ?? "creator"}
            </span>
          ) : null}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-lg bg-surface-high px-4 py-1.5 font-headline text-xs font-bold text-text transition-colors hover:bg-surface-bright active:scale-95"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-lg bg-cta-gradient px-4 py-1.5 font-headline text-xs font-bold text-white shadow-glow transition-transform active:scale-95"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
