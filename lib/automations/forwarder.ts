/**
 * Forwarder — takes a Telegram Update received via webhook, looks up the
 * automation it belongs to, transforms the message, and posts to the
 * destination channel(s).
 */

import { TelegramAutomation } from "@/lib/automation-config";
import {
  TelegramUpdate,
  sendMessage,
  sendPhoto,
} from "@/lib/integrations/telegram-bot-api";
import { transformMessage } from "./transform";
import { resolveTelegramAutomationBotToken } from "@/lib/telegram-official-bot";
import { getTelegramAutomationsForCreator } from "@/lib/runtime/telegram-automations";
import { appendRunLog } from "./run-log";

/**
 * Normalize a channel identifier for comparison. Telegram sends numeric chat IDs
 * in updates but users type "@username" or "-100..." in the config.
 */
function chatIdMatches(configValue: string, updateChatId: string | number, updateUsername?: string): boolean {
  if (!configValue) return false;
  const val = configValue.trim();
  const updId = String(updateChatId);
  const lcVal = val.toLowerCase().replace(/^@/, "");
  if (val === updId) return true;
  if (val.replace("-100", "") === updId.replace("-100", "")) return true;
  if (updateUsername && lcVal === updateUsername.toLowerCase()) return true;
  return false;
}

export type ForwardContext = {
  creatorId: string;
  creatorUsername: string;
};

/**
 * Given an update and the creator it belongs to, find matching automations
 * and dispatch the message to their destinations.
 */
export async function handleUpdate(update: TelegramUpdate, ctx: ForwardContext): Promise<{
  processed: number;
  delivered: number;
  errors: string[];
}> {
  const msg = update.channel_post ?? update.message ?? update.edited_channel_post;
  if (!msg) return { processed: 0, delivered: 0, errors: [] };

  const automations = await getTelegramAutomationsForCreator(ctx.creatorId);
  const activeFor = automations.filter(
    (a) => a.enabled && a.autoForwardEnabled && chatIdMatches(a.sourceChannelId, msg.chat.id, msg.chat.username)
  );

  if (activeFor.length === 0) {
    return { processed: 0, delivered: 0, errors: [] };
  }

  let delivered = 0;
  const errors: string[] = [];

  for (const automation of activeFor) {
    try {
      const result = await transformMessage(msg, automation as TelegramAutomation, ctx.creatorUsername);
      if (result.kind === "skip") {
        await appendRunLog(ctx.creatorId, {
          automationId: automation.id,
          status: "skipped",
          reason: result.reason ?? "skipped",
          sourceMessageId: msg.message_id,
          at: new Date().toISOString(),
        });
        continue;
      }

      const token = resolveTelegramAutomationBotToken(automation as TelegramAutomation);
      if (!token) {
        errors.push(`[${automation.id}] missing bot token`);
        continue;
      }

      const destId = automation.destinationChannelId || automation.destinationChannelUsername;
      if (!destId) {
        errors.push(`[${automation.id}] missing destination`);
        continue;
      }

      // Normalize destination: @username stays, plain -100... stays, numeric stays
      const normalizedDest = destId.startsWith("@") || destId.startsWith("-") ? destId : `@${destId.replace(/^@/, "")}`;

      let outcome;
      if (result.kind === "photo" && result.photoFileId) {
        outcome = await sendPhoto(token, normalizedDest, result.photoFileId, result.caption ?? "");
      } else if (result.text) {
        outcome = await sendMessage(token, normalizedDest, result.text, { disablePreview: false });
      } else {
        continue;
      }

      if (outcome.ok) {
        delivered += 1;
        await appendRunLog(ctx.creatorId, {
          automationId: automation.id,
          status: "delivered",
          sourceMessageId: msg.message_id,
          destMessageId: outcome.result.message_id,
          at: new Date().toISOString(),
        });
      } else {
        const errMsg = `[${automation.id}] ${outcome.description}`;
        errors.push(errMsg);
        await appendRunLog(ctx.creatorId, {
          automationId: automation.id,
          status: "error",
          reason: outcome.description,
          sourceMessageId: msg.message_id,
          at: new Date().toISOString(),
        });
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "unknown_error";
      errors.push(`[${automation.id}] ${m}`);
      await appendRunLog(ctx.creatorId, {
        automationId: automation.id,
        status: "error",
        reason: m,
        sourceMessageId: msg.message_id,
        at: new Date().toISOString(),
      });
    }
  }

  return { processed: activeFor.length, delivered, errors };
}
