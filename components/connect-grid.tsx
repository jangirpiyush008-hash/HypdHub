"use client";

import { useEffect, useState } from "react";

type TelegramConfig = {
  botToken: string;
  botUsername: string;
  channelUsername: string;
  channelId: string;
  adminUserId: string;
  webhookUrl: string;
};

type WhatsAppConfig = {
  businessName: string;
  businessNumber: string;
  phoneNumberId: string;
  wabaId: string;
  permanentToken: string;
  webhookVerifyToken: string;
  defaultTemplate: string;
};

type AutomationConfig = {
  conversionEnabled: boolean;
  autoForwardingEnabled: boolean;
  autoPostingEnabled: boolean;
  postingWindow: string;
  fallbackChannel: string;
  approvalRequired: boolean;
};

const telegramSteps = [
  "Create a Telegram bot with BotFather.",
  "Copy the bot token and bot username.",
  "Add the bot as admin in your Telegram deal channel.",
  "Capture the channel username or numeric channel ID.",
  "Add webhook and posting credentials on the server."
];

const whatsappSteps = [
  "Create a Meta developer app and enable WhatsApp Business Cloud API.",
  "Verify your business phone number and collect the Phone Number ID.",
  "Save the WABA ID and permanent access token.",
  "Create approved message templates for daily deals and fallback alerts.",
  "Set a webhook verify token and callback URL for automation events."
];

const featureRows = [
  {
    title: "Link convert",
    body: "Every marketplace or HYPD store URL should be converted into the creator's live HYPD link before sending."
  },
  {
    title: "Auto forwarder",
    body: "Approved deals can be forwarded automatically into the selected Telegram channel or WhatsApp flow."
  },
  {
    title: "Auto posting",
    body: "Scheduled pushes can publish the formatted top deals without manual copy-paste."
  }
];

function StorageNotice() {
  return (
    <div className="rounded-[1.35rem] bg-surface-low p-5">
      <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Current behavior</p>
      <p className="mt-3 text-sm leading-7 text-muted">
        These setup details are saved in this browser for now so creators can prepare their automation settings.
        Server-side saving and live bot execution can be wired next.
      </p>
    </div>
  );
}

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

export function ConnectGrid() {
  const [isReady, setIsReady] = useState(false);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [telegram, setTelegram] = useState<TelegramConfig>({
    botToken: "",
    botUsername: "",
    channelUsername: "",
    channelId: "",
    adminUserId: "",
    webhookUrl: ""
  });
  const [whatsApp, setWhatsApp] = useState<WhatsAppConfig>({
    businessName: "",
    businessNumber: "",
    phoneNumberId: "",
    wabaId: "",
    permanentToken: "",
    webhookVerifyToken: "",
    defaultTemplate: ""
  });
  const [automation, setAutomation] = useState<AutomationConfig>({
    conversionEnabled: true,
    autoForwardingEnabled: true,
    autoPostingEnabled: false,
    postingWindow: "",
    fallbackChannel: "",
    approvalRequired: true
  });

  useEffect(() => {
    const telegramStored = window.localStorage.getItem("hypd-connect-telegram");
    const whatsAppStored = window.localStorage.getItem("hypd-connect-whatsapp");
    const automationStored = window.localStorage.getItem("hypd-connect-automation");
    const savedAtStored = window.localStorage.getItem("hypd-connect-saved-at");

    if (telegramStored) setTelegram(JSON.parse(telegramStored) as TelegramConfig);
    if (whatsAppStored) setWhatsApp(JSON.parse(whatsAppStored) as WhatsAppConfig);
    if (automationStored) setAutomation(JSON.parse(automationStored) as AutomationConfig);
    if (savedAtStored) setSavedAt(savedAtStored);
    setIsReady(true);
  }, []);

  function saveDraft() {
    window.localStorage.setItem("hypd-connect-telegram", JSON.stringify(telegram));
    window.localStorage.setItem("hypd-connect-whatsapp", JSON.stringify(whatsApp));
    window.localStorage.setItem("hypd-connect-automation", JSON.stringify(automation));
    const timestamp = new Date().toLocaleString("en-IN");
    window.localStorage.setItem("hypd-connect-saved-at", timestamp);
    setSavedAt(timestamp);
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
      <div className="grid gap-5 lg:grid-cols-3">
        {featureRows.map((feature) => (
          <article key={feature.title} className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Automation feature</p>
            <h3 className="mt-4 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
              {feature.title}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{feature.body}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Telegram connection</p>
          <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
            Enter the details needed for Telegram automation
          </h3>
          <div className="mt-6 grid gap-4">
            <InputField
              label="Bot token"
              value={telegram.botToken}
              placeholder="Paste BotFather token"
              onChange={(value) => setTelegram((current) => ({ ...current, botToken: value }))}
            />
            <InputField
              label="Bot username"
              value={telegram.botUsername}
              placeholder="@your_bot_username"
              onChange={(value) => setTelegram((current) => ({ ...current, botUsername: value }))}
            />
            <InputField
              label="Channel username"
              value={telegram.channelUsername}
              placeholder="@your_deals_channel"
              onChange={(value) => setTelegram((current) => ({ ...current, channelUsername: value }))}
            />
            <InputField
              label="Channel ID"
              value={telegram.channelId}
              placeholder="-100..."
              onChange={(value) => setTelegram((current) => ({ ...current, channelId: value }))}
            />
            <InputField
              label="Admin user ID"
              value={telegram.adminUserId}
              placeholder="Telegram admin numeric ID"
              onChange={(value) => setTelegram((current) => ({ ...current, adminUserId: value }))}
            />
            <InputField
              label="Webhook URL"
              value={telegram.webhookUrl}
              placeholder="https://your-domain.com/api/telegram/webhook"
              onChange={(value) => setTelegram((current) => ({ ...current, webhookUrl: value }))}
            />
          </div>
          <div className="mt-6 space-y-3">
            {telegramSteps.map((step, index) => (
              <div key={step} className="rounded-[1.2rem] bg-surface-low px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Step {index + 1}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{step}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">WhatsApp connection</p>
          <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
            Enter the details needed for WhatsApp automation
          </h3>
          <div className="mt-6 grid gap-4">
            <InputField
              label="Business name"
              value={whatsApp.businessName}
              placeholder="Your HYPD business name"
              onChange={(value) => setWhatsApp((current) => ({ ...current, businessName: value }))}
            />
            <InputField
              label="Business number"
              value={whatsApp.businessNumber}
              placeholder="+91..."
              onChange={(value) => setWhatsApp((current) => ({ ...current, businessNumber: value }))}
            />
            <InputField
              label="Phone number ID"
              value={whatsApp.phoneNumberId}
              placeholder="Meta phone number ID"
              onChange={(value) => setWhatsApp((current) => ({ ...current, phoneNumberId: value }))}
            />
            <InputField
              label="WABA ID"
              value={whatsApp.wabaId}
              placeholder="WhatsApp Business Account ID"
              onChange={(value) => setWhatsApp((current) => ({ ...current, wabaId: value }))}
            />
            <InputField
              label="Permanent token"
              value={whatsApp.permanentToken}
              placeholder="Meta permanent access token"
              onChange={(value) => setWhatsApp((current) => ({ ...current, permanentToken: value }))}
            />
            <InputField
              label="Webhook verify token"
              value={whatsApp.webhookVerifyToken}
              placeholder="Custom verify token"
              onChange={(value) => setWhatsApp((current) => ({ ...current, webhookVerifyToken: value }))}
            />
            <InputField
              label="Default template"
              value={whatsApp.defaultTemplate}
              placeholder="daily_deal_template"
              onChange={(value) => setWhatsApp((current) => ({ ...current, defaultTemplate: value }))}
            />
          </div>
          <div className="mt-6 space-y-3">
            {whatsappSteps.map((step, index) => (
              <div key={step} className="rounded-[1.2rem] bg-surface-low px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Step {index + 1}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{step}</p>
              </div>
            ))}
          </div>
        </section>
      </div>

      <section className="rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.18),rgba(138,35,135,0.34))] p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Automation controls</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Configure conversion, auto-forwarding, and auto-posting
        </h3>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <ToggleRow
            label="Auto convert links"
            body="Convert every marketplace or HYPD storefront URL into the creator's HYPD link before sending."
            checked={automation.conversionEnabled}
            onChange={(next) => setAutomation((current) => ({ ...current, conversionEnabled: next }))}
          />
          <ToggleRow
            label="Auto forward approved deals"
            body="Forward approved deals automatically into the chosen Telegram and WhatsApp flows."
            checked={automation.autoForwardingEnabled}
            onChange={(next) => setAutomation((current) => ({ ...current, autoForwardingEnabled: next }))}
          />
          <ToggleRow
            label="Auto post scheduled deals"
            body="Publish top deals automatically during the selected posting window."
            checked={automation.autoPostingEnabled}
            onChange={(next) => setAutomation((current) => ({ ...current, autoPostingEnabled: next }))}
          />
          <ToggleRow
            label="Require approval before push"
            body="Keep manual approval enabled for sponsor pushes or sensitive deal campaigns."
            checked={automation.approvalRequired}
            onChange={(next) => setAutomation((current) => ({ ...current, approvalRequired: next }))}
          />
        </div>
        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <InputField
            label="Posting window"
            value={automation.postingWindow}
            placeholder="10:00 AM, 2:00 PM, 8:00 PM"
            onChange={(value) => setAutomation((current) => ({ ...current, postingWindow: value }))}
          />
          <InputField
            label="Fallback channel / list"
            value={automation.fallbackChannel}
            placeholder="VIP Telegram or WhatsApp backup list"
            onChange={(value) => setAutomation((current) => ({ ...current, fallbackChannel: value }))}
          />
        </div>
        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-text/85">
              {savedAt ? `Saved in this browser at ${savedAt}` : "No setup details saved yet."}
            </p>
          </div>
          <button
            type="button"
            onClick={saveDraft}
            className="rounded-xl bg-white/15 px-5 py-3 font-headline text-sm font-bold text-white backdrop-blur-sm transition-colors hover:bg-white/20"
          >
            Save connect details
          </button>
        </div>
      </section>

      <StorageNotice />
    </div>
  );
}
