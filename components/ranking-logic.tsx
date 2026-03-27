const rankingSignals = [
  {
    title: "Telegram frequency",
    body: "Deals mentioned across multiple readable channels are surfaced higher because they have stronger public momentum."
  },
  {
    title: "Freshness",
    body: "Recently seen links get more weight so users see the latest active deals first instead of stale inventory."
  },
  {
    title: "Validation confidence",
    body: "Marketplace checks, stock signals, and history depth improve confidence when those live signals are available."
  }
];

export function RankingLogic() {
  return (
    <section className="grid gap-5 lg:grid-cols-[1fr_1fr_1fr]">
      {rankingSignals.map((signal) => (
        <article key={signal.title} className="rounded-[1.6rem] bg-surface-card p-6 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{signal.title}</p>
          <p className="mt-4 text-sm leading-7 text-muted">{signal.body}</p>
        </article>
      ))}
    </section>
  );
}
