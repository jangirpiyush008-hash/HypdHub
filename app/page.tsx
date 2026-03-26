import Link from "next/link";
import { AuthenticatedHomeRedirect } from "@/components/authenticated-home-redirect";
import { ArrowRightIcon, SparklesIcon } from "@/components/icons";

const pillars = [
  {
    title: "Discover strong products",
    body: "Track daily marketplace deals, shortlist creator-friendly products, and keep one clean operating view for HYPD campaigns."
  },
  {
    title: "Convert into HYPD links",
    body: "Give creators a simple path to turn raw store URLs into trackable HYPD affiliate links without leaving the workspace."
  },
  {
    title: "Distribute everywhere",
    body: "Prepare Telegram and WhatsApp publishing flows so the same top deals can be delivered across both channels with consistent copy."
  }
];

const features = [
  "Daily deal review and ranking workflow",
  "HYPD-friendly affiliate link conversion",
  "Telegram and WhatsApp bot connection guides",
  "Dashboard views for filters, pushes, bots, and social accounts"
];

const audiences = [
  {
    title: "For creators",
    body: "Find high-potential products faster, convert links, and run a repeatable posting system."
  },
  {
    title: "For operations teams",
    body: "Monitor queues, manual pushes, channel activity, and configuration without jumping across tools."
  },
  {
    title: "For scaling",
    body: "Turn the workflow into a repeatable automation loop for sourcing, ranking, formatting, and publishing deals."
  }
];

export default function HomePage() {
  return (
    <div className="space-y-20 pb-8">
      <AuthenticatedHomeRedirect />
      <section className="grid gap-8 pt-4 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pt-10">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
            <SparklesIcon className="h-4 w-4" />
            About HYPD Deal Hub
          </div>
          <h1 className="mt-6 font-headline text-5xl font-extrabold leading-none tracking-[-0.06em] text-text sm:text-6xl lg:text-7xl">
            The HYPD workspace for discovering, converting, and distributing daily deals.
          </h1>
          <p className="mt-6 max-w-2xl text-base leading-8 text-muted sm:text-lg">
            HYPD Deal Hub is a creator-first control center built to help teams find strong products,
            generate HYPD-ready affiliate links, and run Telegram plus WhatsApp deal flows from one place.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link
              href="/deals"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-cta-gradient px-6 py-4 font-headline text-sm font-bold text-white shadow-glow transition-transform active:scale-[0.98]"
            >
              Explore deals
              <ArrowRightIcon className="h-4 w-4" />
            </Link>
            <Link
              href="/connect"
              className="inline-flex items-center justify-center rounded-xl bg-surface-card px-6 py-4 font-headline text-sm font-bold text-text shadow-ambient transition-colors hover:bg-surface-top"
            >
              View setup tutorials
            </Link>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="rounded-[2rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.22),rgba(138,35,135,0.32))] p-7 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Mission</p>
            <h2 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
              Help creators earn daily from better deal distribution.
            </h2>
            <p className="mt-4 text-sm leading-7 text-text/85">
              The product combines deal curation, HYPD link generation, channel publishing, and automation
              planning so creators can move faster with less manual work.
            </p>
          </div>

          <div className="rounded-[2rem] bg-surface-card p-7 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">What it includes</p>
            <div className="mt-5 grid gap-3">
              {features.map((feature) => (
                <div key={feature} className="rounded-[1.2rem] bg-surface-low px-4 py-4 text-sm text-text">
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-3">
        {pillars.map((pillar, index) => (
          <article key={pillar.title} className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
            <p className="font-headline text-6xl font-extrabold leading-none tracking-[-0.06em] text-primary/15">
              0{index + 1}
            </p>
            <h2 className="mt-5 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
              {pillar.title}
            </h2>
            <p className="mt-3 text-sm leading-7 text-muted">{pillar.body}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Why this product exists</p>
          <h2 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
            HYPD Deal Hub turns a scattered process into one operating system.
          </h2>
          <p className="mt-4 text-sm leading-7 text-muted">
            Normally, creators move between marketplaces, copy links manually, draft captions in chat apps,
            and manage bots separately. This hub brings sourcing, conversion, and publishing together so the
            workflow is easier to manage and easier to automate.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/dashboard"
              className="rounded-xl bg-surface-top px-4 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
            >
              Open dashboard
            </Link>
            <Link
              href="/converter"
              className="rounded-xl bg-surface-top px-4 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
            >
              Open converter
            </Link>
          </div>
        </div>

        <div className="grid gap-5">
          {audiences.map((audience) => (
            <article key={audience.title} className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{audience.title}</p>
              <p className="mt-3 text-sm leading-7 text-muted">{audience.body}</p>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}
