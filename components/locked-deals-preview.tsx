import Link from "next/link";
import { deals } from "@/data/mock";
import { DealCard } from "@/components/deal-card";

export function LockedDealsPreview() {
  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Public Preview</p>
          <h2 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
            Preview a few live deals before creator login
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            The homepage stays curated and lightweight. Full deal discovery, ranking filters, and conversion
            actions open after creator login.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="hidden rounded-xl bg-surface-top px-4 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright sm:inline-flex"
        >
          Creator dashboard
        </Link>
      </div>

      <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {deals.slice(0, 3).map((deal) => (
          <DealCard key={deal.id} deal={deal} compact />
        ))}
      </div>
    </section>
  );
}
