import { Api, TelegramClient } from "telegram";
import { StringSession } from "telegram/sessions/index.js";
import { validateInternetDeals } from "@/lib/integrations/marketplaces";
import { enrichDealsWithHistory, refreshDealHistory } from "@/lib/runtime/deal-history";
import { InternetDeal } from "@/lib/types";

type TelegramChannelAccess =
  | "readable_now"
  | "not_joined"
  | "addlist_needs_expansion"
  | "rate_limited_temp";

type TelegramChannelSource = {
  id: number;
  url: string;
  handle: string | null;
  title: string | null;
  access: TelegramChannelAccess;
  marketplaceFocus: string[];
};

type TelegramSummary = Awaited<ReturnType<typeof fetchTelegramSignalSummary>>;

type TelegramCache = {
  fetchedAt: number;
  summary: TelegramSummary;
  deals: InternetDeal[];
  topDealsByMarketplace: Record<string, InternetDeal[]>;
};

type SupportedMarketplace = InternetDeal["marketplace"];

const REFRESH_WINDOW_HOURS = 2;
const REFRESH_WINDOW_MS = REFRESH_WINDOW_HOURS * 60 * 60 * 1000;
const MESSAGE_LIMIT_PER_CHANNEL = 35;
// Total budget for the full Telegram fetch path (connect → iterate every
// readable channel → parse URLs → validate). 34 channels at ~300-800ms
// each plus per-deal validation easily blows past a few seconds, so the
// previous 5_000ms cap was guaranteeing zero deals. Give it a real
// budget that fits inside the worker's 25-minute job timeout.
const TELEGRAM_FETCH_TIMEOUT_MS = 180_000;

const telegramChannels: TelegramChannelSource[] = [
  { id: 1, url: "https://t.me/+kTvbwlaPbH1mM2E1", handle: null, title: "Offerzone 3.0", access: "readable_now", marketplaceFocus: ["Myntra", "Flipkart", "Amazon"] },
  { id: 2, url: "https://t.me/addlist/tYS3168v3CAzN2Y1", handle: null, title: null, access: "addlist_needs_expansion", marketplaceFocus: ["Mixed"] },
  { id: 3, url: "https://t.me/+10LxDtJO6SIxZGM1", handle: null, title: "Magixdeals 2.0", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 4, url: "https://t.me/Loot_DealsX", handle: "Loot_DealsX", title: "Trending Loot Deals", access: "readable_now", marketplaceFocus: ["Amazon", "Flipkart"] },
  { id: 5, url: "https://t.me/+lEEQraQyKwljNGQ1", handle: null, title: "Offer Box 2.0", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 6, url: "https://t.me/dealdost", handle: "dealdost", title: "Dealdost", access: "readable_now", marketplaceFocus: ["Amazon", "Flipkart", "Myntra"] },
  { id: 7, url: "https://t.me/+F3S5BE_u6gE4Yjc1", handle: null, title: "GrowDealz - Shopping Deals & Offers", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 8, url: "https://t.me/indlootdeals", handle: "indlootdeals", title: "IND Loot Deals", access: "readable_now", marketplaceFocus: ["Amazon", "Flipkart"] },
  { id: 9, url: "https://t.me/addlist/kuItf28wEAE2ZTBl", handle: null, title: null, access: "addlist_needs_expansion", marketplaceFocus: ["Mixed"] },
  { id: 10, url: "https://t.me/+_WhgYzSWa8UwNmE1", handle: null, title: "Discount Deals Live 2", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 11, url: "https://t.me/+UdmfyH1wg4k4MDRl", handle: null, title: "OFFER LOOTERS", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 12, url: "https://t.me/+qOb_vqtJQahkMmM9", handle: null, title: null, access: "not_joined", marketplaceFocus: ["Mixed"] },
  { id: 13, url: "https://t.me/rapiddeals_unlimited", handle: "rapiddeals_unlimited", title: "Rapid Deals Unlimited", access: "readable_now", marketplaceFocus: ["Amazon", "Flipkart", "Shopsy"] },
  { id: 14, url: "https://t.me/+SHMJO014m9MxNDFl", handle: null, title: "QUICK DEALS 2.0", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 15, url: "https://t.me/mspdealsofficial", handle: "mspdealsofficial", title: "MSP Deals", access: "readable_now", marketplaceFocus: ["Myntra", "Amazon", "Flipkart"] },
  { id: 16, url: "https://t.me/RaredealsX", handle: "RaredealsX", title: "RARE DEALS", access: "readable_now", marketplaceFocus: ["Ajio", "Myntra", "Flipkart"] },
  { id: 17, url: "https://t.me/nikhilfkm", handle: "nikhilfkm", title: "FKM By Nikhil", access: "readable_now", marketplaceFocus: ["Flipkart", "Shopsy"] },
  { id: 18, url: "https://t.me/nonstopdeals", handle: "nonstopdeals", title: "NonStopDeals", access: "readable_now", marketplaceFocus: ["Amazon", "Flipkart"] },
  { id: 19, url: "https://t.me/+87hjP41TjrJjNmY9", handle: null, title: "Elite Deals", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 20, url: "https://t.me/+7ufF-z6CPo8zYzI1", handle: null, title: "Premium Deals", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 21, url: "https://t.me/+Sxbr5rxf5wNl7-NW", handle: null, title: "Loot Deals Official", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 22, url: "https://t.me/+KgUrCwnDny02ZDk1", handle: null, title: "Deals point", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 23, url: "https://t.me/+qY-Q9jrNB181YmE1", handle: null, title: null, access: "not_joined", marketplaceFocus: ["Mixed"] },
  { id: 24, url: "https://t.me/+MFd-niD2wJJiZjBl", handle: null, title: "Hot Deals", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 25, url: "https://t.me/+yqgcolaIc-BjNDBl", handle: null, title: "Deals Velocity", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 26, url: "https://t.me/TrickXpert", handle: "TrickXpert", title: "Trick Xpert (Loots & Deals)", access: "readable_now", marketplaceFocus: ["Amazon", "Flipkart", "Myntra"] },
  { id: 27, url: "https://t.me/+hTJVrdcJhh40M2I1", handle: null, title: null, access: "not_joined", marketplaceFocus: ["Mixed"] },
  { id: 28, url: "https://telegram.me/+U73hXkdre7hxyQ6H", handle: null, title: "India Loots", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 29, url: "https://telegram.me/+-8rgA-qcVohjMmY1", handle: null, title: "Khatarnak [loot Deals & offers]", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 30, url: "https://t.me/Mojdealzone", handle: "Mojdealzone", title: "Mojdealzone", access: "readable_now", marketplaceFocus: ["Amazon", "Flipkart", "Nykaa"] },
  { id: 31, url: "https://t.me/+EA1nJVHLfPw0YzQ1", handle: null, title: null, access: "not_joined", marketplaceFocus: ["Mixed"] },
  { id: 32, url: "https://t.me/+Th6aG5Zaxz_i_u7a", handle: null, title: "Offer Box Official", access: "readable_now", marketplaceFocus: ["Mixed"] },
  { id: 33, url: "https://t.me/+0gqlB6-vq8I4OWJl", handle: null, title: null, access: "rate_limited_temp", marketplaceFocus: ["Mixed"] }
  ,
  { id: 34, url: "https://t.me/hypdeals", handle: "hypdeals", title: "Official HYPD Deals", access: "readable_now", marketplaceFocus: ["Mixed"] }
];

const supportedMarketplaces: SupportedMarketplace[] = [
  "Myntra",
  "Meesho",
  "Flipkart",
  "Shopsy",
  "Ajio",
  "Nykaa",
  "HYPD"
];

function getEnv(name: string) {
  return process.env[name]?.trim() ?? "";
}

function getTelegramClient() {
  const apiId = Number(getEnv("TELEGRAM_API_ID"));
  const apiHash = getEnv("TELEGRAM_API_HASH");
  const session = getEnv("TELEGRAM_SESSION_STRING");

  if (!apiId || !apiHash || !session) {
    return null;
  }

  return new TelegramClient(new StringSession(session), apiId, apiHash, {
    connectionRetries: 1
  });
}

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const timeout = setTimeout(() => {
        reject(new Error(`${label} timed out after ${timeoutMs}ms`));
      }, timeoutMs);

      timeout.unref?.();
    })
  ]);
}

function buildEmptyTelegramDeals(summary: TelegramSummary): TelegramCache {
  return {
    fetchedAt: Date.now(),
    summary,
    deals: [],
    topDealsByMarketplace: {}
  };
}

function parseChannel(url: string) {
  const normalized = url.replace(/^https?:\/\/(t|telegram)\.me\//, "");

  if (normalized.startsWith("addlist/")) {
    return { kind: "addlist" as const, value: normalized.replace("addlist/", "") };
  }

  if (normalized.startsWith("+")) {
    return { kind: "invite" as const, value: normalized.slice(1) };
  }

  return { kind: "public" as const, value: normalized };
}

function detectMarketplaceFromUrl(rawUrl: string): SupportedMarketplace | null {
  try {
    const url = new URL(rawUrl);
    const host = url.hostname.toLowerCase();

    if (host.includes("myntra")) return "Myntra";
    if (host.includes("meesho")) return "Meesho";
    if (host.includes("flipkart")) return "Flipkart";
    if (host.includes("shopsy")) return "Shopsy";
    if (host.includes("ajio")) return "Ajio";
    if (host.includes("nykaa")) return "Nykaa";

    return null;
  } catch {
    return null;
  }
}

async function resolveMarketplaceUrl(rawUrl: string) {
  const direct = canonicalizeMarketplaceUrl(rawUrl);

  if (direct) {
    return {
      ...direct,
      resolvedUrl: rawUrl
    };
  }

  try {
    const url = new URL(rawUrl);

    if (!url.hostname.includes("hypd.store")) {
      return null;
    }

    const response = await fetch(rawUrl, {
      method: "GET",
      redirect: "follow",
      cache: "no-store"
    });

    const finalUrl = response.url || rawUrl;
    const normalized = canonicalizeMarketplaceUrl(finalUrl);

    if (!normalized) {
      return null;
    }

    return {
      ...normalized,
      resolvedUrl: finalUrl
    };
  } catch {
    return null;
  }
}

function canonicalizeMarketplaceUrl(rawUrl: string) {
  try {
    const url = new URL(rawUrl);
    const marketplace = detectMarketplaceFromUrl(rawUrl);

    if (!marketplace) {
      return null;
    }

    url.hash = "";

    if (marketplace === "Flipkart" || marketplace === "Shopsy") {
      const cleaned = url.pathname.replace(/\/+$/, "");
      return { marketplace, canonicalUrl: `https://${url.hostname}${cleaned}` };
    }

    if (marketplace === "Myntra" || marketplace === "Ajio" || marketplace === "Nykaa") {
      const cleaned = url.pathname.replace(/\/+$/, "");
      return { marketplace, canonicalUrl: `https://${url.hostname}${cleaned}` };
    }

    return { marketplace, canonicalUrl: url.toString() };
  } catch {
    return null;
  }
}

function extractUrls(text: string) {
  return Array.from(text.matchAll(/https?:\/\/[^\s)]+/g)).map((match) => match[0]);
}

function inferCategory(text: string) {
  const lowered = text.toLowerCase();

  if (/(serum|shampoo|sunscreen|cream|makeup|lip|face|body wash|skincare)/.test(lowered)) return "Beauty";
  if (/(shirt|jacket|dress|fashion|tee|sweatshirt|kurta|shoes|sneaker)/.test(lowered)) return "Fashion";
  if (/(watch|earbuds|headphone|speaker|audio|mobile|laptop|tv)/.test(lowered)) return "Audio";
  if (/(chair|home|kitchen|sofa|decor)/.test(lowered)) return "Home";

  return "General";
}

function extractTitle(text: string, canonicalUrl: string) {
  const lines = text
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .filter((line) => !line.includes("http://") && !line.includes("https://"));

  const firstLine = lines.find((line) => line.length > 6);
  if (firstLine) {
    return firstLine.slice(0, 140);
  }

  try {
    const url = new URL(canonicalUrl);
    const slug = url.pathname.split("/").filter(Boolean).pop() ?? "deal";
    return slug.replace(/[-_]+/g, " ").replace(/\b\w/g, (char) => char.toUpperCase());
  } catch {
    return "Marketplace Deal";
  }
}

function extractPrices(text: string) {
  const matches = Array.from(text.matchAll(/(?:₹|rs\.?|inr)\s*([0-9][0-9,]{1,8})/gi)).map((match) =>
    Number(match[1].replace(/,/g, ""))
  );

  if (matches.length === 0) {
    return { currentPrice: null, originalPrice: null, discountPercent: null };
  }

  const currentPrice = Math.min(...matches);
  const originalPrice = matches.length > 1 ? Math.max(...matches) : null;
  const discountPercent =
    originalPrice && originalPrice > currentPrice
      ? Math.round(((originalPrice - currentPrice) / originalPrice) * 100)
      : null;

  return { currentPrice, originalPrice, discountPercent };
}

function getFreshnessHours(lastSeenAt: string) {
  const diff = Date.now() - new Date(lastSeenAt).getTime();
  return Number((diff / (1000 * 60 * 60)).toFixed(2));
}

function scoreDeal(deal: Omit<InternetDeal, "score" | "freshnessHours">) {
  const freshnessHours = getFreshnessHours(deal.lastSeenAt);
  const freshnessScore = Math.max(0, 24 - freshnessHours);
  const discountScore = deal.discountPercent ?? 0;
  const channelScore = deal.channelsCount * 18;
  const mentionScore = deal.mentionsCount * 8;
  const commissionIntentScore =
    deal.category === "Beauty" || deal.category === "Fashion" ? 14 : deal.currentPrice && deal.currentPrice < 2500 ? 12 : 8;

  return {
    freshnessHours,
    score: Math.round(channelScore + mentionScore + freshnessScore + discountScore + commissionIntentScore)
  };
}

async function resolveEntity(client: TelegramClient, channel: TelegramChannelSource) {
  const parsed = parseChannel(channel.url);

  if (parsed.kind === "addlist") {
    return null;
  }

  if (parsed.kind === "public") {
    return client.getEntity(parsed.value);
  }

  const invite = await client.invoke(new Api.messages.CheckChatInvite({ hash: parsed.value }));

  if (invite instanceof Api.ChatInviteAlready) {
    return invite.chat;
  }

  return null;
}

async function fetchChannelMessages(client: TelegramClient, channel: TelegramChannelSource) {
  try {
    const entity = await resolveEntity(client, channel);
    if (!entity) {
      return [];
    }

    return client.getMessages(entity, { limit: MESSAGE_LIMIT_PER_CHANNEL });
  } catch {
    return [];
  }
}

async function buildTelegramDeals() {
  const client = getTelegramClient();
  if (!client) {
    return {
      deals: [] as InternetDeal[],
      topDealsByMarketplace: {} as Record<string, InternetDeal[]>
    };
  }

  // gramJS's connect() does TCP + DH key exchange + authorize. TCP alone
  // is fast (~250ms from GH runners), but the auth handshake can stall
  // for several seconds on first run after a session was idle. The
  // previous 4s cap fired mid-handshake, killing every Telegram run.
  await withTimeout(client.connect(), 30_000, "telegram-connect");

  try {
    const grouped = new Map<
      string,
      Omit<InternetDeal, "score" | "freshnessHours"> & { channelSet: Set<string> }
    >();

    const readableChannels = telegramChannels.filter((channel) => channel.access === "readable_now");

    for (const channel of readableChannels) {
      const messages = await fetchChannelMessages(client, channel);

      for (const message of messages) {
        const text = message.message?.trim();
        if (!text) continue;

        const urls = extractUrls(text);
        if (urls.length === 0) continue;

        const postedAt = message.date ? new Date(message.date * 1000).toISOString() : new Date().toISOString();

        for (const rawUrl of urls) {
          const normalized = await resolveMarketplaceUrl(rawUrl);
          if (!normalized) continue;
          if (!supportedMarketplaces.includes(normalized.marketplace)) continue;

          const prices = extractPrices(text);
          const key = `${normalized.marketplace}:${normalized.canonicalUrl}`;
          const existing = grouped.get(key);

          if (!existing) {
            grouped.set(key, {
              id: key,
              marketplace: normalized.marketplace,
              canonicalUrl: normalized.canonicalUrl,
              originalUrl: normalized.resolvedUrl,
              title: extractTitle(text, normalized.canonicalUrl),
              category: inferCategory(text),
              currentPrice: prices.currentPrice,
              originalPrice: prices.originalPrice,
              discountPercent: prices.discountPercent,
              mentionsCount: 1,
              channelsCount: 1,
              channelNames: [channel.title ?? channel.handle ?? `Channel ${channel.id}`],
              channelSet: new Set([channel.title ?? channel.handle ?? `Channel ${channel.id}`]),
              firstSeenAt: postedAt,
              lastSeenAt: postedAt
            });
            continue;
          }

          existing.mentionsCount += 1;
          existing.lastSeenAt = existing.lastSeenAt > postedAt ? existing.lastSeenAt : postedAt;
          existing.firstSeenAt = existing.firstSeenAt < postedAt ? existing.firstSeenAt : postedAt;
          if (!existing.currentPrice && prices.currentPrice) existing.currentPrice = prices.currentPrice;
          if (!existing.originalPrice && prices.originalPrice) existing.originalPrice = prices.originalPrice;
          if (!existing.discountPercent && prices.discountPercent) existing.discountPercent = prices.discountPercent;
          existing.channelSet.add(channel.title ?? channel.handle ?? `Channel ${channel.id}`);
          existing.channelsCount = existing.channelSet.size;
          existing.channelNames = Array.from(existing.channelSet);
        }
      }
    }

    const deals = Array.from(grouped.values())
      .map(({ channelSet, ...deal }) => {
        const scored = scoreDeal(deal);
        return {
          ...deal,
          freshnessHours: scored.freshnessHours,
          score: scored.score,
          validationStatus: "unverified" as const,
          stockStatus: "unknown" as const,
          sourceEvidence: ["Telegram channels"]
        };
      })
      .sort((left, right) => right.score - left.score);

    const preliminaryTop = supportedMarketplaces.flatMap((marketplace) =>
      deals.filter((deal) => deal.marketplace === marketplace).slice(0, 10)
    );
    const validatedTop = await validateInternetDeals(preliminaryTop);
    const validatedMap = new Map(validatedTop.map((deal) => [deal.id, deal]));
    const mergedDeals = deals
      .map((deal) => validatedMap.get(deal.id) ?? deal)
      .sort((left, right) => right.score - left.score);

    await refreshDealHistory(mergedDeals);
    const historyEnriched = await enrichDealsWithHistory(mergedDeals);
    const rescoredDeals = historyEnriched
      .map((deal) => ({
        ...deal,
        score: deal.score + Math.round((deal.confidenceScore ?? 0) / 5) + (deal.priceDropSinceFirstSeen ?? 0)
      }))
      .sort((left, right) => right.score - left.score);

    const topDealsByMarketplace = supportedMarketplaces.reduce<Record<string, InternetDeal[]>>(
      (accumulator, marketplace) => {
        accumulator[marketplace] = rescoredDeals
          .filter((deal) => deal.marketplace === marketplace)
          .slice(0, 10);
        return accumulator;
      },
      {}
    );

    return { deals: rescoredDeals, topDealsByMarketplace };
  } finally {
    await client.disconnect();
  }
}

declare global {
  // eslint-disable-next-line no-var
  var __telegramDealCache: TelegramCache | undefined;
}

export async function fetchTelegramSignalSummary() {
  const readable = telegramChannels.filter((channel) => channel.access === "readable_now");
  const blocked = telegramChannels.filter((channel) => channel.access === "not_joined");
  const addlists = telegramChannels.filter((channel) => channel.access === "addlist_needs_expansion");
  const temporarilyBlocked = telegramChannels.filter((channel) => channel.access === "rate_limited_temp");

  return {
    status: "session_ready",
    refreshWindowHours: REFRESH_WINDOW_HOURS,
    totalChannels: telegramChannels.length,
    accessibleNow: readable.length,
    blockedPendingAccess: blocked.length,
    addlistsPendingExpansion: addlists.length,
    rateLimitedTemporarily: temporarilyBlocked.length,
    strategy: [
      "Use Telegram as the first live deal discovery source.",
      "Extract marketplace links from recent posts and dedupe them into unique deals.",
      "Rank unique deals by mentions, unique channels, and freshness.",
      "Expand addlist links and join remaining invite channels later."
    ],
    rankingSignals: ["Unique channel count", "Total mentions", "Freshness", "Deal text price signal"],
    accessibleChannels: readable,
    blockedChannels: blocked,
    addlists,
    temporarilyBlockedChannels: temporarilyBlocked,
    notes: [
      "Repeated Telegram posts do not create duplicate cards; they strengthen the same deal score.",
      "This phase uses Telegram only. Marketplace page validation comes in the next phase."
    ]
  };
}

export async function fetchTelegramDeals(forceRefresh = false) {
  const now = Date.now();
  const cached = global.__telegramDealCache;

  if (!forceRefresh && cached && now - cached.fetchedAt < REFRESH_WINDOW_MS) {
    return cached;
  }

  const summary = await fetchTelegramSignalSummary();

  try {
    const { deals, topDealsByMarketplace } = await withTimeout(
      buildTelegramDeals(),
      TELEGRAM_FETCH_TIMEOUT_MS,
      "telegram-deals"
    );

    const nextCache = {
      fetchedAt: now,
      summary,
      deals,
      topDealsByMarketplace
    };

    global.__telegramDealCache = nextCache;
    return nextCache;
  } catch (err) {
    // Don't swallow silently — log the real reason. The previous
    // empty-catch hid the 5s-timeout bug that made deals come back as 0
    // for a long time. Now we'll see "telegram-deals timed out" or auth
    // errors directly in the worker log.
    console.warn(
      "[telegram] fetch failed:",
      err instanceof Error ? `${err.name}: ${err.message}` : String(err)
    );
    const fallback = cached
      ? {
          ...cached,
          fetchedAt: now,
          summary
        }
      : buildEmptyTelegramDeals(summary);

    global.__telegramDealCache = fallback;
    return fallback;
  }
}
