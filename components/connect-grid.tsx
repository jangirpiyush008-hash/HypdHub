"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, SparklesIcon } from "@/components/icons";
import {
  createTelegramAutomation,
  MAX_AUTOMATIONS,
  OFFICIAL_HYPD_BOT_USERNAME,
  OFFICIAL_HYPD_SOURCE_CHANNEL,
  OFFICIAL_HYPD_SOURCE_LABEL,
  PostFormat,
  TelegramAutomation
} from "@/lib/automation-config";

type WebhookRegistration =
  | { status: "registered"; url: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; reason: string };

type RunLogEntry = {
  automationId: string;
  status: "delivered" | "skipped" | "error";
  reason?: string;
  sourceMessageId?: number;
  destMessageId?: number;
  at: string;
};

type TelegramAutomationResponse = {
  ok: boolean;
  updatedAt?: string;
  automations?: TelegramAutomation[];
  recentRuns?: RunLogEntry[];
  webhooks?: Record<string, WebhookRegistration>;
  message?: string;
  officialBotConfigured?: boolean;
};

type VerifyResponse = {
  ok: boolean;
  message?: string;
  botUsername?: string;
  chatId?: number | string;
  type?: string;
  title?: string;
};

type TelegramRunResponse = {
  ok: boolean;
  message?: string;
  results?: Array<{
    automationId: string;
    automationName: string;
    ok: boolean;
    postedDeal?: string;
    postedLink?: string;
    message?: string;
  }>;
};

const postFormats: Array<{ value: PostFormat; label: string }> = [
  { value: "with_image", label: "Image" },
  { value: "without_image", label: "Text" },
  { value: "both", label: "Both" }
];

function Field({ label, value, placeholder, onChange, type = "text" }: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (v: string) => void;
  type?: "text" | "textarea";
}) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-muted">{label}</span>
      {type === "textarea" ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          rows={3}
          className="w-full rounded-lg bg-surface-high px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-lg bg-surface-high px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
        />
      )}
    </label>
  );
}

function Toggle({ label, checked, onChange }: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg bg-surface-high px-3 py-2.5">
      <span className="text-sm font-medium text-text">{label}</span>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`inline-flex h-6 w-10 items-center rounded-full px-0.5 transition-colors ${
          checked ? "bg-cta-gradient" : "bg-surface-bright"
        }`}
      >
        <span className={`h-5 w-5 rounded-full bg-white transition-transform ${checked ? "translate-x-4" : ""}`} />
      </button>
    </div>
  );
}

async function verify(action: "bot" | "chat", payload: Record<string, unknown>): Promise<VerifyResponse> {
  try {
    const res = await fetch("/api/automation/telegram/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, ...payload }),
    });
    return (await res.json()) as VerifyResponse;
  } catch (err) {
    return { ok: false, message: err instanceof Error ? err.message : "network error" };
  }
}

function AutomationCard({ automation, index, onChange, onRemove }: {
  automation: TelegramAutomation;
  index: number;
  onChange: (next: TelegramAutomation) => void;
  onRemove: () => void;
}) {
  const isOfficial = automation.sourceMode === "official_hypd";
  const [botCheck, setBotCheck] = useState<VerifyResponse | null>(null);
  const [srcCheck, setSrcCheck] = useState<VerifyResponse | null>(null);
  const [destCheck, setDestCheck] = useState<VerifyResponse | null>(null);

  async function checkBot() {
    if (isOfficial) {
      setBotCheck({ ok: true, message: "Using HYPD-managed bot" });
      return;
    }
    setBotCheck(await verify("bot", { token: automation.botToken }));
  }
  async function checkSource() {
    const token = isOfficial ? "" : automation.botToken;
    setSrcCheck(await verify("chat", { token, useOfficial: isOfficial, chatId: automation.sourceChannelId }));
  }
  async function checkDestination() {
    const token = isOfficial ? "" : automation.botToken;
    const chatId = automation.destinationChannelId || automation.destinationChannelUsername;
    const result = await verify("chat", { token, useOfficial: isOfficial, chatId });
    setDestCheck(result);
    if (result.ok && result.chatId && !automation.destinationChannelId) {
      onChange({ ...automation, destinationChannelId: String(result.chatId) });
    }
  }

  return (
    <div className="rounded-xl bg-surface-card p-5">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-headline text-lg font-bold text-text">
          Automation {index + 1}
        </h3>
        <button onClick={onRemove} className="text-xs font-semibold text-muted hover:text-text">
          Remove
        </button>
      </div>

      <div className="mt-4 space-y-4">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted">Destination Channel</span>
            <button
              type="button"
              onClick={() => void checkDestination()}
              className="text-[10px] font-bold uppercase text-primary hover:underline"
            >
              Verify
            </button>
          </div>
          <input
            value={automation.destinationChannelUsername}
            onChange={(e) => onChange({ ...automation, destinationChannelUsername: e.target.value })}
            placeholder="@your_channel or -100123..."
            className="w-full rounded-lg bg-surface-high px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
          />
          {destCheck ? (
            <p className={`text-[11px] ${destCheck.ok ? "text-tertiary" : "text-primary"}`}>
              {destCheck.ok
                ? `✓ ${destCheck.type} · ${destCheck.title} (${destCheck.chatId})`
                : `✗ ${destCheck.message}`}
            </p>
          ) : null}
        </div>

        {/* Source mode */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted">Source</span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => onChange({
                ...automation,
                sourceMode: "official_hypd",
                sourceChannelLabel: OFFICIAL_HYPD_SOURCE_LABEL,
                sourceChannelId: OFFICIAL_HYPD_SOURCE_CHANNEL,
                botUsername: automation.botUsername || OFFICIAL_HYPD_BOT_USERNAME
              })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                isOfficial ? "bg-cta-gradient text-white" : "bg-surface-high text-text"
              }`}
            >
              HYPD Official
            </button>
            <button
              type="button"
              onClick={() => onChange({ ...automation, sourceMode: "custom_channel" })}
              className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                !isOfficial ? "bg-cta-gradient text-white" : "bg-surface-high text-text"
              }`}
            >
              Custom
            </button>
          </div>
        </div>

        {isOfficial ? (
          <div className="flex items-center gap-3 rounded-lg bg-surface-high px-3 py-2.5">
            <SparklesIcon className="h-4 w-4 text-primary" />
            <div>
              <p className="text-sm font-semibold text-text">{OFFICIAL_HYPD_SOURCE_LABEL}</p>
              <p className="text-xs text-muted">{OFFICIAL_HYPD_SOURCE_CHANNEL}</p>
            </div>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Source Channel</span>
                <button type="button" onClick={() => void checkSource()} className="text-[10px] font-bold uppercase text-primary hover:underline">Verify</button>
              </div>
              <input
                value={automation.sourceChannelId}
                onChange={(e) => onChange({ ...automation, sourceChannelId: e.target.value, sourceChannelLabel: e.target.value })}
                placeholder="@source_channel or -100..."
                className="w-full rounded-lg bg-surface-high px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
              />
              {srcCheck ? (
                <p className={`text-[11px] ${srcCheck.ok ? "text-tertiary" : "text-primary"}`}>
                  {srcCheck.ok ? `✓ ${srcCheck.type} · ${srcCheck.title}` : `✗ ${srcCheck.message}`}
                </p>
              ) : null}
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Bot Username</span>
                <button type="button" onClick={() => void checkBot()} className="text-[10px] font-bold uppercase text-primary hover:underline">Verify</button>
              </div>
              <input
                value={automation.botUsername}
                onChange={(e) => onChange({ ...automation, botUsername: e.target.value })}
                placeholder="@your_bot"
                className="w-full rounded-lg bg-surface-high px-3 py-2.5 text-sm text-text outline-none placeholder:text-muted/50"
              />
              {botCheck ? (
                <p className={`text-[11px] ${botCheck.ok ? "text-tertiary" : "text-primary"}`}>
                  {botCheck.ok ? `✓ @${botCheck.botUsername ?? ""}${botCheck.message ? ` · ${botCheck.message}` : ""}` : `✗ ${botCheck.message}`}
                </p>
              ) : null}
            </div>
          </div>
        )}

        {/* Flow indicator */}
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="rounded bg-surface-high px-2 py-1">{isOfficial ? "HYPD Deals" : "Custom"}</span>
          <ArrowRightIcon className="h-3 w-3" />
          <span className="rounded bg-surface-high px-2 py-1">Convert</span>
          <ArrowRightIcon className="h-3 w-3" />
          <span className="rounded bg-surface-high px-2 py-1">Your Channel</span>
        </div>

        {/* Toggles */}
        <div className="grid gap-2 sm:grid-cols-2">
          <Toggle label="Auto post" checked={automation.autoPostingEnabled} onChange={(v) => onChange({ ...automation, autoPostingEnabled: v })} />
          <Toggle label="Auto forward" checked={automation.autoForwardEnabled} onChange={(v) => onChange({ ...automation, autoForwardEnabled: v })} />
          <Toggle label="Link convert" checked={automation.linkConversionEnabled} onChange={(v) => onChange({ ...automation, linkConversionEnabled: v })} />
          <Toggle label="Enabled" checked={automation.enabled} onChange={(v) => onChange({ ...automation, enabled: v })} />
        </div>

        {/* Post format */}
        <div className="space-y-1">
          <span className="text-xs font-semibold text-muted">Post Format</span>
          <div className="flex gap-2">
            {postFormats.map((f) => (
              <button
                key={f.value}
                type="button"
                onClick={() => onChange({ ...automation, postFormat: f.value })}
                className={`rounded-lg px-3 py-1.5 text-xs font-bold ${
                  automation.postFormat === f.value ? "bg-cta-gradient text-white" : "bg-surface-high text-text"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* Advanced — collapsed */}
        <details className="rounded-lg bg-surface-high p-3">
          <summary className="cursor-pointer text-sm font-semibold text-text">Advanced Settings</summary>
          <div className="mt-3 space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Posting Window" value={automation.postingWindow} placeholder="10 AM, 2 PM, 8 PM" onChange={(v) => onChange({ ...automation, postingWindow: v })} />
              <Field label="Destination Channel ID" value={automation.destinationChannelId} placeholder="-100..." onChange={(v) => onChange({ ...automation, destinationChannelId: v })} />
              {!isOfficial ? (
                <Field label="Bot Token" value={automation.botToken} placeholder="BotFather token" onChange={(v) => onChange({ ...automation, botToken: v })} />
              ) : null}
              <Field label="Caption Template" value={automation.captionTemplate} placeholder="{title}\n{marketplace} {price}\n{link}" onChange={(v) => onChange({ ...automation, captionTemplate: v })} type="textarea" />
            </div>

            {/* Start / End post text */}
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Start Post Text"
                value={automation.startPostText}
                placeholder="Text added before each post"
                onChange={(v) => onChange({ ...automation, startPostText: v })}
                type="textarea"
              />
              <Field
                label="End Post Text"
                value={automation.endPostText}
                placeholder="Text added after each post"
                onChange={(v) => onChange({ ...automation, endPostText: v })}
                type="textarea"
              />
            </div>

            {/* Blacklist texts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Blacklist Text</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...automation, blacklistTexts: [...automation.blacklistTexts, ""] })}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Add Field
                </button>
              </div>
              <p className="text-[10px] text-muted/60">Posts containing these texts will be skipped.</p>
              {automation.blacklistTexts.map((txt, bi) => (
                <div key={bi} className="flex gap-2">
                  <input
                    value={txt}
                    onChange={(e) => {
                      const next = [...automation.blacklistTexts];
                      next[bi] = e.target.value;
                      onChange({ ...automation, blacklistTexts: next });
                    }}
                    placeholder="Enter blacklist text"
                    className="flex-1 rounded-lg bg-surface-card px-3 py-2 text-sm text-text outline-none placeholder:text-muted/50"
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ ...automation, blacklistTexts: automation.blacklistTexts.filter((_, j) => j !== bi) })}
                    className="rounded-lg bg-surface-card px-2 text-xs text-muted hover:text-text"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>

            {/* Replace texts */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-muted">Replace Text</span>
                <button
                  type="button"
                  onClick={() => onChange({ ...automation, replaceTexts: [...automation.replaceTexts, { find: "", replace: "" }] })}
                  className="text-xs font-bold text-primary hover:underline"
                >
                  + Add Rule
                </button>
              </div>
              <p className="text-[10px] text-muted/60">Find and replace text in forwarded posts.</p>
              {automation.replaceTexts.map((rule, ri) => (
                <div key={ri} className="flex gap-2">
                  <input
                    value={rule.find}
                    onChange={(e) => {
                      const next = [...automation.replaceTexts];
                      next[ri] = { ...next[ri], find: e.target.value };
                      onChange({ ...automation, replaceTexts: next });
                    }}
                    placeholder="Find text"
                    className="flex-1 rounded-lg bg-surface-card px-3 py-2 text-sm text-text outline-none placeholder:text-muted/50"
                  />
                  <input
                    value={rule.replace}
                    onChange={(e) => {
                      const next = [...automation.replaceTexts];
                      next[ri] = { ...next[ri], replace: e.target.value };
                      onChange({ ...automation, replaceTexts: next });
                    }}
                    placeholder="Replace with"
                    className="flex-1 rounded-lg bg-surface-card px-3 py-2 text-sm text-text outline-none placeholder:text-muted/50"
                  />
                  <button
                    type="button"
                    onClick={() => onChange({ ...automation, replaceTexts: automation.replaceTexts.filter((_, j) => j !== ri) })}
                    className="rounded-lg bg-surface-card px-2 text-xs text-muted hover:text-text"
                  >
                    x
                  </button>
                </div>
              ))}
            </div>
          </div>
        </details>

        {/* Access notice — compact */}
        <p className="text-xs text-muted">
          Add {OFFICIAL_HYPD_BOT_USERNAME} as admin in your destination channel.
          {isOfficial ? " No source setup needed." : " Private sources must be readable by the bot."}
        </p>
      </div>
    </div>
  );
}

export function ConnectGrid() {
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("Loading...");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [automations, setAutomations] = useState<TelegramAutomation[]>([]);
  const [officialBotConfigured, setOfficialBotConfigured] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [recentRuns, setRecentRuns] = useState<RunLogEntry[]>([]);
  const [webhooks, setWebhooks] = useState<Record<string, WebhookRegistration> | null>(null);

  useEffect(() => {
    fetch("/api/automation/telegram", { cache: "no-store" })
      .then((res) => res.json())
      .then((result: TelegramAutomationResponse) => {
        if (!result.ok) {
          setStatus(result.message ?? "Login required.");
          setIsReady(true);
          return;
        }
        setAutomations(result.automations?.length ? result.automations : [createTelegramAutomation()]);
        setSavedAt(result.updatedAt ?? null);
        setOfficialBotConfigured(Boolean(result.officialBotConfigured));
        setRecentRuns(result.recentRuns ?? []);
        setStatus("Ready");
        setIsReady(true);
      })
      .catch(() => { setStatus("Unable to load."); setIsReady(true); });
  }, []);

  async function save() {
    setIsSaving(true);
    try {
      const res = await fetch("/api/automation/telegram", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ automations })
      });
      const result = (await res.json()) as TelegramAutomationResponse;
      if (result.ok) {
        setAutomations(result.automations ?? automations);
        setSavedAt(result.updatedAt ?? null);
        setOfficialBotConfigured(Boolean(result.officialBotConfigured));
        setWebhooks(result.webhooks ?? null);
        setStatus("Saved");
      } else {
        setStatus(result.message ?? "Save failed.");
      }
    } catch { setStatus("Save failed."); }
    finally { setIsSaving(false); }
  }

  async function runNow() {
    setIsRunning(true);
    try {
      const res = await fetch("/api/automation/telegram/run", { method: "POST" });
      const result = (await res.json()) as TelegramRunResponse;
      const success = result.results?.find((r) => r.ok);
      setStatus(success?.postedDeal ? `Posted: ${success.postedDeal}` : result.message ?? "Run complete.");
    } catch { setStatus("Run failed."); }
    finally { setIsRunning(false); }
  }

  if (!isReady) {
    return <div className="rounded-xl bg-surface-card p-6"><p className="text-sm text-muted">{status}</p></div>;
  }

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-surface-card p-4">
        <div className="flex items-center gap-3">
          <span className={`h-2 w-2 rounded-full ${officialBotConfigured ? "bg-tertiary" : "bg-primary"}`} />
          <span className="text-sm text-muted">
            {officialBotConfigured ? "Bot ready" : "Bot pending"}
            {savedAt ? ` · Saved ${savedAt}` : ""}
          </span>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => { if (automations.length < MAX_AUTOMATIONS) setAutomations([...automations, createTelegramAutomation()]); }}
            disabled={automations.length >= MAX_AUTOMATIONS}
            className="rounded-lg bg-surface-high px-3 py-1.5 text-xs font-bold text-text disabled:opacity-50"
          >
            + Add
          </button>
          <button
            onClick={() => void runNow()}
            disabled={isRunning}
            className="rounded-lg bg-surface-high px-3 py-1.5 text-xs font-bold text-text disabled:opacity-50"
          >
            {isRunning ? "Running..." : "Run Now"}
          </button>
          <button
            onClick={() => void save()}
            disabled={isSaving}
            className="rounded-lg bg-cta-gradient px-4 py-1.5 text-xs font-bold text-white shadow-glow disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save"}
          </button>
        </div>
      </div>

      {/* Status */}
      {status !== "Ready" && status !== "Saved" ? (
        <p className="text-xs text-muted">{status}</p>
      ) : null}

      {/* Automation cards */}
      {automations.map((a, i) => (
        <AutomationCard
          key={a.id}
          automation={a}
          index={i}
          onChange={(next) => setAutomations(automations.map((item) => item.id === a.id ? next : item))}
          onRemove={() => { if (automations.length > 1) setAutomations(automations.filter((item) => item.id !== a.id)); }}
        />
      ))}

      {/* Webhook registration status (after save) */}
      {webhooks && Object.keys(webhooks).length > 0 ? (
        <div className="rounded-xl bg-surface-card p-4">
          <h3 className="mb-2 text-sm font-bold text-text">Webhook Status</h3>
          <ul className="space-y-1 text-xs">
            {Object.entries(webhooks).map(([token, info]) => (
              <li key={token} className={`${info.status === "registered" ? "text-tertiary" : info.status === "error" ? "text-primary" : "text-muted"}`}>
                <span className="font-mono">{token}</span>{" · "}
                {info.status === "registered" ? `registered → ${info.url}` : info.status === "skipped" ? `skipped · ${info.reason}` : `error · ${info.reason}`}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      {/* Run log */}
      {recentRuns.length > 0 ? (
        <div className="rounded-xl bg-surface-card p-4">
          <h3 className="mb-3 text-sm font-bold text-text">Recent Runs</h3>
          <div className="space-y-2">
            {recentRuns.slice(0, 20).map((r, idx) => (
              <div key={idx} className="flex items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-2">
                  <span
                    className={`inline-block h-1.5 w-1.5 rounded-full ${
                      r.status === "delivered" ? "bg-tertiary" : r.status === "skipped" ? "bg-muted" : "bg-primary"
                    }`}
                  />
                  <span className="font-mono text-muted">{new Date(r.at).toLocaleString()}</span>
                  <span className="text-text">{r.status}</span>
                  {r.reason ? <span className="text-muted">· {r.reason}</span> : null}
                </div>
                <span className="text-muted/60">msg {r.sourceMessageId ?? "—"} → {r.destMessageId ?? "—"}</span>
              </div>
            ))}
          </div>
        </div>
      ) : null}
    </div>
  );
}
