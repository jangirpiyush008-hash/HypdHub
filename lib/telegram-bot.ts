import { TelegramAutomation } from "@/lib/automation-config";
import { getOfficialTelegramBotToken, resolveTelegramAutomationBotToken } from "@/lib/telegram-official-bot";

function getTelegramApiBase(token: string) {
  return `https://api.telegram.org/bot${token}`;
}

function cleanChannelRef(value: string) {
  return value.trim();
}

export function getDestinationChatRef(automation: TelegramAutomation) {
  return cleanChannelRef(automation.destinationChannelId || automation.destinationChannelUsername);
}

export function getSourceChatRef(automation: TelegramAutomation) {
  return cleanChannelRef(automation.sourceChannelId);
}

export function isOfficialBotConfigured() {
  return Boolean(getOfficialTelegramBotToken());
}

export async function postDealToTelegramAutomation(
  automation: TelegramAutomation,
  payload: {
    text: string;
    imageUrl?: string | null;
  }
) {
  const token = resolveTelegramAutomationBotToken(automation);
  const chatId = getDestinationChatRef(automation);

  if (!token) {
    throw new Error("Telegram bot token is not configured.");
  }

  if (!chatId) {
    throw new Error("Destination Telegram channel is not configured.");
  }

  const base = getTelegramApiBase(token);
  const usePhoto = Boolean(payload.imageUrl) && automation.postFormat !== "without_image";
  const endpoint = usePhoto ? `${base}/sendPhoto` : `${base}/sendMessage`;

  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(
      usePhoto
        ? {
            chat_id: chatId,
            photo: payload.imageUrl,
            caption: payload.text
          }
        : {
            chat_id: chatId,
            text: payload.text,
            disable_web_page_preview: automation.postFormat === "without_image"
          }
    ),
    cache: "no-store"
  });

  const result = await response.json().catch(() => null);

  if (!response.ok || !result?.ok) {
    throw new Error(result?.description || "Telegram post failed.");
  }

  return result;
}
