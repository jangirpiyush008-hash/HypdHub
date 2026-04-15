/**
 * Lightweight validation helpers the UI calls during the automation wizard.
 *
 * POST { action: "bot", token }            → returns bot's username + id
 * POST { action: "chat", token, chatId }   → returns chat's title + type
 */

import { NextResponse } from "next/server";
import { fetchCurrentHypdCreator } from "@/lib/hypd-server";
import { getChat, getMe } from "@/lib/integrations/telegram-bot-api";
import { getOfficialTelegramBotToken } from "@/lib/telegram-official-bot";

export async function POST(request: Request) {
  const creator = await fetchCurrentHypdCreator();
  if (!creator) {
    return NextResponse.json({ ok: false, message: "Login required." }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { action: "bot"; token: string }
    | { action: "chat"; token: string; chatId: string; useOfficial?: boolean }
    | null;

  if (!body) {
    return NextResponse.json({ ok: false, message: "Invalid payload." }, { status: 400 });
  }

  if (body.action === "bot") {
    const token = body.token?.trim();
    if (!token) return NextResponse.json({ ok: false, message: "Missing token" }, { status: 400 });
    const me = await getMe(token);
    if (!me.ok) return NextResponse.json({ ok: false, message: me.description });
    return NextResponse.json({
      ok: true,
      botId: me.result.id,
      botUsername: me.result.username,
      canReadAll: me.result.can_read_all_group_messages,
    });
  }

  if (body.action === "chat") {
    const token = body.useOfficial ? getOfficialTelegramBotToken() : body.token?.trim();
    if (!token) return NextResponse.json({ ok: false, message: "Missing token" }, { status: 400 });
    const chatId = body.chatId?.trim();
    if (!chatId) return NextResponse.json({ ok: false, message: "Missing chat id" }, { status: 400 });
    const normalized = chatId.startsWith("@") || chatId.startsWith("-") ? chatId : `@${chatId.replace(/^@/, "")}`;
    const chat = await getChat(token, normalized);
    if (!chat.ok) return NextResponse.json({ ok: false, message: chat.description });
    return NextResponse.json({
      ok: true,
      chatId: chat.result.id,
      type: chat.result.type,
      title: chat.result.title ?? chat.result.username ?? String(chat.result.id),
      username: chat.result.username ?? null,
    });
  }

  return NextResponse.json({ ok: false, message: "Unknown action" }, { status: 400 });
}
