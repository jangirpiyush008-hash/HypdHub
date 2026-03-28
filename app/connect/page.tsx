import { ConnectGrid } from "@/components/connect-grid";
import { ProtectedAppShell } from "@/components/protected-app-shell";
import { SectionHeading } from "@/components/section-heading";

export default function ConnectPage() {
  return (
    <ProtectedAppShell>
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Distribution"
          title="Bots & Automation"
          description="Set up up to five Telegram and five WhatsApp automations with HYPD link conversion, auto forwarding, auto posting, and image or no-image posting modes."
        />
        <ConnectGrid />
      </div>
    </ProtectedAppShell>
  );
}
