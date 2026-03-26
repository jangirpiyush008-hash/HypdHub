import { Deal, sourceBadges } from "@/data/mock";
import { ConvertLinkButton } from "@/components/convert-link-button";
import { DealThumb } from "@/components/deal-thumb";

function getDiscount(price: number, originalPrice: number) {
  return Math.round(((originalPrice - price) / originalPrice) * 100);
}

export function DealCard({
  deal,
  compact = false
}: {
  deal: Deal;
  compact?: boolean;
}) {
  const discount = getDiscount(deal.price, deal.originalPrice);

  return (
    <article className="card-hover overflow-hidden rounded-[1.35rem] bg-surface-card shadow-ambient">
      <div className={compact ? "h-40" : "h-56"}>
        <DealThumb name={deal.productName} category={deal.category} thumbClass={deal.thumbClass} />
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] text-primary">
                {deal.demand}
              </span>
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.24em] ${sourceBadges[deal.source]}`}
              >
                {deal.source}
              </span>
            </div>
            <h3 className="font-headline text-lg font-extrabold tracking-[-0.03em] text-text">
              {deal.productName}
            </h3>
            <p className="mt-1 text-sm text-muted">
              {deal.category}
              {deal.rating ? ` • ${deal.rating.toFixed(1)} rating` : ""}
            </p>
          </div>
          <div className="rounded-2xl bg-surface-top px-3 py-2 text-right">
            <div className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{discount}% off</div>
            <div className="text-sm text-muted line-through">₹{deal.originalPrice.toLocaleString("en-IN")}</div>
          </div>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
              ₹{deal.price.toLocaleString("en-IN")}
            </div>
            <p className="text-xs uppercase tracking-[0.22em] text-muted">
              {deal.soldCount ? `${deal.soldCount.toLocaleString("en-IN")} sold / ranked deal` : "Daily deal candidate"}
            </p>
          </div>
          <ConvertLinkButton originalUrl={deal.url} variant={compact ? "secondary" : "primary"} />
        </div>
      </div>
    </article>
  );
}
