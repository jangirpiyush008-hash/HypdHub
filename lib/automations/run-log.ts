/**
 * Per-creator run log for automations. File-backed JSON — mirrors the pattern
 * used by lib/runtime/telegram-automations.ts. Each creator keeps the last
 * MAX_ENTRIES runs; older rows drop off.
 */

import fs from "node:fs/promises";
import path from "node:path";

const MAX_ENTRIES = 200;

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const storePath = path.join(runtimeDir, "automation-runs.json");

export type RunLogEntry = {
  automationId: string;
  status: "delivered" | "skipped" | "error";
  reason?: string;
  sourceMessageId?: number;
  destMessageId?: number;
  at: string;
};

type Store = {
  byCreatorId: Record<string, RunLogEntry[]>;
};

async function read(): Promise<Store> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return { byCreatorId: {} };
  }
}

async function write(store: Store) {
  await fs.mkdir(runtimeDir, { recursive: true });
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function appendRunLog(creatorId: string, entry: RunLogEntry) {
  const store = await read();
  const existing = store.byCreatorId[creatorId] ?? [];
  store.byCreatorId[creatorId] = [entry, ...existing].slice(0, MAX_ENTRIES);
  await write(store);
}

export async function getRunLog(creatorId: string, limit = 50): Promise<RunLogEntry[]> {
  const store = await read();
  return (store.byCreatorId[creatorId] ?? []).slice(0, limit);
}
