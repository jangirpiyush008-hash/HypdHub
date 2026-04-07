import { ConnectGrid } from "@/components/connect-grid";
import { ProtectedAppShell } from "@/components/protected-app-shell";

export default function ConnectPage() {
  return (
    <ProtectedAppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-text">Telegram Automation</h1>
          <p className="mt-1 text-sm text-muted">Configure source, destination, and run.</p>
        </div>
        <ConnectGrid />
      </div>
    </ProtectedAppShell>
  );
}
