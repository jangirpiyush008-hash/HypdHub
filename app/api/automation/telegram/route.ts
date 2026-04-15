import { NextResponse } from "next/server";
import { TelegramAutomation } from "@/lib/automation-config";
import { fetchCurrentHypdCreator } from "@/lib/hypd-server";
import {
  getTelegramAutomationsForCreator,
  saveTelegramAutomationsForCreator
} from "@/lib/runtime/telegram-automations";
import { getOfficialTelegramBotToken } from "@/lib/telegram-official-bot";
import { registerWebhooksForCreator } from "@/lib/automations/webhook-registration";
import { getRunLog } from "@/lib/automations/run-log";

export async function GET() {
  const creator = await fetchCurrentHypdCreator();

  if (!creator) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  const automations = await getTelegramAutomationsForCreator(creator.id);
  const recentRuns = await getRunLog(creator.id, 25);

  return NextResponse.json({
    ok: true,
    creatorId: creator.id,
    automations,
    recentRuns,
    officialBotConfigured: Boolean(getOfficialTelegramBotToken())
  });
}

export async function POST(request: Request) {
  const creator = await fetchCurrentHypdCreator();

  if (!creator) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  const payload = (await request.json().catch(() => null)) as
    | { automations?: TelegramAutomation[] }
    | null;

  const automations = Array.isArray(payload?.automations) ? payload.automations : null;

  if (!automations) {
    return NextResponse.json({ ok: false, message: "Invalid automation payload." }, { status: 400 });
  }

  const result = await saveTelegramAutomationsForCreator(creator.id, automations);

  // Auto-register Telegram webhooks for any custom bot tokens the user saved
  const webhooks = await registerWebhooksForCreator(creator.id, automations);

  return NextResponse.json({
    ok: true,
    updatedAt: result.updatedAt,
    automations: result.automations,
    webhooks,
    officialBotConfigured: Boolean(getOfficialTelegramBotToken())
  });
}
