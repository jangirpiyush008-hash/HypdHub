/**
 * Per-creator webhook secrets. Each creator gets a stable random token that
 * Telegram sends with every webhook call — guards against random POSTs.
 */

import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const storePath = path.join(runtimeDir, "webhook-secrets.json");

type Store = { byCreatorId: Record<string, string> };

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

export async function getCreatorWebhookSecret(creatorId: string): Promise<string | null> {
  const store = await read();
  return store.byCreatorId[creatorId] ?? null;
}

export async function ensureCreatorWebhookSecret(creatorId: string): Promise<string> {
  const store = await read();
  if (!store.byCreatorId[creatorId]) {
    store.byCreatorId[creatorId] = crypto.randomBytes(24).toString("hex");
    await write(store);
  }
  return store.byCreatorId[creatorId];
}
