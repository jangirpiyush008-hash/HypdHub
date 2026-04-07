import { DealsExperience } from "@/components/deals-experience";

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-text">Deals</h1>
        <p className="mt-1 text-sm text-muted">Live deals from HYPD, marketplaces, and Telegram. Login unlocks full feed and tools.</p>
      </div>
      <DealsExperience />
    </div>
  );
}
