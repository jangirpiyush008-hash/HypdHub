import { DashboardOverview } from "@/components/dashboard-overview";
import { ProtectedAppShell } from "@/components/protected-app-shell";

export default function DashboardPage() {
  return (
    <ProtectedAppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-text">Dashboard</h1>
          <p className="mt-1 text-sm text-muted">Real-time stats, pipeline, and automation tracking.</p>
        </div>
        <DashboardOverview />
      </div>
    </ProtectedAppShell>
  );
}
