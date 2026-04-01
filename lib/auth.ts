import { CreatorProfile } from "@/lib/types";

export const CREATOR_SESSION_KEY = "hypd_creator_session";
export const HYPD_UPSTREAM_SESSION_COOKIE = "hypd_upstream_session";
export const ENTITY_URL = "https://entity.hypd.store";
export const CATALOG_URL = "https://catalog2.hypd.store";
export const ORDER_URL = "https://order2.hypd.store";

export function normalizeMobileNumber(value: string) {
  const digits = value.replace(/\D/g, "");

  if (digits.length === 10) {
    return `91${digits}`;
  }

  if (digits.length === 12 && digits.startsWith("91")) {
    return digits;
  }

  return digits;
}

export function formatIndianMobileNumber(value: string) {
  const normalized = normalizeMobileNumber(value);

  if (normalized.length === 12 && normalized.startsWith("91")) {
    return `+${normalized}`;
  }

  return value;
}

export function serializeCreator(profile: CreatorProfile) {
  return JSON.stringify(profile);
}

export function parseCreator(value: string | null): CreatorProfile | null {
  if (!value) return null;

  try {
    return JSON.parse(value) as CreatorProfile;
  } catch {
    return null;
  }
}
