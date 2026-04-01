import { ConnectGrid } from "@/components/connect-grid";
import { ProtectedAppShell } from "@/components/protected-app-shell";
import { SectionHeading } from "@/components/section-heading";

export default function ConnectPage() {
  return (
    <ProtectedAppShell>
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Distribution"
          title="Telegram Automation"
          description="Set source, destination, and run."
        />
        <ConnectGrid />
      </div>
    </ProtectedAppShell>
  );
}
