import { ConvertLinkButton } from "@/components/convert-link-button";
import { DealThumb } from "@/components/deal-thumb";
import { InternetDeal } from "@/lib/types";

const sourceBadges: Record<InternetDeal["marketplace"], string> = {
  Meesho: "bg-fuchsia-300/20 text-fuchsia-200",
  Ajio: "bg-pink-300/20 text-pink-200",
  Flipkart: "bg-sky-300/20 text-sky-200",
  Myntra: "bg-primary/20 text-primary",
  Nykaa: "bg-rose-300/20 text-rose-200",
  Shopsy: "bg-emerald-300/20 text-emerald-200",
  HYPD: "bg-primary/20 text-primary"
};

const thumbGradients: Record<InternetDeal["marketplace"], string> = {
  Meesho: "from-fuchsia-500 via-purple-500 to-pink-500",
  Ajio: "from-pink-400 via-fuchsia-400 to-violet-500",
  Flipkart: "from-sky-400 via-cyan-400 to-blue-500",
  Myntra: "from-primary via-fuchsia-400 to-violet-500",
  Nykaa: "from-rose-400 via-pink-400 to-orange-300",
  Shopsy: "from-emerald-400 via-lime-400 to-green-500",
  HYPD: "from-primary via-rose-400 to-fuchsia-500"
};

function getDiscount(price: number | null, originalPrice: number | null) {
  if (!price || !originalPrice || originalPrice <= price) return 0;
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function DealCard({
  deal,
  compact = false
}: {
  deal: InternetDeal;
  compact?: boolean;
}) {
  const discount = getDiscount(deal.currentPrice, deal.originalPrice);

  return (
    <article className="card-hover overflow-hidden rounded-[1.35rem] bg-surface-card shadow-ambient">
      <div className={compact ? "h-40" : "h-56"}>
        <DealThumb name={deal.title} category={deal.category} thumbClass={thumbGradients[deal.marketplace]} />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                {deal.validationStatus ?? "live"}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${sourceBadges[deal.marketplace]}`}
              >
                {deal.marketplace}
              </span>
            </div>
            <h3 className="font-headline text-lg font-extrabold tracking-[-0.03em] text-text">
              {deal.title}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {deal.category}
              {deal.channelsCount ? ` • ${deal.channelsCount} channels` : ""}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-top px-3 py-2 text-right">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
              {discount ? `${discount}% off` : "Tracked"}
            </div>
            <div className="text-sm text-muted">
              {deal.originalPrice ? `₹${deal.originalPrice.toLocaleString("en-IN")}` : "No MRP"}
            </div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
              {deal.currentPrice ? `₹${deal.currentPrice.toLocaleString("en-IN")}` : "Price unavailable"}
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              {deal.mentionsCount ? `${deal.mentionsCount} mentions / ranked deal` : "Live deal candidate"}
            </p>
          </div>
          <ConvertLinkButton originalUrl={deal.originalUrl} variant={compact ? "secondary" : "primary"} />
        </div>
      </div>
    </article>
  );
}
