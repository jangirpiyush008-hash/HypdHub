"use client";

const items = [
  { key: "dashboard", label: "Dashboard" },
  { key: "topDealsQueue", label: "Top Deals Queue" },
  { key: "manualPushes", label: "Manual Pushes" },
  { key: "telegramFlow", label: "Telegram Automation" },
  { key: "whatsAppFlow", label: "WhatsApp Automation" },
  { key: "filters", label: "Filters" },
  { key: "botSettings", label: "Bot Settings" },
  { key: "socialAccounts", label: "Automation Summary" }
];

export function DashboardSidePanel({
  activeKey,
  onSelect
}: {
  activeKey: string;
  onSelect: (key: string) => void;
}) {
  return (
    <aside className="rounded-[1.75rem] bg-surface-card p-5 shadow-ambient">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Main</p>
      <div className="mt-4 space-y-2">
        {items.map((item) => {
          const active = activeKey === item.key;
          return (
          <button
            key={item.label}
            type="button"
            onClick={() => onSelect(item.key)}
            className={`flex w-full items-center justify-between rounded-xl px-4 py-3 text-left transition-colors ${
              active ? "bg-surface-top text-text" : "text-muted hover:bg-surface-top hover:text-text"
            }`}
          >
            <span className="font-headline text-sm font-bold tracking-[-0.02em]">{item.label}</span>
            <span className="text-xs uppercase tracking-[0.24em]">{active ? "Live" : ""}</span>
          </button>
          );
        })}
      </div>
    </aside>
  );
}
