"use client";

import { useEffect, useState } from "react";
import {
  AUTOMATIONS_SAVED_AT_KEY,
  createTelegramAutomation,
  createWhatsAppAutomation,
  MAX_AUTOMATIONS,
  PostFormat,
  TELEGRAM_AUTOMATIONS_KEY,
  TelegramAutomation,
  WHATSAPP_AUTOMATIONS_KEY,
  WhatsAppAutomation
} from "@/lib/automation-config";

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
  body,
  checked,
  onChange
}: {
  label: string;
  body: string;
  checked: boolean;
  onChange: (next: boolean) => void;
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
        aria-pressed={checked}
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

function AutomationCardShell({
  title,
  subtitle,
  onRemove,
  children
}: {
  title: string;
  subtitle: string;
  onRemove: () => void;
  children: React.ReactNode;
}) {
  return (
    <article className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{subtitle}</p>
          <h3 className="mt-3 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">{title}</h3>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="rounded-xl bg-surface-low px-4 py-2 text-xs font-bold uppercase tracking-[0.24em] text-text"
        >
          Remove
        </button>
      </div>
      <div className="mt-6 space-y-6">{children}</div>
    </article>
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
    <AutomationCardShell
      title={automation.name || `Telegram Automation ${index + 1}`}
      subtitle="Telegram automation"
      onRemove={onRemove}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <InputField
          label="Automation name"
          value={automation.name}
          placeholder="Main Telegram Channel"
          onChange={(value) => onChange({ ...automation, name: value })}
        />
        <InputField
          label="Source"
          value={automation.sourceLabel}
          placeholder="Live deals feed"
          onChange={(value) => onChange({ ...automation, sourceLabel: value })}
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
          label="Channel username"
          value={automation.channelUsername}
          placeholder="@your_deals_channel"
          onChange={(value) => onChange({ ...automation, channelUsername: value })}
        />
        <InputField
          label="Channel ID"
          value={automation.channelId}
          placeholder="-100..."
          onChange={(value) => onChange({ ...automation, channelId: value })}
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
          label="Posting window"
          value={automation.postingWindow}
          placeholder="10:00 AM, 2:00 PM, 8:00 PM"
          onChange={(value) => onChange({ ...automation, postingWindow: value })}
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
        placeholder="Deal title\nOffer line\nHYPD link\nCTA"
        onChange={(value) => onChange({ ...automation, captionTemplate: value })}
      />

      <FormatPicker
        value={automation.postFormat}
        onChange={(value) => onChange({ ...automation, postFormat: value })}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ToggleRow
          label="Link convert"
          body="Always convert the outgoing link into the creator's HYPD trackable link."
          checked={automation.linkConversionEnabled}
          onChange={(value) => onChange({ ...automation, linkConversionEnabled: value })}
        />
        <ToggleRow
          label="Auto forward"
          body="Forward eligible deals automatically into this Telegram destination."
          checked={automation.autoForwardEnabled}
          onChange={(value) => onChange({ ...automation, autoForwardEnabled: value })}
        />
        <ToggleRow
          label="Auto posting"
          body="Publish scheduled deals automatically without manual copy-paste."
          checked={automation.autoPostingEnabled}
          onChange={(value) => onChange({ ...automation, autoPostingEnabled: value })}
        />
        <ToggleRow
          label="Automation enabled"
          body="Keep this automation active and ready to run."
          checked={automation.enabled}
          onChange={(value) => onChange({ ...automation, enabled: value })}
        />
      </div>
    </AutomationCardShell>
  );
}

function WhatsAppAutomationCard({
  automation,
  index,
  onChange,
  onRemove
}: {
  automation: WhatsAppAutomation;
  index: number;
  onChange: (next: WhatsAppAutomation) => void;
  onRemove: () => void;
}) {
  return (
    <AutomationCardShell
      title={automation.name || `WhatsApp Automation ${index + 1}`}
      subtitle="WhatsApp automation"
      onRemove={onRemove}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <InputField
          label="Automation name"
          value={automation.name}
          placeholder="Main WhatsApp Broadcast"
          onChange={(value) => onChange({ ...automation, name: value })}
        />
        <InputField
          label="Source"
          value={automation.sourceLabel}
          placeholder="Live deals feed"
          onChange={(value) => onChange({ ...automation, sourceLabel: value })}
        />
        <InputField
          label="Business name"
          value={automation.businessName}
          placeholder="Your HYPD business name"
          onChange={(value) => onChange({ ...automation, businessName: value })}
        />
        <InputField
          label="Business number"
          value={automation.businessNumber}
          placeholder="+91..."
          onChange={(value) => onChange({ ...automation, businessNumber: value })}
        />
        <InputField
          label="Phone number ID"
          value={automation.phoneNumberId}
          placeholder="Meta phone number ID"
          onChange={(value) => onChange({ ...automation, phoneNumberId: value })}
        />
        <InputField
          label="WABA ID"
          value={automation.wabaId}
          placeholder="WhatsApp Business Account ID"
          onChange={(value) => onChange({ ...automation, wabaId: value })}
        />
        <InputField
          label="Permanent token"
          value={automation.permanentToken}
          placeholder="Meta permanent access token"
          onChange={(value) => onChange({ ...automation, permanentToken: value })}
        />
        <InputField
          label="Webhook verify token"
          value={automation.webhookVerifyToken}
          placeholder="Custom verify token"
          onChange={(value) => onChange({ ...automation, webhookVerifyToken: value })}
        />
        <InputField
          label="Default template"
          value={automation.defaultTemplate}
          placeholder="daily_deal_template"
          onChange={(value) => onChange({ ...automation, defaultTemplate: value })}
        />
        <InputField
          label="Posting window"
          value={automation.postingWindow}
          placeholder="11:00 AM and 7:00 PM"
          onChange={(value) => onChange({ ...automation, postingWindow: value })}
        />
        <InputField
          label="Fallback target"
          value={automation.fallbackTarget}
          placeholder="Backup WhatsApp list"
          onChange={(value) => onChange({ ...automation, fallbackTarget: value })}
        />
      </div>

      <TextAreaField
        label="Caption template"
        value={automation.captionTemplate}
        placeholder="Short deal copy\nOffer line\nHYPD link\nCTA"
        onChange={(value) => onChange({ ...automation, captionTemplate: value })}
      />

      <FormatPicker
        value={automation.postFormat}
        onChange={(value) => onChange({ ...automation, postFormat: value })}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <ToggleRow
          label="Link convert"
          body="Always convert marketplace or storefront links into the creator's HYPD trackable link."
          checked={automation.linkConversionEnabled}
          onChange={(value) => onChange({ ...automation, linkConversionEnabled: value })}
        />
        <ToggleRow
          label="Auto forward"
          body="Forward eligible deals automatically into this WhatsApp automation."
          checked={automation.autoForwardEnabled}
          onChange={(value) => onChange({ ...automation, autoForwardEnabled: value })}
        />
        <ToggleRow
          label="Auto posting"
          body="Publish scheduled deals automatically to the configured WhatsApp flow."
          checked={automation.autoPostingEnabled}
          onChange={(value) => onChange({ ...automation, autoPostingEnabled: value })}
        />
        <ToggleRow
          label="Automation enabled"
          body="Keep this automation active and ready to run."
          checked={automation.enabled}
          onChange={(value) => onChange({ ...automation, enabled: value })}
        />
      </div>
    </AutomationCardShell>
  );
}

function StorageNotice({ savedAt }: { savedAt: string | null }) {
  return (
    <div className="rounded-[1.35rem] bg-surface-low p-5">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Current behavior</p>
      <p className="mt-3 text-sm leading-7 text-muted">
        These automation details are stored for now so users can configure up to five Telegram and five WhatsApp
        automations with link conversion, auto forwarding, auto posting, and image-mode preferences.
      </p>
      <p className="mt-3 text-sm text-muted">{savedAt ? `Last saved at ${savedAt}` : "Nothing saved yet."}</p>
    </div>
  );
}

export function ConnectGrid() {
  const [isReady, setIsReady] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [telegramAutomations, setTelegramAutomations] = useState<TelegramAutomation[]>([]);
  const [whatsAppAutomations, setWhatsAppAutomations] = useState<WhatsAppAutomation[]>([]);

  useEffect(() => {
    const telegramStored = window.localStorage.getItem(TELEGRAM_AUTOMATIONS_KEY);
    const whatsAppStored = window.localStorage.getItem(WHATSAPP_AUTOMATIONS_KEY);
    const savedAtStored = window.localStorage.getItem(AUTOMATIONS_SAVED_AT_KEY);

    setTelegramAutomations(
      telegramStored ? (JSON.parse(telegramStored) as TelegramAutomation[]) : [createTelegramAutomation()]
    );
    setWhatsAppAutomations(
      whatsAppStored ? (JSON.parse(whatsAppStored) as WhatsAppAutomation[]) : [createWhatsAppAutomation()]
    );
    if (savedAtStored) setSavedAt(savedAtStored);
    setIsReady(true);
  }, []);

  function saveDraft() {
    window.localStorage.setItem(TELEGRAM_AUTOMATIONS_KEY, JSON.stringify(telegramAutomations));
    window.localStorage.setItem(WHATSAPP_AUTOMATIONS_KEY, JSON.stringify(whatsAppAutomations));
    const timestamp = new Date().toLocaleString("en-IN");
    window.localStorage.setItem(AUTOMATIONS_SAVED_AT_KEY, timestamp);
    setSavedAt(timestamp);
  }

  function addTelegramAutomation() {
    if (telegramAutomations.length >= MAX_AUTOMATIONS) return;
    setTelegramAutomations((current) => [...current, createTelegramAutomation()]);
  }

  function addWhatsAppAutomation() {
    if (whatsAppAutomations.length >= MAX_AUTOMATIONS) return;
    setWhatsAppAutomations((current) => [...current, createWhatsAppAutomation()]);
  }

  if (!isReady) {
    return (
      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <p className="text-sm text-muted">Loading connect workspace...</p>
      </section>
    );
  }

  return (
    <div className="space-y-8">
      <section className="grid gap-5 lg:grid-cols-3">
        {[
          {
            title: "Link convert",
            body: "Every outgoing marketplace or HYPD storefront URL should be converted into the creator's own HYPD link first."
          },
          {
            title: "Auto forward",
            body: "Deals can be forwarded automatically into each configured Telegram channel or WhatsApp automation."
          },
          {
            title: "Auto posting",
            body: "Each automation can post with image, without image, or both, based on the user's posting style."
          }
        ].map((feature) => (
          <article key={feature.title} className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Automation feature</p>
            <h3 className="mt-4 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{feature.body}</p>
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
              Each Telegram automation can convert links, auto forward deals, auto post by schedule, and choose
              whether posts go with image, without image, or both.
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

      <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">WhatsApp automation</p>
            <h2 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
              Add up to {MAX_AUTOMATIONS} WhatsApp automations
            </h2>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-muted">
              Each WhatsApp automation can convert links, auto forward approved deals, auto post on schedule,
              and choose whether messages go with image, without image, or both.
            </p>
          </div>
          <button
            type="button"
            onClick={addWhatsAppAutomation}
            disabled={whatsAppAutomations.length >= MAX_AUTOMATIONS}
            className="rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-50"
          >
            Add WhatsApp Automation
          </button>
        </div>
        <div className="mt-6 space-y-5">
          {whatsAppAutomations.map((automation, index) => (
            <WhatsAppAutomationCard
              key={automation.id}
              automation={automation}
              index={index}
              onChange={(next) =>
                setWhatsAppAutomations((current) =>
                  current.map((item) => (item.id === automation.id ? next : item))
                )
              }
              onRemove={() =>
                setWhatsAppAutomations((current) =>
                  current.length === 1 ? current : current.filter((item) => item.id !== automation.id)
                )
              }
            />
          ))}
        </div>
      </section>

      <section className="rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.18),rgba(138,35,135,0.34))] p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Save automation setup</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Keep these automations ready for live execution
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text/85">
          These settings prepare the product for creator-specific automation. The next backend layer will execute
          link conversion, auto forwarding, and auto posting from these saved configurations.
        </p>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-text/85">
            {savedAt ? `Saved at ${savedAt}` : "Save once after editing your automations."}
          </p>
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-xl bg-white/15 px-5 py-3 font-headline text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Save automation setup
          </button>
        </div>
      </section>

      <StorageNotice savedAt={savedAt} />
    </div>
  );
}
