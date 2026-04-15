/**
 * Diagnostic endpoint — tells the UI (and you, via curl) what's configured
 * in the current environment.
 *
 * GET /api/automation/telegram/status
 */

import { NextResponse } from "next/server";
import { getOfficialTelegramBotToken } from "@/lib/telegram-official-bot";
import { getMe, getWebhookInfo } from "@/lib/integrations/telegram-bot-api";
import { getOfficialWebhookUrl, ensureOfficialWebhookRegistered } from "@/lib/automations/official-webhook";
import { getPublicAppUrl } from "@/lib/automations/webhook-registration";

export async function GET() {
  const token = getOfficialTelegramBotToken();
  const publicUrl = getPublicAppUrl();
  const officialWebhookUrl = getOfficialWebhookUrl();

  const out: Record<string, unknown> = {
    ok: true,
    env: {
      TELEGRAM_OFFICIAL_BOT_TOKEN: token ? `${token.slice(0, 6)}…${token.slice(-4)}` : null,
      PUBLIC_APP_URL: publicUrl || null,
    },
    expectedWebhookUrl: officialWebhookUrl || null,
  };

  if (token) {
    const me = await getMe(token);
    out.bot = me.ok
      ? { id: me.result.id, username: me.result.username, canReadAll: me.result.can_read_all_group_messages }
      : { error: me.description };

    const info = await getWebhookInfo(token);
    out.currentWebhook = info.ok
      ? {
          url: info.result.url,
          pendingUpdates: info.result.pending_update_count,
          lastError: info.result.last_error_message ?? null,
          matchesExpected: info.result.url === officialWebhookUrl,
        }
      : { error: info.description };
  }

  out.register = await ensureOfficialWebhookRegistered();

  return NextResponse.json(out);
}
