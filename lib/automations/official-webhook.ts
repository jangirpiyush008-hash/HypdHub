/**
 * Shared HYPD-official bot webhook support.
 *
 * One bot → one webhook URL on Telegram's side, but this URL serves ALL
 * creators whose automations use `sourceMode: "official_hypd"`.
 *
 * The secret is app-global (env-derived, deterministic) so we can verify
 * incoming updates without per-creator storage.
 */

import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { TelegramAutomation } from "@/lib/automation-config";
import { getOfficialTelegramBotToken } from "@/lib/telegram-official-bot";
import { getPublicAppUrl } from "./webhook-registration";
import { getWebhookInfo, setWebhook } from "@/lib/integrations/telegram-bot-api";

const runtimeDir = path.join(process.cwd(), "data", "runtime");
const storePath = path.join(runtimeDir, "telegram-automations.json");

export function getOfficialWebhookSecret(): string {
  const token = getOfficialTelegramBotToken();
  if (!token) return "";
  // Deterministic secret derived from bot token — safe because secret is only
  // checked server-side; rotating the bot token rotates the secret naturally.
  return crypto.createHash("sha256").update(`hypd-official:${token}`).digest("hex").slice(0, 48);
}

export function getOfficialWebhookUrl(): string {
  const base = getPublicAppUrl();
  return base ? `${base}/api/webhooks/telegram-official` : "";
}

/**
 * Ensure the official bot's Telegram webhook is pointing at our endpoint.
 * Idempotent — safe to call every save.
 */
export async function ensureOfficialWebhookRegistered(): Promise<
  | { status: "registered"; url: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; reason: string }
> {
  const token = getOfficialTelegramBotToken();
  if (!token) return { status: "skipped", reason: "TELEGRAM_OFFICIAL_BOT_TOKEN not set" };

  const url = getOfficialWebhookUrl();
  if (!url) return { status: "skipped", reason: "PUBLIC_APP_URL not set" };

  const secret = getOfficialWebhookSecret();

  try {
    const info = await getWebhookInfo(token);
    if (info.ok && info.result.url === url) {
      return { status: "registered", url };
    }
    const res = await setWebhook(token, url, secret);
    if (res.ok) return { status: "registered", url };
    return { status: "error", reason: res.description };
  } catch (err) {
    return { status: "error", reason: err instanceof Error ? err.message : "unknown" };
  }
}

export type CreatorAutomationPair = {
  creatorId: string;
  automation: TelegramAutomation;
};

/**
 * Read the raw automations JSON store (bypassing the sanitizer that hides
 * bot tokens for client responses). Used by the webhook dispatcher so we can
 * resolve each creator's destination config.
 */
export async function loadAllOfficialAutomations(): Promise<CreatorAutomationPair[]> {
  try {
    const raw = await fs.readFile(storePath, "utf8");
    const parsed = JSON.parse(raw) as { byCreatorId: Record<string, TelegramAutomation[]> };
    const pairs: CreatorAutomationPair[] = [];
    for (const [creatorId, list] of Object.entries(parsed.byCreatorId ?? {})) {
      for (const automation of list ?? []) {
        if (automation.sourceMode === "official_hypd" && automation.enabled && automation.autoForwardEnabled) {
          pairs.push({ creatorId, automation });
        }
      }
    }
    return pairs;
  } catch {
    return [];
  }
}
