/**
 * Shared webhook for the HYPD-official Telegram bot.
 *
 * Telegram calls us when the HYPD source channel posts a new message. We
 * fan out to every creator who has an `official_hypd` automation enabled,
 * running each creator's transform/forward against their own destination
 * and their own HYPD affiliate username.
 */

import { NextResponse } from "next/server";
import { TelegramUpdate, sendMessage, sendPhoto } from "@/lib/integrations/telegram-bot-api";
import { transformMessage } from "@/lib/automations/transform";
import { appendRunLog } from "@/lib/automations/run-log";
import {
  getOfficialWebhookSecret,
  loadAllOfficialAutomations,
} from "@/lib/automations/official-webhook";
import { getOfficialTelegramBotToken } from "@/lib/telegram-official-bot";
import { getCreatorSession } from "@/lib/runtime/hypd-creator-sessions";
import { OFFICIAL_HYPD_SOURCE_CHANNEL } from "@/lib/automation-config";

function sourceMatches(updateChatUsername?: string, updateChatId?: number | string): boolean {
  const expected = OFFICIAL_HYPD_SOURCE_CHANNEL.replace(/^@/, "").toLowerCase();
  if (updateChatUsername && updateChatUsername.toLowerCase() === expected) return true;
  // No strict chat-id match — we rely on bot only being in the official channel.
  return Boolean(updateChatUsername || updateChatId);
}

export async function POST(request: Request) {
  const expected = getOfficialWebhookSecret();
  const received = request.headers.get("x-telegram-bot-api-secret-token") ?? "";
  if (!expected || received !== expected) {
    return NextResponse.json({ ok: false, error: "invalid_secret" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  const msg = update.channel_post ?? update.message ?? update.edited_channel_post;
  if (!msg) return NextResponse.json({ ok: true, skipped: "no_message" });

  if (!sourceMatches(msg.chat.username, msg.chat.id)) {
    return NextResponse.json({ ok: true, skipped: "not_official_source" });
  }

  const token = getOfficialTelegramBotToken();
  if (!token) return NextResponse.json({ ok: false, error: "bot_not_configured" }, { status: 500 });

  const pairs = await loadAllOfficialAutomations();
  let delivered = 0;
  const errors: string[] = [];

  for (const { creatorId, automation } of pairs) {
    try {
      // Resolve this creator's HYPD username so affiliate links are theirs
      const session = await getCreatorSession(creatorId);
      const creatorUsername = session?.creator?.hypdUsername ?? "creator";

      const result = await transformMessage(msg, automation, creatorUsername);
      if (result.kind === "skip") {
        await appendRunLog(creatorId, {
          automationId: automation.id,
          status: "skipped",
          reason: result.reason ?? "skipped",
          sourceMessageId: msg.message_id,
          at: new Date().toISOString(),
        });
        continue;
      }

      const destId = automation.destinationChannelId || automation.destinationChannelUsername;
      if (!destId) {
        await appendRunLog(creatorId, {
          automationId: automation.id,
          status: "error",
          reason: "missing_destination",
          sourceMessageId: msg.message_id,
          at: new Date().toISOString(),
        });
        continue;
      }

      const normalized = destId.startsWith("@") || destId.startsWith("-") ? destId : `@${destId.replace(/^@/, "")}`;

      const outcome =
        result.kind === "photo" && result.photoFileId
          ? await sendPhoto(token, normalized, result.photoFileId, result.caption ?? "")
          : await sendMessage(token, normalized, result.text ?? "", { disablePreview: false });

      if (outcome.ok) {
        delivered += 1;
        await appendRunLog(creatorId, {
          automationId: automation.id,
          status: "delivered",
          sourceMessageId: msg.message_id,
          destMessageId: outcome.result.message_id,
          at: new Date().toISOString(),
        });
      } else {
        errors.push(`[${creatorId}/${automation.id}] ${outcome.description}`);
        await appendRunLog(creatorId, {
          automationId: automation.id,
          status: "error",
          reason: outcome.description,
          sourceMessageId: msg.message_id,
          at: new Date().toISOString(),
        });
      }
    } catch (err) {
      const m = err instanceof Error ? err.message : "unknown_error";
      errors.push(`[${creatorId}/${automation.id}] ${m}`);
    }
  }

  return NextResponse.json({ ok: true, processed: pairs.length, delivered, errors });
}

export async function GET() {
  const token = getOfficialTelegramBotToken();
  return NextResponse.json({
    ok: true,
    configured: Boolean(token),
    secretConfigured: Boolean(getOfficialWebhookSecret()),
  });
}
