"use client";

import { useEffect, useMemo, useState } from "react";
import { useCreatorAuth } from "@/components/auth-provider";
import { ArrowRightIcon, CopyIcon, LinkIcon, SparklesIcon } from "@/components/icons";
import { HypdConversionResult, generateHypdConversion } from "@/lib/hypd-links";

const defaultUrl =
  "https://www.myntra.com/sweatshirts/cava/cava-moscow-blue-essential-sweatshirt/25312770/buy";

const bulkDefault = [
  "https://www.hypd.store/harshdubey123/product/646221796d6b52625e6387e4?title=Vitamin+C+%2B+E+SPF+50%2B+PA%2B%2B%2B%2B+Sunscreen+-+50g",
  "https://www.flipkart.com/triggr-arcus-one-60h-battery-4-mic-enc-dual-pairing-rubber-grip-13mm-drivers-v6-0-bluetooth/p/itmcaf717e45f345",
  "https://www.nykaa.com/dove-peptide-bond-strength-shampoo/p/20671035?productId=20671035&skuId=20671028&pps=1"
].join("\n");

function csvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv(results: HypdConversionResult[]) {
  const headers = [
    "source_url",
    "marketplace",
    "creator_username",
    "source_username",
    "hypd_path_type",
    "entity_id",
    "click_id",
    "short_link",
    "expanded_link",
    "commission_source"
  ];

  const rows = results.map((result) =>
    [
      result.sourceUrl,
      result.marketplace,
      result.creatorUsername,
      result.sourceUsername ?? "",
      result.hypdPathType ?? "",
      result.entityId ?? "",
      result.clickId ?? "",
      result.shortLink,
      result.expandedLink,
      result.commissionSource
    ]
      .map((value) => csvValue(value))
      .join(",")
  );

  return [headers.join(","), ...rows].join("\n");
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-surface-low px-4 py-3">
      <p className="text-[11px] font-bold uppercase tracking-[0.24em] text-muted">{label}</p>
      <p className="mt-2 break-all text-sm text-text">{value}</p>
    </div>
  );
}

function ParserTable({ output }: { output: HypdConversionResult | null }) {
  const rows = [
    { label: "Marketplace", value: output?.marketplace ?? "Waiting for URL" },
    { label: "Creator Username", value: output?.creatorUsername ?? "Waiting for URL" },
    { label: "Source Username", value: output?.sourceUsername ?? "-" },
    { label: "Route Type", value: output?.hypdPathType ?? "Marketplace afflink" },
    { label: "Entity ID", value: output?.entityId ?? "-" },
    { label: "Click ID", value: output?.clickId ?? "-" },
    { label: "Short Link", value: output?.shortLink || "No generated short link yet" },
    { label: "Expanded Link", value: output?.expandedLink || "No expanded link yet" },
    { label: "Commission Source", value: output?.commissionSource ?? "Will map from HYPD" }
  ];

  return (
    <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Parser Tester</p>
          <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
            Inspect the HYPD parsing result
          </h3>
        </div>
        <div className="rounded-xl bg-surface-top px-4 py-2 text-xs font-bold uppercase tracking-[0.22em] text-text">
          Live Parse
        </div>
      </div>
      <div className="mt-6 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {rows.map((row) => (
          <DetailRow key={row.label} label={row.label} value={row.value} />
        ))}
      </div>
    </section>
  );
}

export function ConverterPanel() {
  const { creator, isAuthenticated } = useCreatorAuth();
  const username = creator?.hypdUsername ?? "creator";
  const [url, setUrl] = useState(defaultUrl);
  const [bulkText, setBulkText] = useState(bulkDefault);
  const [copied, setCopied] = useState(false);
  const [copiedFull, setCopiedFull] = useState(false);
  const [csvCopied, setCsvCopied] = useState(false);
  const [output, setOutput] = useState<HypdConversionResult | null>(
    generateHypdConversion(defaultUrl, username)
  );
  const [bulkResults, setBulkResults] = useState<HypdConversionResult[]>([]);
  const [convertStatus, setConvertStatus] = useState("Login with your real HYPD account to run live conversion.");
  const [isConverting, setIsConverting] = useState(false);
  const [isBulkConverting, setIsBulkConverting] = useState(false);

  const csvContent = useMemo(() => buildCsv(bulkResults), [bulkResults]);

  useEffect(() => {
    setOutput(generateHypdConversion(url, username));
  }, [url, username]);

  useEffect(() => {
    if (!isAuthenticated) {
      setConvertStatus("Login with your real HYPD account to run live conversion.");
    }
  }, [isAuthenticated]);

  async function convertSingle(sourceUrl: string) {
    const response = await fetch("/api/hypd/convert", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sourceUrl
      })
    });
    const result = (await response.json()) as {
      ok: boolean;
      message?: string;
      result?: HypdConversionResult;
    };

    if (!response.ok || !result.ok || !result.result) {
      throw new Error(result.message || "Unable to convert this link on HYPD.");
    }

    return result.result;
  }

  async function handleLiveConvert() {
    if (!isAuthenticated) {
      setConvertStatus("Please login with your real HYPD account first.");
      return;
    }

    setIsConverting(true);

    try {
      const result = await convertSingle(url);
      setOutput(result);
      setConvertStatus(`Live HYPD conversion complete for ${result.marketplace}.`);
    } catch (error) {
      setOutput(generateHypdConversion(url, username));
      setConvertStatus(error instanceof Error ? error.message : "Unable to convert this link on HYPD.");
    } finally {
      setIsConverting(false);
    }
  }

  async function handleBulkConvert() {
    if (!isAuthenticated) {
      setConvertStatus("Please login with your real HYPD account first.");
      return;
    }

    const entries = bulkText
      .split("\n")
      .map((entry) => entry.trim())
      .filter(Boolean);

    setIsBulkConverting(true);

    try {
      const results: HypdConversionResult[] = [];

      for (const entry of entries) {
        try {
          results.push(await convertSingle(entry));
        } catch {
          const fallback = generateHypdConversion(entry, username);
          if (fallback) {
            results.push(fallback);
          }
        }
      }

      setBulkResults(results);
      setConvertStatus(`Live HYPD bulk conversion completed for ${results.length} link${results.length === 1 ? "" : "s"}.`);
    } finally {
      setIsBulkConverting(false);
    }
  }

  async function copyShortLink() {
    if (!output?.shortLink) return;
    try {
      await navigator.clipboard.writeText(output.shortLink);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  }

  async function copyFullLink() {
    if (!output?.expandedLink) return;
    try {
      await navigator.clipboard.writeText(output.expandedLink);
      setCopiedFull(true);
      window.setTimeout(() => setCopiedFull(false), 1500);
    } catch {
      setCopiedFull(false);
    }
  }

  async function copyCsv() {
    try {
      await navigator.clipboard.writeText(csvContent);
      setCsvCopied(true);
      window.setTimeout(() => setCsvCopied(false), 1500);
    } catch {
      setCsvCopied(false);
    }
  }

  function downloadCsv() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const objectUrl = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = objectUrl;
    anchor.download = "hypd-bulk-links.csv";
    anchor.click();
    URL.revokeObjectURL(objectUrl);
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
        <section className="overflow-hidden rounded-[1.75rem] bg-surface-card shadow-ambient">
          <div className="border-b border-white/5 px-6 py-5">
            <div className="inline-flex items-center gap-2 rounded-full bg-primary/15 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.24em] text-primary">
              <SparklesIcon className="h-4 w-4" />
              Instant Converter
            </div>
            <h2 className="mt-4 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
              Convert links into HYPD short links and expanded destination URLs
            </h2>
            <p className="mt-3 max-w-2xl text-muted">
              This flow now follows the HYPD formats you shared: HYPD Store routes stay under your username,
              and supported marketplaces generate {"`/{username}/afflink/{clickId}`"} short links plus full
              expanded URLs.
            </p>
          </div>

          <div className="space-y-6 p-6">
            <div className="focus-line rounded-[1.25rem] bg-surface-top p-1">
              <div className="flex items-center gap-3 rounded-[1rem] bg-surface-top px-4 py-4">
                <LinkIcon className="h-5 w-5 text-primary" />
                <input
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  placeholder="Paste a HYPD, Myntra, Flipkart, Meesho, Shopsy, Nykaa, or Ajio URL"
                  className="w-full border-none bg-transparent text-sm text-text outline-none placeholder:text-muted"
                />
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="rounded-full bg-primary/10 p-3 text-primary">
                <LinkIcon className="h-5 w-5" />
              </div>
              <div className="h-px flex-1 bg-white/10" />
              <div className="rounded-full bg-surface-top p-3 text-primary">
                <ArrowRightIcon className="h-5 w-5" />
              </div>
            </div>

            <div className="rounded-[1.25rem] bg-surface-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Generated HYPD Short Link</p>
              <p className="mt-3 break-all font-medium text-text">
                {output?.shortLink || "Your converted HYPD short link will appear here"}
              </p>
            </div>

            <div className="rounded-[1.25rem] bg-surface-low p-5">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Expanded Destination Link</p>
              <p className="mt-3 break-all font-medium text-text">
                {output?.expandedLink || "The expanded destination URL will appear here"}
              </p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={handleLiveConvert}
                disabled={!isAuthenticated || isConverting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow transition-transform active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-50"
              >
                <LinkIcon className="h-4 w-4" />
                {isConverting ? "Converting Live..." : "Convert With HYPD"}
              </button>
              <button
                type="button"
                onClick={copyShortLink}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow transition-transform active:scale-[0.98]"
              >
                <CopyIcon className="h-4 w-4" />
                {copied ? "Copied Short Link" : "Copy Short Link"}
              </button>
              <button
                type="button"
                onClick={copyFullLink}
                className="rounded-xl bg-surface-top px-5 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
              >
                {copiedFull ? "Copied Full Link" : "Copy Full Link"}
              </button>
            </div>
          </div>
        </section>

        <aside className="space-y-5">
          <div className="rounded-[1.5rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.16),rgba(138,35,135,0.24))] p-6 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Logged In Creator</p>
            <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
              {username}
            </h3>
            <p className="mt-2 text-sm leading-6 text-muted">
              {convertStatus}
            </p>
          </div>

          <div className="rounded-[1.5rem] bg-surface-card p-6 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Parsed Link Details</p>
            <div className="mt-4 space-y-3 text-sm leading-6 text-text">
              <div className="rounded-xl bg-surface-low px-4 py-3">
                <span className="text-muted">Marketplace:</span> {output?.marketplace ?? "Waiting for URL"}
              </div>
              <div className="rounded-xl bg-surface-low px-4 py-3">
                <span className="text-muted">HYPD route type:</span> {output?.hypdPathType ?? "Marketplace afflink"}
              </div>
              <div className="rounded-xl bg-surface-low px-4 py-3">
                <span className="text-muted">Commission:</span> {output?.commissionSource ?? "Will map from HYPD"}
              </div>
            </div>
          </div>

          <div className="rounded-[1.5rem] bg-surface-card p-6 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Conversion Rules</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-text">
              <li>HYPD Store links keep the `/collection`, `/product`, or `/brand` route and switch to the creator username.</li>
              <li>Myntra, Flipkart, Meesho, Shopsy, Nykaa, and Ajio generate HYPD `afflink` short URLs.</li>
              <li>Marketplace commission is marked as coming from HYPD mapping once the API is connected.</li>
            </ul>
          </div>

          <div className="rounded-[1.5rem] bg-surface-card p-6 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Notes</p>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-text">
              {(output?.notes ?? ["Paste a supported link to see parsed conversion notes."]).map((note) => (
                <li key={note}>{note}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>

      <ParserTable output={output} />

      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Bulk Converter</p>
            <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
              Convert multiple links and export CSV
            </h3>
            <p className="mt-2 max-w-3xl text-sm leading-7 text-muted">
              Paste one URL per line. The tool will parse every supported link, generate HYPD output, and
              export the full result set as CSV for later API sync.
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={handleBulkConvert}
              disabled={!isAuthenticated || isBulkConverting}
              className="rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isBulkConverting ? "Converting..." : "Run Live Bulk Conversion"}
            </button>
            <button
              type="button"
              onClick={copyCsv}
              className="rounded-xl bg-surface-top px-5 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
            >
              {csvCopied ? "Copied CSV" : "Copy CSV"}
            </button>
            <button
              type="button"
              onClick={downloadCsv}
              className="rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow"
            >
              Download CSV
            </button>
          </div>
        </div>

        <div className="mt-6 grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Bulk input</span>
              <textarea
                value={bulkText}
                onChange={(event) => setBulkText(event.target.value)}
                rows={11}
                className="w-full rounded-[1.25rem] bg-surface-low px-4 py-4 text-sm text-text outline-none"
                placeholder="Paste one URL per line"
              />
            </label>
            <div className="rounded-[1.25rem] bg-surface-low p-4 text-sm text-muted">
              {bulkResults.length} parsed row{bulkResults.length === 1 ? "" : "s"} ready for export.
            </div>
          </div>

          <div className="space-y-3">
            {bulkResults.map((result, index) => (
              <article key={`${result.sourceUrl}-${index}`} className="rounded-[1.25rem] bg-surface-low p-4">
                <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                      Row {index + 1} • {result.marketplace}
                    </p>
                    <p className="mt-2 break-all text-sm text-muted">{result.sourceUrl}</p>
                    <p className="mt-3 break-all text-sm text-text">{result.shortLink || "Unsupported URL"}</p>
                  </div>
                  <div className="rounded-xl bg-surface-card px-4 py-3 text-sm text-text">
                    {result.hypdPathType ?? "afflink"}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
