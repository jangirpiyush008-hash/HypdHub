import { ConverterPanel } from "@/components/converter-panel";
import { ProtectedAppShell } from "@/components/protected-app-shell";
import { SectionHeading } from "@/components/section-heading";

export default function ConverterPage() {
  return (
    <ProtectedAppShell>
      <div className="space-y-10">
        <SectionHeading
          eyebrow="Core feature"
          title="Link Converter"
          description="Paste any supported product URL and generate a HYPD-formatted tracking link with a mobile-first premium workflow."
        />
        <ConverterPanel />
      </div>
    </ProtectedAppShell>
  );
}
