"use client";

import { useEffect, useState } from "react";

type TelegramChannel = {
  id: number;
  url: string;
  handle: string | null;
  access: string;
  marketplaceFocus: string[];
};

type TelegramSummary = {
  refreshWindowHours: number;
  totalChannels: number;
  accessibleNow: number;
  blockedPendingAccess: number;
  addlistsPendingExpansion: number;
  accessibleChannels: TelegramChannel[];
  blockedChannels: TelegramChannel[];
  addlists: TelegramChannel[];
};

export function TelegramSourceHealth() {
  const [data, setData] = useState<TelegramSummary | null>(null);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/ingestion/telegram");
      const result = (await response.json()) as TelegramSummary;
      setData(result);
    }

    load().catch(() => setData(null));
  }, []);

  if (!data) {
    return null;
  }

  return (
    <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Source Coverage</p>
      <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
        Telegram coverage inside the wider deal-discovery system
      </h3>
      <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
        Telegram is only one of the internet sources we can use. The end goal is to show users the best
        public deals available so they can convert the strongest earning opportunities first.
      </p>
      <div className="mt-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-[1.25rem] bg-surface-low px-4 py-4">
          <p className="text-sm text-muted">Total channels</p>
          <p className="mt-2 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
            {data.totalChannels}
          </p>
        </div>
        <div className="rounded-[1.25rem] bg-surface-low px-4 py-4">
          <p className="text-sm text-muted">Public and usable now</p>
          <p className="mt-2 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
            {data.accessibleNow}
          </p>
        </div>
        <div className="rounded-[1.25rem] bg-surface-low px-4 py-4">
          <p className="text-sm text-muted">Need access or expansion</p>
          <p className="mt-2 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
            {data.blockedPendingAccess + data.addlistsPendingExpansion}
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-3">
        <div className="rounded-[1.25rem] bg-surface-low p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Ready now</p>
          <div className="mt-4 space-y-2">
            {data.accessibleChannels.map((channel) => (
              <div key={channel.id} className="rounded-xl bg-surface-card px-3 py-3 text-sm text-text">
                @{channel.handle}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-surface-low p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Need private access</p>
          <div className="mt-4 space-y-2">
            {data.blockedChannels.slice(0, 8).map((channel) => (
              <div key={channel.id} className="rounded-xl bg-surface-card px-3 py-3 text-sm text-text">
                Source #{channel.id}
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[1.25rem] bg-surface-low p-4">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Addlists to expand</p>
          <div className="mt-4 space-y-2">
            {data.addlists.map((channel) => (
              <div key={channel.id} className="rounded-xl bg-surface-card px-3 py-3 text-sm text-text">
                Addlist #{channel.id}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
