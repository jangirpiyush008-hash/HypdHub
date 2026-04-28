import { DealsExperience } from "@/components/deals-experience";

export default function DealsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-headline text-2xl font-bold tracking-tight text-text">Deals</h1>
        <p className="mt-1 text-sm text-muted">Live deals across Indian marketplaces. Login unlocks the full feed and creator tools.</p>
      </div>
      <DealsExperience />
    </div>
  );
}
