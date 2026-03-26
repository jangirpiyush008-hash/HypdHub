const setupCards = [
  {
    name: "Telegram setup",
    status: "Bot tutorial",
    body: "Create a Telegram bot, capture the token, attach your channel, and start posting deals with structured captions."
  },
  {
    name: "WhatsApp setup",
    status: "Cloud API tutorial",
    body: "Connect Meta WhatsApp Business, verify the phone number, configure templates, and route deal messages safely."
  },
  {
    name: "Automation setup",
    status: "End-to-end workflow",
    body: "Automate source collection, ranking, caption generation, and publishing so both channels stay updated on schedule."
  }
];

const telegramSteps = [
  "Create a bot in Telegram with BotFather and save the bot token in your server environment.",
  "Create a Telegram channel or group for deals, then add the bot as an admin with permission to post messages.",
  "Set up commands like /start, /deals, /top10, and /convert so users can request fresh links or daily picks.",
  "Map Telegram posting to your ranked deal output so every message includes product title, offer, price, and HYPD link.",
  "Test with a private channel first, then switch to your public broadcast channel after formatting is approved."
];

const whatsappSteps = [
  "Create a Meta developer app, enable the WhatsApp Business Cloud API, and connect your business number.",
  "Verify the phone number, create access credentials, and keep those keys on the server side only.",
  "Define approved message templates for daily deals, manual pushes, and fallback support replies.",
  "Send deal data from your ranking engine into a WhatsApp formatter that returns short copy, CTA text, and HYPD link.",
  "Run outbound tests with a small audience first so you can review delivery quality, template approval, and click behavior."
];

const automationSteps = [
  "Pull deals from marketplaces and HYPD-supported sources on a fixed schedule.",
  "Score the deals using discount, demand, price band, category fit, and manual business priorities.",
  "Store the top candidates in a queue so creators or ops can approve, skip, or boost each deal.",
  "Generate channel-ready copy for Telegram and WhatsApp with links, short hooks, and offer highlights.",
  "Publish automatically at set times, then track clicks and adjust tomorrow's ranking rules based on performance."
];

const automationRules = [
  "Use one source-of-truth queue so Telegram and WhatsApp never drift out of sync.",
  "Keep a manual approval option for sponsored pushes and time-sensitive hero deals.",
  "Add fallback logic for failed posts, expired products, or missing HYPD conversion responses.",
  "Track which template worked best per platform, because Telegram and WhatsApp audiences often react differently."
];

export function ConnectGrid() {
  return (
    <div className="space-y-8">
      <div className="grid gap-5 lg:grid-cols-3">
        {setupCards.map((card, index) => (
          <article
            key={card.name}
            className={`rounded-[1.75rem] p-6 shadow-ambient ${
              index === 1
                ? "bg-[linear-gradient(180deg,rgba(255,171,243,0.18),rgba(138,35,135,0.34))]"
                : "bg-surface-card"
            }`}
          >
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">{card.status}</p>
            <h3 className="mt-4 font-headline text-2xl font-extrabold tracking-[-0.04em] text-text">
              {card.name}
            </h3>
            <p className="mt-3 text-sm leading-7 text-muted">{card.body}</p>
          </article>
        ))}
      </div>

      <div className="grid gap-5 xl:grid-cols-2">
        <article className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Telegram tutorial</p>
          <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
            Connect your Telegram deal flow
          </h3>
          <div className="mt-6 space-y-3">
            {telegramSteps.map((step, index) => (
              <div key={step} className="rounded-[1.25rem] bg-surface-low px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Step {index + 1}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{step}</p>
              </div>
            ))}
          </div>
        </article>

        <article className="rounded-[1.75rem] bg-surface-card p-6 shadow-ambient">
          <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">WhatsApp tutorial</p>
          <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
            Connect your WhatsApp distribution flow
          </h3>
          <div className="mt-6 space-y-3">
            {whatsappSteps.map((step, index) => (
              <div key={step} className="rounded-[1.25rem] bg-surface-low px-4 py-4">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Step {index + 1}</p>
                <p className="mt-2 text-sm leading-7 text-muted">{step}</p>
              </div>
            ))}
          </div>
        </article>
      </div>

      <article className="rounded-[1.75rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.18),rgba(138,35,135,0.34))] p-6 shadow-ambient">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Automation tutorial</p>
        <h3 className="mt-3 font-headline text-3xl font-extrabold tracking-[-0.04em] text-text">
          Automate the full process for Telegram and WhatsApp
        </h3>
        <p className="mt-3 max-w-3xl text-sm leading-7 text-text/85">
          The strongest setup is one pipeline that collects deals once, ranks them once, and then formats
          the output separately for each platform. That keeps your content aligned while still respecting the
          format differences between Telegram and WhatsApp.
        </p>
        <div className="mt-6 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-3">
            {automationSteps.map((step, index) => (
              <div key={step} className="rounded-[1.25rem] bg-white/10 px-4 py-4 backdrop-blur-sm">
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Phase {index + 1}</p>
                <p className="mt-2 text-sm leading-7 text-text">{step}</p>
              </div>
            ))}
          </div>
          <div className="rounded-[1.5rem] bg-white/10 p-5 backdrop-blur-sm">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">Best practices</p>
            <div className="mt-4 space-y-3">
              {automationRules.map((rule) => (
                <div key={rule} className="rounded-[1.15rem] bg-black/10 px-4 py-4 text-sm leading-7 text-text">
                  {rule}
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}
