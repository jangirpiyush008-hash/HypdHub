import { DealsExperience } from "@/components/deals-experience";
import { SectionHeading } from "@/components/section-heading";

export default function DealsPage() {
  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <SectionHeading
          title="Curated Deals"
          description="Browse today’s top candidates by marketplace and category. Before login, visitors see only a small preview. HYPD users unlock the full feed after OTP login."
        />
      </section>
      <DealsExperience />
    </div>
  );
}
