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
  { href: "/connect", label: "Automate", icon: BotIcon }
];

export function BottomNav() {
  const pathname = usePathname();
  const { isAuthenticated } = useCreatorAuth();
  const items = isAuthenticated ? privateItems : publicItems;

  return (
    <nav className="glass-panel fixed inset-x-0 bottom-0 z-50 border-t border-outline/20 px-4 pb-6 pt-2 md:hidden">
      <div className="mx-auto flex max-w-xl items-center justify-around">
        {items.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-0.5 rounded-lg px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider transition-colors ${
                active
                  ? "text-primary"
                  : "text-muted/60 hover:text-text"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
