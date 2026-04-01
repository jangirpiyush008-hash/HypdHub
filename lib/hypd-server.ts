import { cookies } from "next/headers";
import { CreatorProfile } from "@/lib/types";
import {
  clearCreatorSession,
  getCreatorSession,
  saveCreatorSession
} from "@/lib/runtime/hypd-creator-sessions";
import {
  CATALOG_URL,
  ENTITY_URL,
  HYPD_UPSTREAM_SESSION_COOKIE,
  formatIndianMobileNumber,
  normalizeMobileNumber
} from "@/lib/auth";

export type UpstreamCookie = {
  name: string;
  value: string;
};

type HypdUserPayload = {
  id?: string | number;
  name?: string;
  email?: string;
  phone_no?: {
    prefix?: string;
    number?: string | number;
  };
  influencer_info?: {
    id?: string | number;
    _id?: string | number;
    username?: string;
    name?: string;
    email?: string;
    phone_no?: {
      prefix?: string;
      number?: string | number;
    };
    store_display_name?: string;
  };
};

function encodeStoredCookies(cookieValues: UpstreamCookie[]) {
  return Buffer.from(JSON.stringify(cookieValues), "utf8").toString("base64");
}

function decodeStoredCookies(value: string): UpstreamCookie[] {
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64").toString("utf8")) as UpstreamCookie[];
    return parsed.filter((item) => item?.name && item?.value);
  } catch {
    return [];
  }
}

function mergeCookies(existing: UpstreamCookie[], incoming: UpstreamCookie[]) {
  const merged = new Map<string, string>();

  existing.forEach((cookie) => merged.set(cookie.name, cookie.value));
  incoming.forEach((cookie) => merged.set(cookie.name, cookie.value));

  return Array.from(merged.entries()).map(([name, value]) => ({ name, value }));
}

function parseSetCookieHeader(header: string) {
  const [pair] = header.split(";");
  const separator = pair.indexOf("=");

  if (separator === -1) {
    return null;
  }

  const name = pair.slice(0, separator).trim();
  const value = pair.slice(separator + 1).trim();

  if (!name || !value) {
    return null;
  }

  return { name, value };
}

function extractResponseCookies(response: Response) {
  const cookieHeaders =
    typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : response.headers
          .get("set-cookie")
          ?.split(/,(?=[^;,]+=[^;,]+)/g)
          .map((item) => item.trim()) ?? [];

  return cookieHeaders
    .map(parseSetCookieHeader)
    .filter((cookie): cookie is UpstreamCookie => Boolean(cookie));
}

function buildCookieHeader(cookiesToSend: UpstreamCookie[]) {
  return cookiesToSend.map((cookie) => `${cookie.name}=${cookie.value}`).join("; ");
}

export async function getStoredHypdCookies() {
  const cookieStore = await cookies();
  const stored = cookieStore.get(HYPD_UPSTREAM_SESSION_COOKIE)?.value;

  if (!stored) {
    return [];
  }

  return decodeStoredCookies(stored);
}

export async function saveStoredHypdCookies(incoming: UpstreamCookie[]) {
  const cookieStore = await cookies();
  const existing = await getStoredHypdCookies();
  const merged = mergeCookies(existing, incoming);

  cookieStore.set(HYPD_UPSTREAM_SESSION_COOKIE, encodeStoredCookies(merged), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 14
  });

  return merged;
}

export async function clearStoredHypdCookies() {
  const cookieStore = await cookies();
  cookieStore.delete(HYPD_UPSTREAM_SESSION_COOKIE);
}

async function hypdFetch(url: string, init: RequestInit = {}, upstreamCookies: UpstreamCookie[] = []) {
  const headers = new Headers(init.headers);

  if (!headers.has("Content-Type") && init.body) {
    headers.set("Content-Type", "application/json");
  }

  if (upstreamCookies.length > 0) {
    headers.set("Cookie", buildCookieHeader(upstreamCookies));
  }

  return fetch(url, {
    ...init,
    headers,
    cache: "no-store"
  });
}

function mapPhoneNumber(user: HypdUserPayload) {
  const phone = user.influencer_info?.phone_no ?? user.phone_no;
  const prefix = phone?.prefix ?? "+91";
  const number = String(phone?.number ?? "").trim();

  if (!number) {
    return "";
  }

  return formatIndianMobileNumber(`${prefix}${number}`);
}

function toCreatorProfile(user: HypdUserPayload, influencerInfo?: Record<string, unknown> | null): CreatorProfile {
  const username =
    String(
      influencerInfo?.username ??
        user.influencer_info?.username ??
        ""
    ).trim() || "creator";

  const name =
    String(
      influencerInfo?.name ??
        user.influencer_info?.name ??
        user.name ??
        influencerInfo?.store_display_name ??
        "HYPD Creator"
    ).trim() || "HYPD Creator";

  const email =
    String(
      influencerInfo?.email ??
        user.influencer_info?.email ??
        user.email ??
        ""
    ).trim();

  const hypdUserId = String(
    influencerInfo?.id ??
      user.influencer_info?.id ??
      user.influencer_info?._id ??
      user.id ??
      ""
  ).trim();

  return {
    id: hypdUserId || username,
    hypdUserId: hypdUserId || username,
    hypdUsername: username,
    name,
    email,
    mobileNumber: mapPhoneNumber(user),
    role: "creator"
  };
}

export function getErrorMessage(payload: unknown, fallback: string) {
  if (
    payload &&
    typeof payload === "object" &&
    "error" in payload &&
    Array.isArray((payload as { error?: unknown[] }).error)
  ) {
    const first = (payload as { error?: Array<{ message?: string }> }).error?.[0];
    if (first?.message) {
      return first.message;
    }
  }

  return fallback;
}

export async function requestHypdOtp(mobileNumber: string) {
  const normalized = normalizeMobileNumber(mobileNumber);

  if (!normalized || normalized.length !== 12 || !normalized.startsWith("91")) {
    return {
      ok: false,
      message: "Enter a valid HYPD mobile number."
    };
  }

  const response = await hypdFetch(`${ENTITY_URL}/api/customer/otp/generate`, {
    method: "POST",
    body: JSON.stringify({
      phone_no: {
        prefix: "+91",
        number: normalized.slice(2)
      }
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.payload) {
    return {
      ok: false,
      message: getErrorMessage(payload, "Unable to send OTP for this HYPD mobile number.")
    };
  }

  const cookiesFromResponse = extractResponseCookies(response);
  if (cookiesFromResponse.length > 0) {
    await saveStoredHypdCookies(cookiesFromResponse);
  }

  return {
    ok: true,
    message: `OTP sent to ${formatIndianMobileNumber(normalized)}.`
  };
}

export async function fetchCurrentHypdCreator(upstreamCookies?: UpstreamCookie[]) {
  const storedCookies = upstreamCookies ?? (await getStoredHypdCookies());

  if (storedCookies.length === 0) {
    return null;
  }

  const meResponse = await hypdFetch(`${ENTITY_URL}/api/me?isWeb=true`, { method: "POST" }, storedCookies);
  const mePayload = await meResponse.json().catch(() => null);

  if (!meResponse.ok || !mePayload?.payload?.data) {
    return null;
  }

  const user = mePayload.payload.data as HypdUserPayload;
  const username = user.influencer_info?.username;

  if (!username) {
    return toCreatorProfile(user, null);
  }

  const influencerResponse = await hypdFetch(
    `${ENTITY_URL}/api/v2/app/influencer/username/${encodeURIComponent(username)}`,
    { method: "GET" },
    storedCookies
  );
  const influencerPayload = await influencerResponse.json().catch(() => null);

  return toCreatorProfile(user, influencerPayload?.payload ?? null);
}

export async function verifyHypdOtp(mobileNumber: string, otp: string) {
  const normalized = normalizeMobileNumber(mobileNumber);

  if (!normalized || normalized.length !== 12 || !normalized.startsWith("91")) {
    return {
      ok: false,
      message: "Enter a valid HYPD mobile number."
    };
  }

  const response = await hypdFetch(`${ENTITY_URL}/api/customer/otp/confirm?isWeb=true`, {
    method: "POST",
    body: JSON.stringify({
      phone_no: {
        prefix: "+91",
        number: normalized.slice(2)
      },
      otp: otp.trim()
    })
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.payload) {
    return {
      ok: false,
      message: getErrorMessage(payload, "OTP verification failed.")
    };
  }

  const responseCookies = extractResponseCookies(response);
  const mergedCookies = await saveStoredHypdCookies(responseCookies);
  const creator = await fetchCurrentHypdCreator(mergedCookies);

  if (!creator) {
    return {
      ok: false,
      message: "HYPD login succeeded, but we could not load your creator profile."
    };
  }

  await saveCreatorSession(creator, mergedCookies);

  return {
    ok: true,
    message: "Login successful.",
    creator
  };
}

export async function logoutHypdSession() {
  const storedCookies = await getStoredHypdCookies();
  const creator = storedCookies.length > 0 ? await fetchCurrentHypdCreator(storedCookies) : null;

  if (storedCookies.length > 0) {
    await hypdFetch(`${ENTITY_URL}/api/user/auth/logout`, { method: "GET" }, storedCookies).catch(() => null);
  }

  await clearStoredHypdCookies();

  if (creator?.id) {
    await clearCreatorSession(creator.id).catch(() => null);
  }
}

export async function convertHypdMarketplaceLinkWithCookies(
  sourceUrl: string,
  creator: CreatorProfile,
  upstreamCookies: UpstreamCookie[]
) {
  if (upstreamCookies.length === 0) {
    throw new Error("Login required");
  }

  const deeplinkResponse = await hypdFetch(
    `${CATALOG_URL}/api/app/influencer/deeplink`,
    {
      method: "POST",
      body: JSON.stringify({
        product_link: sourceUrl
      })
    },
    upstreamCookies
  );
  const deeplinkPayload = await deeplinkResponse.json().catch(() => null);

  if (deeplinkResponse.ok && deeplinkPayload?.payload) {
    return deeplinkPayload.payload;
  }

  const universalResponse = await hypdFetch(
    `${CATALOG_URL}/api/app/influencer/link/convert`,
    {
      method: "POST",
      body: JSON.stringify({
        source: "universal",
        product_link: sourceUrl,
        influencer_id: creator.hypdUserId,
        username: creator.hypdUsername
      })
    },
    upstreamCookies
  );
  const universalPayload = await universalResponse.json().catch(() => null);

  if (!universalResponse.ok || !universalPayload?.payload) {
    throw new Error(getErrorMessage(universalPayload, "Unable to convert this link on HYPD."));
  }

  return universalPayload.payload;
}

export async function convertHypdMarketplaceLink(sourceUrl: string, creator: CreatorProfile) {
  const storedCookies = await getStoredHypdCookies();
  return convertHypdMarketplaceLinkWithCookies(sourceUrl, creator, storedCookies);
}

export async function getStoredCreatorSession(creatorId: string) {
  return getCreatorSession(creatorId);
}

export async function convertHypdMarketplaceLinkForStoredCreator(creatorId: string, sourceUrl: string) {
  const session = await getCreatorSession(creatorId);

  if (!session) {
    throw new Error("Creator session unavailable. Please login again.");
  }

  return convertHypdMarketplaceLinkWithCookies(sourceUrl, session.creator, session.cookies);
}
