import fs from "node:fs/promises";
import path from "node:path";
import { TelegramAutomation } from "@/lib/automation-config";

type TelegramAutomationStore = {
  updatedAt: string | null;
  byCreatorId: Record<string, TelegramAutomation[]>;
};

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const storePath = path.join(runtimeDir, "telegram-automations.json");

async function ensureRuntimeDir() {
  await fs.mkdir(runtimeDir, { recursive: true });
}

async function readStore(): Promise<TelegramAutomationStore> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return JSON.parse(raw) as TelegramAutomationStore;
  } catch {
    return {
      updatedAt: null,
      byCreatorId: {}
    };
  }
}

async function writeStore(store: TelegramAutomationStore) {
  await ensureRuntimeDir();
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function getTelegramAutomationsForCreator(creatorId: string) {
  const store = await readStore();
  return store.byCreatorId[creatorId] ?? [];
}

export async function saveTelegramAutomationsForCreator(creatorId: string, automations: TelegramAutomation[]) {
  const store = await readStore();
  store.byCreatorId[creatorId] = automations.slice(0, 5);
  store.updatedAt = new Date().toISOString();
  await writeStore(store);

  return {
    updatedAt: store.updatedAt,
    automations: store.byCreatorId[creatorId]
  };
}
