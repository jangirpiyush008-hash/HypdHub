export const MAX_AUTOMATIONS = 5;
export const OFFICIAL_HYPD_SOURCE_LABEL = "Official HYPD Deals Channel";
export const OFFICIAL_HYPD_SOURCE_CHANNEL = "@hypdeals";
export const OFFICIAL_HYPD_BOT_USERNAME = "@HypdConverterbot";

export type PostFormat = "with_image" | "without_image" | "both";
export type TelegramSourceMode = "official_hypd" | "custom_channel";

export type BaseAutomation = {
  id: string;
  name: string;
  postingWindow: string;
  captionTemplate: string;
  fallbackTarget: string;
  postFormat: PostFormat;
  linkConversionEnabled: boolean;
  autoForwardEnabled: boolean;
  autoPostingEnabled: boolean;
  enabled: boolean;
};

export type TelegramAutomation = BaseAutomation & {
  sourceMode: TelegramSourceMode;
  sourceChannelLabel: string;
  sourceChannelId: string;
  botToken: string;
  botUsername: string;
  destinationChannelUsername: string;
  destinationChannelId: string;
  adminUserId: string;
  webhookUrl: string;
};

export type WhatsAppAutomation = BaseAutomation & {
  businessName: string;
  businessNumber: string;
  phoneNumberId: string;
  wabaId: string;
  permanentToken: string;
  webhookVerifyToken: string;
  defaultTemplate: string;
};

export const TELEGRAM_AUTOMATIONS_KEY = "hypd-telegram-automations";
export const WHATSAPP_AUTOMATIONS_KEY = "hypd-whatsapp-automations";
export const AUTOMATIONS_SAVED_AT_KEY = "hypd-automations-saved-at";

function createId(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
}

export function createTelegramAutomation(): TelegramAutomation {
  return {
    id: createId("tg"),
    name: "",
    sourceMode: "official_hypd",
    sourceChannelLabel: OFFICIAL_HYPD_SOURCE_LABEL,
    sourceChannelId: OFFICIAL_HYPD_SOURCE_CHANNEL,
    postingWindow: "",
    captionTemplate: "",
    fallbackTarget: "",
    postFormat: "with_image",
    linkConversionEnabled: true,
    autoForwardEnabled: true,
    autoPostingEnabled: false,
    enabled: true,
    botToken: "",
    botUsername: OFFICIAL_HYPD_BOT_USERNAME,
    destinationChannelUsername: "",
    destinationChannelId: "",
    adminUserId: "",
    webhookUrl: ""
  };
}

export function createWhatsAppAutomation(): WhatsAppAutomation {
  return {
    id: createId("wa"),
    name: "",
    postingWindow: "",
    captionTemplate: "",
    fallbackTarget: "",
    postFormat: "without_image",
    linkConversionEnabled: true,
    autoForwardEnabled: true,
    autoPostingEnabled: false,
    enabled: true,
    businessName: "",
    businessNumber: "",
    phoneNumberId: "",
    wabaId: "",
    permanentToken: "",
    webhookVerifyToken: "",
    defaultTemplate: ""
  };
}
