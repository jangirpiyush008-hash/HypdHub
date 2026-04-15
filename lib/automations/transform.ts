/**
 * Message transform engine for automations.
 *
 * Takes a raw Telegram message + automation config, returns the outbound
 * message (or null if filtered out).
 *
 * Steps:
 *   1. Apply blacklist filters → drop message
 *   2. Apply find/replace rewrites
 *   3. Extract URLs from text + entities, clean & convert through HYPD
 *      (if linkConversionEnabled), replacing each URL inline
 *   4. Apply start/end wrapper text
 *   5. Apply caption template (if provided)
 */

import { TelegramAutomation } from "@/lib/automation-config";
import { TelegramMessage } from "@/lib/integrations/telegram-bot-api";
import { cleanUrlForHypd } from "@/lib/url-cleaner";
import { generateHypdConversion } from "@/lib/hypd-links";

export type TransformResult = {
  kind: "skip" | "text" | "photo";
  text?: string;
  photoFileId?: string;
  caption?: string;
  reason?: string;
};

const URL_REGEX = /https?:\/\/[^\s)"']+/gi;

function getRawText(msg: TelegramMessage): string {
  return msg.text ?? msg.caption ?? "";
}

function getEntityUrls(msg: TelegramMessage): string[] {
  const entities = [...(msg.entities ?? []), ...(msg.caption_entities ?? [])];
  return entities
    .map((e) => (e.type === "text_link" ? e.url : undefined))
    .filter((u): u is string => Boolean(u));
}

/**
 * Collect all URLs appearing in the message — both plain-text and hyperlinked entities.
 */
function collectUrls(msg: TelegramMessage): string[] {
  const text = getRawText(msg);
  const plain = [...text.matchAll(URL_REGEX)].map((m) => m[0]);
  const entity = getEntityUrls(msg);
  return [...new Set([...plain, ...entity])];
}

function applyBlacklist(text: string, patterns: string[]): boolean {
  const lc = text.toLowerCase();
  return patterns.some((p) => {
    const needle = p.trim().toLowerCase();
    return needle.length > 0 && lc.includes(needle);
  });
}

function applyReplacements(text: string, pairs: Array<{ find: string; replace: string }>): string {
  return pairs.reduce((acc, { find, replace }) => {
    if (!find) return acc;
    return acc.split(find).join(replace);
  }, text);
}

function applyTemplate(template: string, variables: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => variables[key] ?? "");
}

/**
 * Build the outbound text for a message, running each URL through the HYPD
 * cleaner + affiliate conversion if enabled.
 */
export async function transformMessage(
  msg: TelegramMessage,
  automation: TelegramAutomation,
  creatorUsername: string
): Promise<TransformResult> {
  if (!automation.enabled) {
    return { kind: "skip", reason: "automation_disabled" };
  }

  let text = getRawText(msg);
  if (!text && !msg.photo) {
    return { kind: "skip", reason: "empty_message" };
  }

  // 1. Blacklist
  if (automation.blacklistTexts.length > 0 && applyBlacklist(text, automation.blacklistTexts)) {
    return { kind: "skip", reason: "blacklist_match" };
  }

  // 2. Replacements
  if (automation.replaceTexts.length > 0) {
    text = applyReplacements(text, automation.replaceTexts);
  }

  // 3. Link conversion
  if (automation.linkConversionEnabled) {
    const urls = collectUrls(msg);
    for (const raw of urls) {
      try {
        const cleaned = await cleanUrlForHypd(raw);
        const converted = generateHypdConversion(cleaned, creatorUsername);
        if (converted && converted.marketplace !== "Unsupported" && converted.shortLink) {
          text = text.split(raw).join(converted.shortLink);
        } else if (cleaned !== raw) {
          // At minimum, strip competitor params even if HYPD can't convert
          text = text.split(raw).join(cleaned);
        }
      } catch {
        // Leave URL as-is on failure
      }
    }
  }

  // 4. Start/end wrappers
  const parts: string[] = [];
  if (automation.startPostText.trim()) parts.push(automation.startPostText.trim());
  parts.push(text);
  if (automation.endPostText.trim()) parts.push(automation.endPostText.trim());
  let finalText = parts.join("\n\n");

  // 5. Template (if provided, wraps the message)
  if (automation.captionTemplate.trim()) {
    finalText = applyTemplate(automation.captionTemplate, {
      message: finalText,
      text: finalText,
      source: automation.sourceChannelLabel ?? "",
    });
  }

  // Decide text vs photo delivery based on postFormat + whether source has a photo
  const hasPhoto = Array.isArray(msg.photo) && msg.photo.length > 0;
  const largestPhoto = hasPhoto ? msg.photo![msg.photo!.length - 1] : null;

  if (hasPhoto && automation.postFormat !== "without_image" && largestPhoto) {
    return { kind: "photo", photoFileId: largestPhoto.file_id, caption: finalText };
  }

  return { kind: "text", text: finalText };
}
