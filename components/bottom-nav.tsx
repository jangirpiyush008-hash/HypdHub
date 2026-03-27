"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BotIcon, DashboardIcon, LinkIcon, LightningIcon, SparklesIcon } from "@/components/icons";
import { useCreatorAuth } from "@/components/auth-provider";

const publicItems = [
  { href: "/", label: "Home", icon: SparklesIcon },
  { href: "/deals", label: "Deals", icon: LightningIcon }
];

const privateItems = [
  { href: "/deals", label: "Deals", icon: LightningIcon },
  { href: "/converter", label: "Convert", icon: LinkIcon },
  { href: "/dashboard", label: "Stats", icon: DashboardIcon },
  { href: "/connect", label: "Connect", icon: BotIcon }
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useCreatorAuth();
  const items = isAuthenticated ? privateItems : publicItems;

  return (
    <nav className="glass-panel fixed inset-x-0 bottom-0 z-50 border-t border-outline/30 px-4 pb-6 pt-3 md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around gap-1">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex min-w-16 flex-col items-center rounded-xl px-3 py-2 text-[10px] font-semibold uppercase tracking-[0.24em] transition-all ${
                active
                  ? "scale-105 bg-cta-gradient text-white shadow-glow"
                  : "text-muted/70 hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span className="mt-1">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
