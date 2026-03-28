export const MAX_AUTOMATIONS = 5;

export type PostFormat = "with_image" | "without_image" | "both";

export type BaseAutomation = {
  id: string;
  name: string;
  sourceLabel: string;
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
  botToken: string;
  botUsername: string;
  channelUsername: string;
  channelId: string;
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
    sourceLabel: "Live deals feed",
    postingWindow: "",
    captionTemplate: "",
    fallbackTarget: "",
    postFormat: "with_image",
    linkConversionEnabled: true,
    autoForwardEnabled: true,
    autoPostingEnabled: false,
    enabled: true,
    botToken: "",
    botUsername: "",
    channelUsername: "",
    channelId: "",
    adminUserId: "",
    webhookUrl: ""
  };
}

export function createWhatsAppAutomation(): WhatsAppAutomation {
  return {
    id: createId("wa"),
    name: "",
    sourceLabel: "Live deals feed",
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
