import { topStoreMix } from "@/data/mock";

export function StoreMix() {
  const total = topStoreMix.reduce((sum, item) => sum + item.share, 0);

  return (
    <div className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Top stores</p>
      <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
        Monthly store mix
      </h3>
      <div className="mt-6 flex items-center justify-center">
        <div className="relative flex h-52 w-52 items-center justify-center rounded-full bg-[conic-gradient(#ffabf3_0_34%,#7dd3fc_34%_52%,#f59e0b_52%_66%,#f472b6_66%_78%,#818cf8_78%_89%,#34d399_89%_100%)] p-6">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-surface-card">
            <div className="text-center">
              <div className="font-headline text-4xl font-extrabold tracking-[-0.05em] text-text">
                {total}%
              </div>
              <p className="text-xs uppercase tracking-[0.24em] text-muted">Tracked mix</p>
            </div>
          </div>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {topStoreMix.map((store) => (
          <div key={store.label} className="flex items-center justify-between rounded-xl bg-surface-low px-4 py-3">
            <p className="text-sm text-text">{store.label}</p>
            <p className="font-headline text-lg font-bold tracking-[-0.03em] text-primary">
              {store.share}%
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
