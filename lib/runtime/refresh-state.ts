import fs from "node:fs/promises";
import path from "node:path";
import { fetchTelegramDeals } from "@/lib/integrations/telegram";
import { getDealHistorySummary } from "@/lib/runtime/deal-history";

type RefreshState = {
  lastRefreshAt: string | null;
  nextRefreshAt: string | null;
  refreshWindowHours: number;
  lastStatus: "idle" | "success" | "error";
  lastReason: string | null;
  telegramDealsCount: number;
  validatedDealsCount: number;
};

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const statePath = path.join(runtimeDir, "refresh-state.json");
const REFRESH_WINDOW_HOURS = 2;
const REFRESH_WINDOW_MS = REFRESH_WINDOW_HOURS * 60 * 60 * 1000;

async function ensureRuntimeDir() {
  await fs.mkdir(runtimeDir, { recursive: true });
}

export async function readRefreshState(): Promise<RefreshState> {
  try {
    const raw = await fs.readFile(statePath, "utf8");
    return JSON.parse(raw) as RefreshState;
  } catch {
    return {
      lastRefreshAt: null,
      nextRefreshAt: null,
      refreshWindowHours: REFRESH_WINDOW_HOURS,
      lastStatus: "idle",
      lastReason: null,
      telegramDealsCount: 0,
      validatedDealsCount: 0
    };
  }
}

export async function writeRefreshState(state: RefreshState) {
  await ensureRuntimeDir();
  await fs.writeFile(statePath, JSON.stringify(state, null, 2));
}

function computeNextRefreshAt(lastRefreshAt: string) {
  return new Date(new Date(lastRefreshAt).getTime() + REFRESH_WINDOW_MS).toISOString();
}

export async function recordRefreshSuccess(reason: string, telegramDealsCount: number, validatedDealsCount: number) {
  const lastRefreshAt = new Date().toISOString();
  await writeRefreshState({
    lastRefreshAt,
    nextRefreshAt: computeNextRefreshAt(lastRefreshAt),
    refreshWindowHours: REFRESH_WINDOW_HOURS,
    lastStatus: "success",
    lastReason: reason,
    telegramDealsCount,
    validatedDealsCount
  });
}

export async function ensureAutomaticRefresh(reason = "auto-window-check") {
  const state = await readRefreshState();
  const now = Date.now();
  const nextRefreshMs = state.nextRefreshAt ? new Date(state.nextRefreshAt).getTime() : 0;
  const isDue = !state.lastRefreshAt || !state.nextRefreshAt || now >= nextRefreshMs;

  if (!isDue) {
    return {
      refreshed: false,
      state
    };
  }

  try {
    const telegram = await fetchTelegramDeals(true);
    const validatedDealsCount = telegram.deals.filter((deal) => deal.validationStatus === "validated").length;
    await recordRefreshSuccess(reason, telegram.deals.length, validatedDealsCount);

    return {
      refreshed: true,
      state: await readRefreshState()
    };
  } catch {
    const failed = {
      ...state,
      refreshWindowHours: REFRESH_WINDOW_HOURS,
      lastStatus: "error" as const,
      lastReason: reason
    };
    await writeRefreshState(failed);
    return {
      refreshed: false,
      state: failed
    };
  }
}

export async function getRefreshStatus() {
  const [state, history] = await Promise.all([readRefreshState(), getDealHistorySummary()]);
  return {
    ...state,
    history
  };
}
