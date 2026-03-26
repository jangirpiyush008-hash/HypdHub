const pipeline = [
  { title: "Source deals", body: "Collect from HYPD API and supported marketplace pages.", status: "Running" },
  { title: "Rank top picks", body: "Apply discount, sold count, popularity, and manual priority rules.", status: "Ready" },
  { title: "Push to creators", body: "Send selected deals to dashboard, Telegram, and WhatsApp flows.", status: "Queued" }
];

export function DashboardPipeline() {
  return (
    <div className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Workflow pipeline</p>
          <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
            Daily deal operations
          </h3>
        </div>
        <div className="rounded-xl bg-surface-top px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-text">
          March 2026
        </div>
      </div>

      <div className="mt-6 grid gap-4 md:grid-cols-3">
        {pipeline.map((item, index) => (
          <div key={item.title} className="rounded-[1.25rem] bg-surface-low p-5">
            <p className="font-headline text-4xl font-extrabold tracking-[-0.05em] text-primary/25">
              0{index + 1}
            </p>
            <h4 className="mt-3 font-headline text-xl font-bold tracking-[-0.03em] text-text">
              {item.title}
            </h4>
            <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
            <span className="mt-4 inline-flex rounded-full bg-primary/15 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
              {item.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
