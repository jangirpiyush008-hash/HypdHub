import { ConverterPanel } from "@/components/converter-panel";
import { ProtectedAppShell } from "@/components/protected-app-shell";

export default function ConverterPage() {
  return (
    <ProtectedAppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-headline text-2xl font-bold tracking-tight text-text">Link Converter</h1>
          <p className="mt-1 text-sm text-muted">Convert product URLs to HYPD affiliate links. Single or bulk via CSV.</p>
        </div>
        <ConverterPanel />
      </div>
    </ProtectedAppShell>
  );
}
