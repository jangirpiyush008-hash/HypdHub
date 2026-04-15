/**
 * Telegram webhook receiver.
 *
 * URL: POST /api/webhooks/telegram/{creatorId}
 * Header: X-Telegram-Bot-Api-Secret-Token = <per-creator secret>
 *
 * Telegram calls this every time the source channel posts. We look up the
 * creator's active automations, transform the message, and dispatch.
 */

import { NextResponse } from "next/server";
import { handleUpdate } from "@/lib/automations/forwarder";
import { getCreatorWebhookSecret } from "@/lib/automations/webhook-secrets";
import { TelegramUpdate } from "@/lib/integrations/telegram-bot-api";
import { getStoredCreatorSession } from "@/lib/hypd-server";

export async function POST(request: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  const { creatorId } = await params;

  const expectedSecret = await getCreatorWebhookSecret(creatorId);
  const receivedSecret = request.headers.get("x-telegram-bot-api-secret-token") ?? "";

  if (!expectedSecret || receivedSecret !== expectedSecret) {
    return NextResponse.json({ ok: false, error: "invalid_secret" }, { status: 401 });
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: false, error: "invalid_json" }, { status: 400 });
  }

  // Look up creator's HYPD username for affiliate link conversion
  const session = await getStoredCreatorSession(creatorId);
  const creatorUsername = session?.creator?.hypdUsername ?? "creator";

  const result = await handleUpdate(update, { creatorId, creatorUsername });

  // Always return 200 so Telegram doesn't retry aggressively
  return NextResponse.json({ ok: true, ...result });
}

export async function GET(_req: Request, { params }: { params: Promise<{ creatorId: string }> }) {
  // Health check
  const { creatorId } = await params;
  const secret = await getCreatorWebhookSecret(creatorId);
  return NextResponse.json({ ok: true, creatorId, configured: Boolean(secret) });
}
