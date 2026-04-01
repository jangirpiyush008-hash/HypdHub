import {
  OFFICIAL_HYPD_BOT_USERNAME,
  OFFICIAL_HYPD_SOURCE_CHANNEL,
  OFFICIAL_HYPD_SOURCE_LABEL,
  TelegramAutomation
} from "@/lib/automation-config";

export function getOfficialTelegramBotToken() {
  return process.env.TELEGRAM_OFFICIAL_BOT_TOKEN?.trim() ?? "";
}

export function normalizeTelegramAutomationForSave(automation: TelegramAutomation): TelegramAutomation {
  if (automation.sourceMode !== "official_hypd") {
    return automation;
  }

  return {
    ...automation,
    sourceChannelLabel: OFFICIAL_HYPD_SOURCE_LABEL,
    sourceChannelId: OFFICIAL_HYPD_SOURCE_CHANNEL,
    botUsername: OFFICIAL_HYPD_BOT_USERNAME,
    botToken: ""
  };
}

export function sanitizeTelegramAutomationForClient(automation: TelegramAutomation): TelegramAutomation {
  if (automation.sourceMode !== "official_hypd") {
    return automation;
  }

  return {
    ...automation,
    sourceChannelLabel: OFFICIAL_HYPD_SOURCE_LABEL,
    sourceChannelId: OFFICIAL_HYPD_SOURCE_CHANNEL,
    botUsername: OFFICIAL_HYPD_BOT_USERNAME,
    botToken: getOfficialTelegramBotToken() ? "Managed by HYPD" : ""
  };
}

export function resolveTelegramAutomationBotToken(automation: TelegramAutomation) {
  if (automation.sourceMode === "official_hypd") {
    return getOfficialTelegramBotToken();
  }

  return automation.botToken.trim();
}
