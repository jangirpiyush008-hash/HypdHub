import { DealsExperience } from "@/components/deals-experience";
import { SectionHeading } from "@/components/section-heading";

export default function DealsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <SectionHeading
          title="Curated Deals"
          description="Browse live deals across marketplaces and HYPD-ready conversion opportunities. Login unlocks the full feed, filters, and creator tools."
        />
      </section>
      <DealsExperience />
    </div>
  );
}
