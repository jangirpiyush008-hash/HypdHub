"use client";

import { useEffect, useState } from "react";
import {
  createTelegramAutomation,
  MAX_AUTOMATIONS,
  OFFICIAL_HYPD_SOURCE_LABEL,
  PostFormat,
  TelegramAutomation
} from "@/lib/automation-config";

type TelegramAutomationResponse = {
  ok: boolean;
  updatedAt?: string;
  automations?: TelegramAutomation[];
  message?: string;
};

const postFormats: Array<{ value: PostFormat; label: string }> = [
  { value: "with_image", label: "With image" },
  { value: "without_image", label: "Without image" },
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
        <p className="mt-2 text-sm leading-7 text-muted">{body}</p>
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
              sourceChannelLabel: OFFICIAL_HYPD_SOURCE_LABEL
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
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Telegram automation</p>
          <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
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

      <div className="mt-6 space-y-6">
        <div className="grid gap-4 lg:grid-cols-2">
          <InputField
            label="Automation name"
            value={automation.name}
            placeholder="Main Telegram posting flow"
            onChange={(value) => onChange({ ...automation, name: value })}
          />
          <InputField
            label="Posting window"
            value={automation.postingWindow}
            placeholder="10:00 AM, 2:00 PM, 8:00 PM"
            onChange={(value) => onChange({ ...automation, postingWindow: value })}
          />
        </div>

        <SourceModePicker automation={automation} onChange={onChange} />

        <div className="grid gap-4 lg:grid-cols-2">
          <InputField
            label="Source label"
            value={automation.sourceChannelLabel}
            placeholder="Official HYPD Deals Channel"
            onChange={(value) => onChange({ ...automation, sourceChannelLabel: value })}
          />
          <InputField
            label="Source channel ID"
            value={automation.sourceChannelId}
            placeholder="@hypd_official or -100..."
            onChange={(value) => onChange({ ...automation, sourceChannelId: value })}
          />
          <InputField
            label="Destination channel username"
            value={automation.destinationChannelUsername}
            placeholder="@your_destination_channel"
            onChange={(value) => onChange({ ...automation, destinationChannelUsername: value })}
          />
          <InputField
            label="Destination channel ID"
            value={automation.destinationChannelId}
            placeholder="-100..."
            onChange={(value) => onChange({ ...automation, destinationChannelId: value })}
          />
          <InputField
            label="Bot token"
            value={automation.botToken}
            placeholder="Paste BotFather token"
            onChange={(value) => onChange({ ...automation, botToken: value })}
          />
          <InputField
            label="Bot username"
            value={automation.botUsername}
            placeholder="@your_bot_username"
            onChange={(value) => onChange({ ...automation, botUsername: value })}
          />
          <InputField
            label="Admin user ID"
            value={automation.adminUserId}
            placeholder="Telegram admin numeric ID"
            onChange={(value) => onChange({ ...automation, adminUserId: value })}
          />
          <InputField
            label="Webhook URL"
            value={automation.webhookUrl}
            placeholder="https://your-domain.com/api/telegram/webhook"
            onChange={(value) => onChange({ ...automation, webhookUrl: value })}
          />
          <InputField
            label="Fallback target"
            value={automation.fallbackTarget}
            placeholder="Backup Telegram channel"
            onChange={(value) => onChange({ ...automation, fallbackTarget: value })}
          />
        </div>

        <TextAreaField
          label="Caption template"
          value={automation.captionTemplate}
          placeholder="Deal title\nOffer line\nAlways converted HYPD link\nCTA"
          onChange={(value) => onChange({ ...automation, captionTemplate: value })}
        />

        <FormatPicker
          value={automation.postFormat}
          onChange={(value) => onChange({ ...automation, postFormat: value })}
        />

        <div className="grid gap-4 lg:grid-cols-2">
          <ToggleRow
            label="Link convert"
            body="Always convert source links into the creator's HYPD trackable link before posting."
            checked={automation.linkConversionEnabled}
            onChange={(value) => onChange({ ...automation, linkConversionEnabled: value })}
          />
          <ToggleRow
            label="Auto forward"
            body="Forward eligible deals from the chosen source channel into the destination channel automatically."
            checked={automation.autoForwardEnabled}
            onChange={(value) => onChange({ ...automation, autoForwardEnabled: value })}
          />
          <ToggleRow
            label="Auto posting"
            body="Auto post on schedule to the destination channel."
            checked={automation.autoPostingEnabled}
            onChange={(value) => onChange({ ...automation, autoPostingEnabled: value })}
          />
          <ToggleRow
            label="Automation enabled"
            body="Keep this Telegram automation active."
            checked={automation.enabled}
            onChange={(value) => onChange({ ...automation, enabled: value })}
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
      setStatus("Telegram automation saved.");
    } catch {
      setStatus("Unable to save Telegram automation right now.");
    } finally {
      setIsSaving(false);
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
      <section className="grid gap-5 lg:grid-cols-3">
        {[
          {
            title: "Top trending deals",
            body: "Deals refresh every 2 hours from backend sources and show real marketplace links on the site."
          },
          {
            title: "Official or custom source",
            body: "Creators can use the official HYPD Telegram source channel or add their own source channel."
          },
          {
            title: "HYPD links only",
            body: "Outgoing posts should always use HYPD-converted links so commission stays tracked in the creator's HYPD account."
          }
        ].map((item) => (
          <article key={item.title} className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Telegram-first rollout</p>
            <h3 className="mt-4 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">{item.title}</h3>
            <p className="mt-3 text-sm leading-7 text-muted">{item.body}</p>
          </article>
        ))}
      </section>

      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Telegram automation</p>
            <h2 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
              Add up to {MAX_AUTOMATIONS} Telegram automations
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Each automation can pick the official HYPD source channel or a custom source channel, then post into the creator's
              destination channel with automatic HYPD link conversion, forwarding, and scheduled posting.
            </p>
          </div>
          <button
            type="button"
            onClick={addTelegramAutomation}
            disabled={telegramAutomations.length >= MAX_AUTOMATIONS}
            className="rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add Telegram Automation
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
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Save Telegram setup</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Keep Telegram automation ready on the backend
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text/85">
          These Telegram automations are now saved on the backend per logged-in HYPD creator, not only in the browser.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text/85">{savedAt ? `Last saved at ${savedAt}` : "Not saved yet."}</p>
            <p className="mt-2 text-xs uppercase tracking-[0.24em] text-text/70">{status}</p>
          </div>
          <button
            type="button"
            onClick={() => void saveTelegramAutomations()}
            disabled={isSaving}
            className="rounded-xl bg-white/15 px-5 py-3 font-headline text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSaving ? "Saving..." : "Save Telegram Automation"}
          </button>
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">WhatsApp next</p>
        <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
          WhatsApp automation will be wired after Telegram
        </h3>
        <p className="mt-3 text-sm leading-7 text-muted">
          The next backend step for WhatsApp will use business credentials, templates, and webhook setup. Once you
          share those details, we can wire WhatsApp with the same HYPD link-conversion rule.
        </p>
      </section>
    </div>
  );
}
