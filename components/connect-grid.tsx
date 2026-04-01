"use client";

import { useEffect, useState } from "react";
import { ArrowRightIcon, BotIcon, LinkIcon, SparklesIcon } from "@/components/icons";
import {
  createTelegramAutomation,
  MAX_AUTOMATIONS,
  OFFICIAL_HYPD_BOT_USERNAME,
  OFFICIAL_HYPD_SOURCE_CHANNEL,
  OFFICIAL_HYPD_SOURCE_LABEL,
  PostFormat,
  TelegramAutomation
} from "@/lib/automation-config";

type TelegramAutomationResponse = {
  ok: boolean;
  updatedAt?: string;
  automations?: TelegramAutomation[];
  message?: string;
  officialBotConfigured?: boolean;
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

function InputField({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-xl bg-surface-low px-4 py-3 text-sm text-text outline-none placeholder:text-muted"
      />
    </label>
  );
}

function TextAreaField({
  label,
  value,
  placeholder,
  onChange
}: {
  label: string;
  value: string;
  placeholder: string;
  onChange: (value: string) => void;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        rows={3}
        className="w-full rounded-xl bg-surface-low px-4 py-3 text-sm text-text outline-none placeholder:text-muted"
      />
    </label>
  );
}

function ToggleRow({
  label,
  checked,
  onChange,
  body
}: {
  label: string;
  checked: boolean;
  onChange: (next: boolean) => void;
  body: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[1.2rem] bg-surface-low px-4 py-4">
      <div>
        <p className="font-headline text-lg font-bold tracking-[-0.03em] text-text">{label}</p>
        <p className="mt-1 text-sm text-muted">{body}</p>
      </div>
      <button
        type="button"
        onClick={() => onChange(!checked)}
        className={`mt-1 inline-flex h-8 w-14 items-center rounded-full px-1 transition-colors ${
          checked ? "bg-cta-gradient" : "bg-white/10"
        }`}
      >
        <span
          className={`h-6 w-6 rounded-full bg-white transition-transform ${
            checked ? "translate-x-6" : "translate-x-0"
          }`}
        />
      </button>
    </div>
  );
}

function StepCard({
  icon,
  title,
  body
}: {
  icon: React.ReactNode;
  title: string;
  body: string;
}) {
  return (
    <div className="rounded-[1.5rem] bg-surface-card p-5 shadow-ambient">
      <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-surface-low text-primary">{icon}</div>
      <h3 className="mt-4 font-headline text-xl font-extrabold tracking-[-0.03em] text-text">{title}</h3>
      <p className="mt-2 text-sm text-muted">{body}</p>
    </div>
  );
}

function SourceModePicker({
  automation,
  onChange
}: {
  automation: TelegramAutomation;
  onChange: (next: TelegramAutomation) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Source channel</p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() =>
            onChange({
              ...automation,
              sourceMode: "official_hypd",
              sourceChannelLabel: OFFICIAL_HYPD_SOURCE_LABEL,
              sourceChannelId: OFFICIAL_HYPD_SOURCE_CHANNEL,
              botUsername: automation.botUsername || OFFICIAL_HYPD_BOT_USERNAME
            })
          }
          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] ${
            automation.sourceMode === "official_hypd"
              ? "bg-cta-gradient text-white shadow-glow"
              : "bg-surface-low text-text"
          }`}
        >
          Official HYPD source
        </button>
        <button
          type="button"
          onClick={() =>
            onChange({
              ...automation,
              sourceMode: "custom_channel"
            })
          }
          className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] ${
            automation.sourceMode === "custom_channel"
              ? "bg-cta-gradient text-white shadow-glow"
              : "bg-surface-low text-text"
          }`}
        >
          Custom source channel
        </button>
      </div>
    </div>
  );
}

function FormatPicker({
  value,
  onChange
}: {
  value: PostFormat;
  onChange: (value: PostFormat) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Post format</p>
      <div className="flex flex-wrap gap-2">
        {postFormats.map((format) => {
          const selected = value === format.value;
          return (
            <button
              key={format.value}
              type="button"
              onClick={() => onChange(format.value)}
              className={`rounded-full px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] ${
                selected ? "bg-cta-gradient text-white shadow-glow" : "bg-surface-low text-text"
              }`}
            >
              {format.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function TelegramAutomationCard({
  automation,
  index,
  onChange,
  onRemove
}: {
  automation: TelegramAutomation;
  index: number;
  onChange: (next: TelegramAutomation) => void;
  onRemove: () => void;
}) {
  return (
    <article className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Telegram bot</p>
          <h3 className="mt-2 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
            {automation.name || `Telegram Automation ${index + 1}`}
          </h3>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl bg-surface-low px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-text"
        >
          Remove
        </button>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="space-y-5">
          <div className="grid gap-4 lg:grid-cols-2">
            <InputField
              label="Name"
              value={automation.name}
              placeholder="Main setup"
              onChange={(value) => onChange({ ...automation, name: value })}
            />
            <InputField
              label="Destination channel"
              value={automation.destinationChannelUsername}
              placeholder="@your_channel"
              onChange={(value) => onChange({ ...automation, destinationChannelUsername: value })}
            />
          </div>

          <SourceModePicker automation={automation} onChange={onChange} />

          {automation.sourceMode === "official_hypd" ? (
            <div className="rounded-[1.4rem] border border-white/10 bg-surface-low px-4 py-4">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Source</p>
              <div className="mt-3 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/10 text-primary">
                  <SparklesIcon className="h-5 w-5" />
                </div>
                <div>
                  <p className="font-headline text-lg font-bold tracking-[-0.03em] text-text">
                    {OFFICIAL_HYPD_SOURCE_LABEL}
                  </p>
                  <p className="text-sm text-muted">{OFFICIAL_HYPD_SOURCE_CHANNEL}</p>
                </div>
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-2">
              <InputField
                label="Source channel"
                value={automation.sourceChannelId}
                placeholder="@source_channel"
                onChange={(value) =>
                  onChange({
                    ...automation,
                    sourceChannelId: value,
                    sourceChannelLabel: value
                  })
                }
              />
              <InputField
                label="Bot username"
                value={automation.botUsername}
                placeholder="@your_bot"
                onChange={(value) => onChange({ ...automation, botUsername: value })}
              />
            </div>
          )}

          <div className="grid gap-3 md:grid-cols-2">
            <ToggleRow
              label="Auto post"
              body="Post to channel."
              checked={automation.autoPostingEnabled}
              onChange={(value) => onChange({ ...automation, autoPostingEnabled: value })}
            />
            <ToggleRow
              label="Auto forward"
              body="Forward fresh deals."
              checked={automation.autoForwardEnabled}
              onChange={(value) => onChange({ ...automation, autoForwardEnabled: value })}
            />
            <ToggleRow
              label="Link convert"
              body="Use HYPD links."
              checked={automation.linkConversionEnabled}
              onChange={(value) => onChange({ ...automation, linkConversionEnabled: value })}
            />
            <ToggleRow
              label="Enabled"
              body="Keep it live."
              checked={automation.enabled}
              onChange={(value) => onChange({ ...automation, enabled: value })}
            />
          </div>

          <div className="rounded-[1.4rem] border border-white/10 bg-surface-low p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Post type</p>
                <p className="mt-1 text-sm text-muted">Choose how the post should appear.</p>
              </div>
            </div>
            <div className="mt-4">
              <FormatPicker
                value={automation.postFormat}
                onChange={(value) => onChange({ ...automation, postFormat: value })}
              />
            </div>
          </div>

          <details className="rounded-[1.4rem] border border-white/10 bg-surface-low p-4">
            <summary className="cursor-pointer list-none font-headline text-lg font-bold tracking-[-0.03em] text-text">
              Advanced
            </summary>
            <div className="mt-4 grid gap-4 lg:grid-cols-2">
              <InputField
                label="Posting window"
                value={automation.postingWindow}
                placeholder="10 AM, 2 PM, 8 PM"
                onChange={(value) => onChange({ ...automation, postingWindow: value })}
              />
              <InputField
                label="Destination channel ID"
                value={automation.destinationChannelId}
                placeholder="-100..."
                onChange={(value) => onChange({ ...automation, destinationChannelId: value })}
              />
              {automation.sourceMode === "custom_channel" ? (
                <InputField
                  label="Bot token"
                  value={automation.botToken}
                  placeholder="BotFather token"
                  onChange={(value) => onChange({ ...automation, botToken: value })}
                />
              ) : null}
              <TextAreaField
                label="Caption"
                value={automation.captionTemplate}
                placeholder="{title}\n{marketplace} {price}\n{link}"
                onChange={(value) => onChange({ ...automation, captionTemplate: value })}
              />
            </div>
          </details>
        </div>

        <div className="space-y-4">
          <div className="rounded-[1.5rem] bg-surface-low p-5">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Route</p>
            <div className="mt-4 flex items-center gap-3 text-sm text-text">
              <span className="rounded-full bg-white/10 px-3 py-2">
                {automation.sourceMode === "official_hypd" ? "HYPD Deals" : "Custom Source"}
              </span>
              <ArrowRightIcon className="h-4 w-4 text-muted" />
              <span className="rounded-full bg-white/10 px-3 py-2">HYPD Convert</span>
              <ArrowRightIcon className="h-4 w-4 text-muted" />
              <span className="rounded-full bg-white/10 px-3 py-2">Your Channel</span>
            </div>
          </div>

          <StepCard
            icon={<BotIcon className="h-5 w-5" />}
            title="1. Make bot admin"
            body="Add the bot to the destination channel as admin."
          />
          <StepCard
            icon={<LinkIcon className="h-5 w-5" />}
            title="2. Pick source"
            body="Use HYPD Deals or switch to your own source channel."
          />
          <StepCard
            icon={<SparklesIcon className="h-5 w-5" />}
            title="3. Save and run"
            body="Save once, then test instantly with Run now."
          />
        </div>
      </div>
    </article>
  );
}

export function ConnectGrid() {
  const [isReady, setIsReady] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [status, setStatus] = useState("Loading Telegram automation setup...");
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [telegramAutomations, setTelegramAutomations] = useState<TelegramAutomation[]>([]);
  const [officialBotConfigured, setOfficialBotConfigured] = useState(false);
  const [isRunningNow, setIsRunningNow] = useState(false);

  useEffect(() => {
    async function load() {
      const response = await fetch("/api/automation/telegram", { cache: "no-store" });
      const result = (await response.json()) as TelegramAutomationResponse;

      if (!response.ok || !result.ok) {
        setStatus(result.message ?? "Login required to configure Telegram automation.");
        setIsReady(true);
        return;
      }

      setTelegramAutomations(result.automations?.length ? result.automations : [createTelegramAutomation()]);
      setSavedAt(result.updatedAt ?? null);
      setOfficialBotConfigured(Boolean(result.officialBotConfigured));
      setStatus("Telegram automation loaded.");
      setIsReady(true);
    }

    load().catch(() => {
      setStatus("Unable to load Telegram automation right now.");
      setIsReady(true);
    });
  }, []);

  function addTelegramAutomation() {
    if (telegramAutomations.length >= MAX_AUTOMATIONS) return;
    setTelegramAutomations((current) => [...current, createTelegramAutomation()]);
  }

  async function saveTelegramAutomations() {
    setIsSaving(true);
    setStatus("Saving Telegram automation...");

    try {
      const response = await fetch("/api/automation/telegram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          automations: telegramAutomations
        })
      });
      const result = (await response.json()) as TelegramAutomationResponse;

      if (!response.ok || !result.ok) {
        setStatus(result.message ?? "Unable to save Telegram automation.");
        return;
      }

      setTelegramAutomations(result.automations?.length ? result.automations : telegramAutomations);
      setSavedAt(result.updatedAt ?? null);
      setOfficialBotConfigured(Boolean(result.officialBotConfigured));
      setStatus("Telegram automation saved.");
    } catch {
      setStatus("Unable to save Telegram automation right now.");
    } finally {
      setIsSaving(false);
    }
  }

  async function runTelegramAutomationNow() {
    setIsRunningNow(true);
    setStatus("Running Telegram automation now...");

    try {
      const response = await fetch("/api/automation/telegram/run", {
        method: "POST"
      });
      const result = (await response.json()) as TelegramRunResponse;

      if (!response.ok || !result.ok) {
        const firstError = result.results?.find((item) => !item.ok)?.message;
        setStatus(firstError ?? result.message ?? "Unable to run Telegram automation right now.");
        return;
      }

      const success = result.results?.find((item) => item.ok);
      setStatus(
        success?.postedDeal
          ? `Telegram automation posted: ${success.postedDeal}`
          : "Telegram automation ran successfully."
      );
    } catch {
      setStatus("Unable to run Telegram automation right now.");
    } finally {
      setIsRunningNow(false);
    }
  }

  if (!isReady) {
    return (
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-sm text-muted">{status}</p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Telegram automation</p>
            <h2 className="mt-2 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
              Telegram Bot Setup
            </h2>
            <p className="mt-2 text-sm text-muted">
              Source, destination, save, run.
            </p>
            <p className="mt-2 text-xs font-bold uppercase tracking-[0.24em] text-primary">
              {officialBotConfigured ? "Official bot ready" : "Official bot pending"}
            </p>
          </div>
          <button
            type="button"
            onClick={addTelegramAutomation}
            disabled={telegramAutomations.length >= MAX_AUTOMATIONS}
            className="rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Setup
          </button>
        </div>

        <div className="mt-6 space-y-5">
          {telegramAutomations.map((automation, index) => (
            <TelegramAutomationCard
              key={automation.id}
              automation={automation}
              index={index}
              onChange={(next) =>
                setTelegramAutomations((current) =>
                  current.map((item) => (item.id === automation.id ? next : item))
                )
              }
              onRemove={() =>
                setTelegramAutomations((current) =>
                  current.length === 1 ? current : current.filter((item) => item.id !== automation.id)
                )
              }
            />
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.18),rgba(138,35,135,0.34))] p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Actions</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">Save or run</h3>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text/85">{savedAt ? `Last saved at ${savedAt}` : "Not saved yet."}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-text/70">{status}</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={() => void runTelegramAutomationNow()}
              disabled={isRunningNow}
              className="rounded-xl bg-white/15 px-5 py-3 font-headline text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isRunningNow ? "Running..." : "Run Telegram Now"}
            </button>
            <button
              type="button"
              onClick={() => void saveTelegramAutomations()}
              disabled={isSaving}
              className="rounded-xl bg-white/15 px-5 py-3 font-headline text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {isSaving ? "Saving..." : "Save Telegram Automation"}
            </button>
          </div>
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">WhatsApp next</p>
        <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">WhatsApp coming next</h3>
      </section>
    </div>
  );
}
