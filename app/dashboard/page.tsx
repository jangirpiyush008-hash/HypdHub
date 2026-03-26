import { DashboardOverview } from "@/components/dashboard-overview";
import { ProtectedAppShell } from "@/components/protected-app-shell";
import { SectionHeading } from "@/components/section-heading";

export default function DashboardPage() {
  return (
    <ProtectedAppShell>
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Creator view"
          title="Dashboard"
          description="A more operational dashboard with platform activity, store mix, conversion history, and the HYPD-managed push layer."
        />
        <DashboardOverview />
      </div>
    </ProtectedAppShell>
  );
}
