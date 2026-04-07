"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useCreatorAuth } from "@/components/auth-provider";
import { CopyIcon, LinkIcon } from "@/components/icons";
import { HypdConversionResult, generateHypdConversion } from "@/lib/hypd-links";

function csvValue(value: string) {
  return `"${value.replace(/"/g, '""')}"`;
}

function buildCsv(results: HypdConversionResult[]) {
  const headers = ["source_url", "marketplace", "short_link", "expanded_link", "commission_source"];
  const rows = results.map((r) =>
    [r.sourceUrl, r.marketplace, r.shortLink, r.expandedLink, r.commissionSource]
      .map((v) => csvValue(v))
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export function ConverterPanel() {
  const { creator, isAuthenticated } = useCreatorAuth();
  const username = creator?.hypdUsername ?? "creator";
  const [url, setUrl] = useState("");
  const [bulkText, setBulkText] = useState("");
  const [copied, setCopied] = useState(false);
  const [output, setOutput] = useState<HypdConversionResult | null>(null);
  const [bulkResults, setBulkResults] = useState<HypdConversionResult[]>([]);
  const [status, setStatus] = useState("");
  const [isConverting, setIsConverting] = useState(false);
  const [isBulkConverting, setIsBulkConverting] = useState(false);
  const [activeTab, setActiveTab] = useState<"single" | "bulk">("single");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const csvContent = useMemo(() => buildCsv(bulkResults), [bulkResults]);

  useEffect(() => {
    setOutput(generateHypdConversion(url, username));
  }, [url, username]);

  async function convertSingle(sourceUrl: string) {
    const res = await fetch("/api/hypd/convert", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sourceUrl })
    });
    const result = (await res.json()) as { ok: boolean; message?: string; result?: HypdConversionResult };
    if (!res.ok || !result.ok || !result.result) throw new Error(result.message || "Conversion failed.");
    return result.result;
  }

  async function handleConvert() {
    if (!isAuthenticated) { setStatus("Login first."); return; }
    setIsConverting(true);
    try {
      const result = await convertSingle(url);
      setOutput(result);
      setStatus(`Converted: ${result.marketplace}`);
    } catch (e) {
      setOutput(generateHypdConversion(url, username));
      setStatus(e instanceof Error ? e.message : "Conversion failed.");
    } finally { setIsConverting(false); }
  }

  async function handleBulkConvert() {
    if (!isAuthenticated) { setStatus("Login first."); return; }
    const entries = bulkText.split("\n").map((e) => e.trim()).filter(Boolean);
    if (!entries.length) return;
    setIsBulkConverting(true);
    const results: HypdConversionResult[] = [];
    for (const entry of entries) {
      try { results.push(await convertSingle(entry)); }
      catch { const fb = generateHypdConversion(entry, username); if (fb) results.push(fb); }
    }
    setBulkResults(results);
    setStatus(`Converted ${results.length} links.`);
    setIsBulkConverting(false);
  }

  function handleCsvUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      // Extract URLs from CSV — assume first column or any column with http
      const urls = text
        .split("\n")
        .slice(1) // skip header
        .map((line) => {
          const match = line.match(/https?:\/\/[^\s,"]+/);
          return match ? match[0] : "";
        })
        .filter(Boolean);
      setBulkText(urls.join("\n"));
      setActiveTab("bulk");
    };
    reader.readAsText(file);
  }

  async function copyLink() {
    if (!output?.shortLink) return;
    await navigator.clipboard.writeText(output.shortLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  function downloadCsv() {
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "hypd-converted-links.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-4">
      {/* Tab switcher */}
      <div className="flex gap-1 rounded-lg bg-surface-card p-1">
        <button
          onClick={() => setActiveTab("single")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === "single" ? "bg-cta-gradient text-white" : "text-muted hover:text-text"
          }`}
        >
          Single Link
        </button>
        <button
          onClick={() => setActiveTab("bulk")}
          className={`flex-1 rounded-md px-4 py-2 text-sm font-bold transition-colors ${
            activeTab === "bulk" ? "bg-cta-gradient text-white" : "text-muted hover:text-text"
          }`}
        >
          Bulk / CSV
        </button>
      </div>

      {activeTab === "single" ? (
        <div className="space-y-4">
          {/* Input */}
          <div className="rounded-xl bg-surface-card p-5">
            <div className="flex items-center gap-3 rounded-lg bg-surface-high px-4 py-3">
              <LinkIcon className="h-4 w-4 text-primary" />
              <input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="Paste Myntra, Flipkart, Meesho, Shopsy, Nykaa, or Ajio URL"
                className="w-full bg-transparent text-sm text-text outline-none placeholder:text-muted/50"
              />
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <button
                onClick={handleConvert}
                disabled={!isAuthenticated || isConverting || !url.trim()}
                className="rounded-lg bg-cta-gradient px-4 py-2 text-sm font-bold text-white shadow-glow disabled:opacity-50"
              >
                {isConverting ? "Converting..." : "Convert"}
              </button>
              <button
                onClick={copyLink}
                disabled={!output?.shortLink}
                className="flex items-center gap-1.5 rounded-lg bg-surface-high px-4 py-2 text-sm font-bold text-text disabled:opacity-50"
              >
                <CopyIcon className="h-3.5 w-3.5" />
                {copied ? "Copied!" : "Copy Link"}
              </button>
            </div>
          </div>

          {/* Output */}
          {output?.shortLink ? (
            <div className="rounded-xl bg-surface-card p-5">
              <div className="space-y-3">
                <div className="rounded-lg bg-surface-high px-4 py-3">
                  <p className="text-[10px] font-bold uppercase text-muted">Short Link</p>
                  <p className="mt-1 break-all text-sm font-medium text-primary">{output.shortLink}</p>
                </div>
                <div className="rounded-lg bg-surface-high px-4 py-3">
                  <p className="text-[10px] font-bold uppercase text-muted">Full Link</p>
                  <p className="mt-1 break-all text-sm text-text">{output.expandedLink}</p>
                </div>
                <div className="flex flex-wrap gap-2 text-xs">
                  <span className="rounded bg-primary/10 px-2 py-1 text-primary">{output.marketplace}</span>
                  <span className="rounded bg-surface-high px-2 py-1 text-muted">{output.hypdPathType ?? "afflink"}</span>
                  <span className="rounded bg-surface-high px-2 py-1 text-muted">{output.commissionSource ?? "HYPD"}</span>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bulk input */}
          <div className="rounded-xl bg-surface-card p-5">
            <div className="flex items-center justify-between gap-3">
              <p className="text-sm font-semibold text-text">Paste URLs or upload CSV</p>
              <div className="flex gap-2">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-lg bg-surface-high px-3 py-1.5 text-xs font-bold text-text"
                >
                  Upload CSV
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".csv,.tsv,.txt"
                  onChange={handleCsvUpload}
                  className="hidden"
                />
              </div>
            </div>
            <textarea
              value={bulkText}
              onChange={(e) => setBulkText(e.target.value)}
              rows={8}
              className="mt-3 w-full rounded-lg bg-surface-high px-4 py-3 text-sm text-text outline-none placeholder:text-muted/50"
              placeholder="One URL per line"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={handleBulkConvert}
                disabled={!isAuthenticated || isBulkConverting}
                className="rounded-lg bg-cta-gradient px-4 py-2 text-sm font-bold text-white shadow-glow disabled:opacity-50"
              >
                {isBulkConverting ? `Converting...` : `Convert All (${bulkText.split("\n").filter(Boolean).length})`}
              </button>
              {bulkResults.length > 0 ? (
                <button
                  onClick={downloadCsv}
                  className="rounded-lg bg-surface-high px-4 py-2 text-sm font-bold text-text"
                >
                  Download CSV ({bulkResults.length} rows)
                </button>
              ) : null}
            </div>
          </div>

          {/* Results */}
          {bulkResults.length > 0 ? (
            <div className="rounded-xl bg-surface-card p-5">
              <p className="text-sm font-semibold text-text">{bulkResults.length} converted</p>
              <div className="mt-3 max-h-96 space-y-2 overflow-y-auto">
                {bulkResults.map((r, i) => (
                  <div key={`${r.sourceUrl}-${i}`} className="rounded-lg bg-surface-high px-4 py-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">{r.marketplace}</span>
                      <span className="text-xs text-muted">Row {i + 1}</span>
                    </div>
                    <p className="mt-1 break-all text-xs text-muted">{r.sourceUrl}</p>
                    <p className="mt-1 break-all text-sm font-medium text-primary">{r.shortLink || "—"}</p>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Status bar */}
      {status ? (
        <p className="text-xs text-muted">{status}</p>
      ) : null}
    </div>
  );
}
