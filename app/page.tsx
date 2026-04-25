import Link from "next/link";
import { AuthenticatedHomeRedirect } from "@/components/authenticated-home-redirect";
import { HomeDealsPreview } from "@/components/home-marketplace-preview";

const features = [
  {
    title: "Discover Deals",
    body: "Live deals scraped from HYPD storefront, Telegram channels, and top marketplaces — ranked by discount, traffic, and freshness.",
    icon: "🔥"
  },
  {
    title: "Convert Links",
    body: "Paste any product URL and get your HYPD affiliate link instantly. Bulk convert via CSV upload and download.",
    icon: "🔗"
  },
  {
    title: "Automate Distribution",
    body: "Set up Telegram bots to auto-pick deals, convert links, and post to your channels on schedule.",
    icon: "⚡"
  },
  {
    title: "Track Everything",
    body: "Dashboard with real-time stats — commissions, clicks, orders, and pipeline health from HYPD APIs.",
    icon: "📊"
  }
];

const stats = [
  { value: "6+", label: "Marketplaces" },
  { value: "34+", label: "Telegram Channels" },
  { value: "Real-time", label: "Deal Scraping" },
  { value: "2hr", label: "Auto Refresh" }
];

export default function HomePage() {
  return (
    <div className="space-y-16 pb-8">
      <AuthenticatedHomeRedirect />

      {/* Hero */}
      <section className="pt-8 lg:pt-16">
        <div className="max-w-3xl">
          <h1 className="font-headline text-4xl font-black leading-[1.1] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="hypd-gradient-text">Best deals.</span>
            <br />
            <span className="text-text">Your HYPD links.</span>
            <br />
            <span className="text-muted">Everywhere.</span>
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-muted">
            HYPD Hub scrapes the best deals from marketplaces and Telegram, converts them to your
            affiliate links, and helps you distribute across channels — all from one place.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/deals"
              className="rounded-lg bg-cta-gradient px-6 py-3 font-headline text-sm font-bold text-white shadow-glow transition-transform active:scale-[0.98]"
            >
              Explore Deals
            </Link>
            <Link
              href="/login"
              className="rounded-lg bg-surface-card px-6 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-high"
            >
              Login with HYPD
            </Link>
          </div>
        </div>

        {/* Stats row */}
        <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="rounded-xl bg-surface-card p-4">
              <p className="font-headline text-2xl font-black tracking-tight text-primary">{stat.value}</p>
              <p className="mt-1 text-xs font-medium text-muted">{stat.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section>
        <h2 className="font-headline text-2xl font-bold tracking-tight text-text">How it works</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {features.map((feature) => (
            <div key={feature.title} className="rounded-xl bg-surface-card p-5">
              <span className="text-2xl">{feature.icon}</span>
              <h3 className="mt-3 font-headline text-lg font-bold text-text">{feature.title}</h3>
              <p className="mt-2 text-sm leading-6 text-muted">{feature.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Live deals preview */}
      <section>
        <div className="flex items-end justify-between gap-4">
          <div>
            <h2 className="font-headline text-2xl font-bold tracking-tight text-text">Trending Deals</h2>
            <p className="mt-1 text-sm text-muted">Live from HYPD storefront and marketplaces</p>
          </div>
          <Link
            href="/deals"
            className="text-sm font-semibold text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="mt-6">
          <HomeDealsPreview />
        </div>
      </section>

      {/* CTA */}
      <section className="rounded-xl bg-cta-gradient p-8 text-center">
        <h2 className="font-headline text-2xl font-bold text-white sm:text-3xl">
          Ready to earn from the best deals?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-sm text-white/80">
          Login with your HYPD credentials and start converting, distributing, and tracking deals today.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-white px-6 py-3 font-headline text-sm font-bold text-gray-900 transition-transform active:scale-[0.98]"
        >
          Get Started
        </Link>
      </section>
    </div>
  );
}
