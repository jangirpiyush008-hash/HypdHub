/**
 * Auto-register Telegram bot webhooks when a creator saves automations.
 *
 * Strategy: one bot token can only have one webhook URL, and our URL encodes
 * the creatorId — so each bot token is dedicated to one creator. The official
 * HYPD bot is shared and uses a different flow (polled worker or fan-out), so
 * we only register per-creator webhooks for `custom_channel` sourceMode.
 */

import { TelegramAutomation } from "@/lib/automation-config";
import { getWebhookInfo, setWebhook } from "@/lib/integrations/telegram-bot-api";
import { ensureCreatorWebhookSecret } from "./webhook-secrets";

export function getPublicAppUrl(): string {
  const raw =
    process.env.PUBLIC_APP_URL?.trim() ||
    process.env.NEXT_PUBLIC_APP_URL?.trim() ||
    process.env.VERCEL_URL?.trim() ||
    "";
  if (!raw) return "";
  return raw.startsWith("http") ? raw.replace(/\/$/, "") : `https://${raw.replace(/\/$/, "")}`;
}

export type WebhookRegistration =
  | { status: "registered"; url: string }
  | { status: "skipped"; reason: string }
  | { status: "error"; reason: string };

/**
 * Register a webhook for each unique custom bot token attached to this
 * creator's automations. Returns per-token status.
 */
export async function registerWebhooksForCreator(
  creatorId: string,
  automations: TelegramAutomation[]
): Promise<Record<string, WebhookRegistration>> {
  const base = getPublicAppUrl();
  if (!base) {
    return { _all: { status: "skipped", reason: "PUBLIC_APP_URL not configured" } };
  }

  const secret = await ensureCreatorWebhookSecret(creatorId);
  const url = `${base}/api/webhooks/telegram/${creatorId}`;

  // Only custom_channel automations bring their own token.
  const tokens = new Set(
    automations
      .filter((a) => a.sourceMode === "custom_channel" && a.botToken.trim())
      .map((a) => a.botToken.trim())
  );

  const out: Record<string, WebhookRegistration> = {};

  for (const token of tokens) {
    try {
      // Check existing webhook; skip re-registration if already pointing at us
      const info = await getWebhookInfo(token);
      if (info.ok && info.result.url === url) {
        out[maskToken(token)] = { status: "registered", url };
        continue;
      }

      const res = await setWebhook(token, url, secret);
      if (res.ok) {
        out[maskToken(token)] = { status: "registered", url };
      } else {
        out[maskToken(token)] = { status: "error", reason: res.description };
      }
    } catch (err) {
      out[maskToken(token)] = {
        status: "error",
        reason: err instanceof Error ? err.message : "unknown_error",
      };
    }
  }

  return out;
}

function maskToken(token: string): string {
  return token.length > 10 ? `${token.slice(0, 6)}…${token.slice(-4)}` : "***";
}
