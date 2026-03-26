"use client";

import { useState } from "react";
import { useCreatorAuth } from "@/components/auth-provider";
import { CopyIcon, LinkIcon } from "@/components/icons";
import { generateHypdConversion } from "@/lib/hypd-links";

export function ConvertLinkButton({
  originalUrl,
  variant = "primary"
}: {
  originalUrl: string;
  variant?: "primary" | "secondary";
}) {
  const [copied, setCopied] = useState(false);
  const { creator } = useCreatorAuth();
  const conversion = generateHypdConversion(originalUrl, creator?.hypdUsername ?? "creatordemo");
  const converted = conversion?.shortLink ?? "";

  async function onCopy() {
    try {
      await navigator.clipboard.writeText(converted);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  const className =
    variant === "primary"
      ? "bg-cta-gradient text-white shadow-glow"
      : "bg-surface-top text-text";

  return (
    <button
      type="button"
      onClick={onCopy}
      className={`inline-flex items-center justify-center gap-2 rounded-xl px-4 py-3 font-headline text-sm font-bold transition-transform active:scale-[0.98] ${className}`}
    >
      {copied ? <CopyIcon className="h-4 w-4" /> : <LinkIcon className="h-4 w-4" />}
      {copied ? "Copied Link" : "Convert Link"}
    </button>
  );
}
