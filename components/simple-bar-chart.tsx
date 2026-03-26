import { dashboardActivity } from "@/data/mock";

export function SimpleBarChart() {
  const maxValue = Math.max(...dashboardActivity.map((item) => item.pushed));

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
          Platform activity
        </h3>
        <div className="flex gap-3 text-xs font-bold uppercase tracking-[0.24em] text-muted">
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-primary" />
            Pushed deals
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
            WhatsApp
          </span>
          <span className="inline-flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-sky-400" />
            Telegram
          </span>
        </div>
      </div>

      <div className="grid grid-cols-10 items-end gap-3">
        {dashboardActivity.map((item) => (
          <div key={item.day} className="space-y-2">
            <div className="flex h-48 items-end justify-center gap-1 rounded-[1.25rem] bg-surface-low px-2 py-3">
              <div
                className="w-2 rounded-full bg-emerald-400/80"
                style={{ height: `${(item.whatsapp / maxValue) * 100}%` }}
              />
              <div
                className="w-2 rounded-full bg-sky-400/80"
                style={{ height: `${(item.telegram / maxValue) * 100}%` }}
              />
              <div
                className="w-2 rounded-full bg-cta-gradient"
                style={{ height: `${(item.pushed / maxValue) * 100}%` }}
              />
            </div>
            <p className="text-center text-[10px] font-bold uppercase tracking-[0.18em] text-muted">
              {item.day}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
