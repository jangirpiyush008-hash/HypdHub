"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCreatorAuth } from "@/components/auth-provider";
import { SearchIcon } from "@/components/icons";
import { ThemeToggle } from "@/components/theme-toggle";

const publicLinks = [
  { href: "/", label: "Home" },
  { href: "/deals", label: "Deals" }
];

const privateLinks = [
  { href: "/deals", label: "Deals" },
  { href: "/converter", label: "Converter" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/connect", label: "Connect" }
];

export function SiteHeader() {
  const pathname = usePathname();
  const { isAuthenticated, creator, logout } = useCreatorAuth();
  const links = isAuthenticated ? privateLinks : publicLinks;

  return (
    <header className="glass-panel fixed inset-x-0 top-0 z-50 border-b border-outline/30 shadow-ambient">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href={isAuthenticated ? "/deals" : "/"}
          className="font-headline text-xl font-extrabold tracking-[-0.04em] text-transparent bg-cta-gradient bg-clip-text sm:text-2xl"
        >
          HYPD Hub
        </Link>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`font-headline text-sm font-bold tracking-tight transition-colors ${
                  active ? "text-primary" : "text-muted hover:text-text"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-3">
          <button
            type="button"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-surface-top text-muted transition-colors hover:bg-surface-bright hover:text-text"
            aria-label="Search"
          >
            <SearchIcon className="h-4 w-4" />
          </button>
          <div className="hidden sm:block">
            <ThemeToggle />
          </div>
          {isAuthenticated ? (
            <div className="hidden rounded-xl bg-surface-top px-3 py-2 text-xs font-semibold text-text sm:block">
              @{creator?.hypdUsername ?? "creator"}
            </div>
          ) : null}
          {isAuthenticated ? (
            <button
              type="button"
              onClick={() => void logout()}
              className="rounded-xl bg-cta-gradient px-4 py-2 font-headline text-xs font-bold text-white shadow-glow transition-transform active:scale-95 sm:px-5"
            >
              Logout
            </button>
          ) : (
            <Link
              href="/login"
              className="rounded-xl bg-cta-gradient px-4 py-2 font-headline text-xs font-bold text-white shadow-glow transition-transform active:scale-95 sm:px-5"
            >
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
