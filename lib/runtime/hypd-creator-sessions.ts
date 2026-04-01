import fs from "node:fs/promises";
import path from "node:path";
import { CreatorProfile } from "@/lib/types";

export type StoredUpstreamCookie = {
  name: string;
  value: string;
};

type StoredCreatorSession = {
  creator: CreatorProfile;
  cookies: StoredUpstreamCookie[];
  updatedAt: string;
};

type CreatorSessionStore = {
  byCreatorId: Record<string, StoredCreatorSession>;
};

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const storePath = path.join(runtimeDir, "hypd-creator-sessions.json");

async function ensureRuntimeDir() {
  await fs.mkdir(runtimeDir, { recursive: true });
}

async function readStore(): Promise<CreatorSessionStore> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    return JSON.parse(raw) as CreatorSessionStore;
  } catch {
    return { byCreatorId: {} };
  }
}

async function writeStore(store: CreatorSessionStore) {
  await ensureRuntimeDir();
  await fs.writeFile(storePath, JSON.stringify(store, null, 2));
}

export async function saveCreatorSession(creator: CreatorProfile, cookies: StoredUpstreamCookie[]) {
  const store = await readStore();
  store.byCreatorId[creator.id] = {
    creator,
    cookies,
    updatedAt: new Date().toISOString()
  };
  await writeStore(store);
}

export async function getCreatorSession(creatorId: string) {
  const store = await readStore();
  return store.byCreatorId[creatorId] ?? null;
}

export async function clearCreatorSession(creatorId: string) {
  const store = await readStore();
  delete store.byCreatorId[creatorId];
  await writeStore(store);
}
