import Link from "next/link";

export function LockedDealsPreview() {
  return (
    <section className="space-y-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Public Preview</p>
          <h2 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
            Live deals stay public, creator tools stay locked
          </h2>
          <p className="mt-3 max-w-2xl text-base leading-7 text-muted">
            This public view only shows the live marketplace boards. Login unlocks the full feed, converter,
            dashboard, and connected workflow controls.
          </p>
        </div>
        <Link
          href="/dashboard"
          className="hidden rounded-xl bg-surface-top px-4 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright sm:inline-flex"
        >
          Creator dashboard
        </Link>
      </div>
    </section>
  );
}
