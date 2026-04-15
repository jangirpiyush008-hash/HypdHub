/**
 * Minimal Telegram Bot API client (fetch-based, no deps).
 *
 * Covers the surface we need for TG → TG automations:
 *   - getMe / getChat (validation)
 *   - sendMessage / sendPhoto / copyMessage / forwardMessage
 *   - setWebhook / deleteWebhook / getWebhookInfo
 *
 * Docs: https://core.telegram.org/bots/api
 */

const BOT_API_BASE = "https://api.telegram.org";

type TgResult<T> = { ok: true; result: T } | { ok: false; error_code: number; description: string };

async function call<T>(token: string, method: string, body?: Record<string, unknown>): Promise<TgResult<T>> {
  try {
    const res = await fetch(`${BOT_API_BASE}/bot${token}/${method}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: body ? JSON.stringify(body) : undefined,
      cache: "no-store",
    });
    const json = (await res.json()) as TgResult<T>;
    return json;
  } catch (err) {
    return { ok: false, error_code: 0, description: err instanceof Error ? err.message : "network_error" };
  }
}

export type TelegramBotInfo = {
  id: number;
  username: string;
  first_name: string;
  can_join_groups: boolean;
  can_read_all_group_messages: boolean;
};

export type TelegramChat = {
  id: number | string;
  type: "private" | "group" | "supergroup" | "channel";
  title?: string;
  username?: string;
};

export async function getMe(token: string) {
  return call<TelegramBotInfo>(token, "getMe");
}

export async function getChat(token: string, chatId: string | number) {
  return call<TelegramChat>(token, "getChat", { chat_id: chatId });
}

export async function sendMessage(
  token: string,
  chatId: string | number,
  text: string,
  opts: { parseMode?: "HTML" | "Markdown" | "MarkdownV2"; disablePreview?: boolean } = {}
) {
  return call<{ message_id: number }>(token, "sendMessage", {
    chat_id: chatId,
    text,
    parse_mode: opts.parseMode ?? "HTML",
    disable_web_page_preview: opts.disablePreview ?? false,
  });
}

export async function sendPhoto(
  token: string,
  chatId: string | number,
  photo: string,
  caption?: string,
  opts: { parseMode?: "HTML" | "Markdown" | "MarkdownV2" } = {}
) {
  return call<{ message_id: number }>(token, "sendPhoto", {
    chat_id: chatId,
    photo,
    caption,
    parse_mode: opts.parseMode ?? "HTML",
  });
}

export async function copyMessage(
  token: string,
  fromChatId: string | number,
  toChatId: string | number,
  messageId: number,
  caption?: string,
  opts: { parseMode?: "HTML" | "Markdown" | "MarkdownV2" } = {}
) {
  return call<{ message_id: number }>(token, "copyMessage", {
    chat_id: toChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
    caption,
    parse_mode: caption ? opts.parseMode ?? "HTML" : undefined,
  });
}

export async function forwardMessage(
  token: string,
  fromChatId: string | number,
  toChatId: string | number,
  messageId: number
) {
  return call<{ message_id: number }>(token, "forwardMessage", {
    chat_id: toChatId,
    from_chat_id: fromChatId,
    message_id: messageId,
  });
}

export async function setWebhook(token: string, url: string, secret?: string) {
  return call<true>(token, "setWebhook", {
    url,
    secret_token: secret,
    allowed_updates: ["channel_post", "edited_channel_post", "message"],
    drop_pending_updates: true,
  });
}

export async function deleteWebhook(token: string) {
  return call<true>(token, "deleteWebhook", { drop_pending_updates: true });
}

export async function getWebhookInfo(token: string) {
  return call<{ url: string; pending_update_count: number; last_error_message?: string }>(
    token,
    "getWebhookInfo"
  );
}

/** Telegram Update shape — only the fields we care about. */
export type TelegramUpdate = {
  update_id: number;
  message?: TelegramMessage;
  channel_post?: TelegramMessage;
  edited_channel_post?: TelegramMessage;
};

export type TelegramPhotoSize = {
  file_id: string;
  file_unique_id: string;
  width: number;
  height: number;
};

export type TelegramMessage = {
  message_id: number;
  chat: TelegramChat;
  date: number;
  text?: string;
  caption?: string;
  photo?: TelegramPhotoSize[];
  entities?: Array<{ type: string; offset: number; length: number; url?: string }>;
  caption_entities?: Array<{ type: string; offset: number; length: number; url?: string }>;
};
