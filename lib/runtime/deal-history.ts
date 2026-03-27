import fs from "node:fs/promises";
import path from "node:path";
import { InternetDeal } from "@/lib/types";

type DealHistoryEntry = {
  canonicalUrl: string;
  marketplace: InternetDeal["marketplace"];
  title: string;
  prices: Array<{
    currentPrice: number | null;
    originalPrice: number | null;
    seenAt: string;
  }>;
  firstSeenAt: string;
  lastSeenAt: string;
  snapshots: number;
};

type DealHistoryStore = {
  lastRefreshAt: string | null;
  entries: Record<string, DealHistoryEntry>;
};

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const historyPath = path.join(runtimeDir, "deal-history.json");

async function ensureRuntimeDir() {
  await fs.mkdir(runtimeDir, { recursive: true });
}

async function readHistoryStore(): Promise<DealHistoryStore> {
  try {
    const raw = await fs.readFile(historyPath, "utf8");
    return JSON.parse(raw) as DealHistoryStore;
  } catch {
    return { lastRefreshAt: null, entries: {} };
  }
}

async function writeHistoryStore(store: DealHistoryStore) {
  await ensureRuntimeDir();
  await fs.writeFile(historyPath, JSON.stringify(store, null, 2));
}

function calculateHistoryMetrics(entry: DealHistoryEntry) {
  const priceSeries = entry.prices
    .map((point) => point.currentPrice)
    .filter((value): value is number => typeof value === "number" && Number.isFinite(value));

  const lowestTrackedPrice = priceSeries.length > 0 ? Math.min(...priceSeries) : null;
  const highestTrackedPrice = priceSeries.length > 0 ? Math.max(...priceSeries) : null;
  const firstPrice = priceSeries.length > 0 ? priceSeries[0] : null;
  const latestPrice = priceSeries.length > 0 ? priceSeries[priceSeries.length - 1] : null;
  const priceDropSinceFirstSeen =
    firstPrice && latestPrice && firstPrice > latestPrice
      ? Math.round(((firstPrice - latestPrice) / firstPrice) * 100)
      : 0;

  return {
    historySeenCount: entry.snapshots,
    lowestTrackedPrice,
    highestTrackedPrice,
    priceDropSinceFirstSeen
  };
}

function computeConfidenceScore(deal: InternetDeal, metrics: ReturnType<typeof calculateHistoryMetrics>) {
  const validationScore = deal.validationStatus === "validated" ? 28 : 10;
  const channelScore = Math.min(30, deal.channelsCount * 4);
  const mentionScore = Math.min(20, deal.mentionsCount * 2);
  const historyScore = Math.min(15, metrics.historySeenCount * 3);
  const stockScore = deal.stockStatus === "in_stock" ? 12 : deal.stockStatus === "out_of_stock" ? -10 : 0;
  const priceDropScore = metrics.priceDropSinceFirstSeen ?? 0;

  return Math.max(0, validationScore + channelScore + mentionScore + historyScore + stockScore + priceDropScore);
}

export async function refreshDealHistory(deals: InternetDeal[]) {
  const store = await readHistoryStore();
  const now = new Date().toISOString();

  for (const deal of deals) {
    const existing = store.entries[deal.id];

    if (!existing) {
      store.entries[deal.id] = {
        canonicalUrl: deal.canonicalUrl,
        marketplace: deal.marketplace,
        title: deal.title,
        prices: [
          {
            currentPrice: deal.currentPrice,
            originalPrice: deal.originalPrice,
            seenAt: now
          }
        ],
        firstSeenAt: now,
        lastSeenAt: now,
        snapshots: 1
      };
      continue;
    }

    existing.title = deal.title;
    existing.lastSeenAt = now;
    existing.snapshots += 1;
    existing.prices.push({
      currentPrice: deal.currentPrice,
      originalPrice: deal.originalPrice,
      seenAt: now
    });

    if (existing.prices.length > 40) {
      existing.prices = existing.prices.slice(-40);
    }
  }

  store.lastRefreshAt = now;
  await writeHistoryStore(store);
  return store;
}

export async function enrichDealsWithHistory(deals: InternetDeal[]) {
  const store = await readHistoryStore();

  return deals.map((deal) => {
    const entry = store.entries[deal.id];
    if (!entry) {
      return {
        ...deal,
        confidenceScore: deal.validationStatus === "validated" ? 38 : 16,
        historySeenCount: 0,
        lowestTrackedPrice: deal.currentPrice,
        highestTrackedPrice: deal.currentPrice,
        priceDropSinceFirstSeen: 0
      } satisfies InternetDeal;
    }

    const metrics = calculateHistoryMetrics(entry);

    return {
      ...deal,
      ...metrics,
      confidenceScore: computeConfidenceScore(deal, metrics)
    } satisfies InternetDeal;
  });
}

export async function getDealHistorySummary() {
  const store = await readHistoryStore();
  const entries = Object.values(store.entries);

  return {
    lastRefreshAt: store.lastRefreshAt,
    trackedDeals: entries.length,
    trackedSnapshots: entries.reduce((sum, entry) => sum + entry.snapshots, 0)
  };
}
