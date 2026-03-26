import { CreatorProfile } from "@/lib/types";

export const registeredHypdUsers: CreatorProfile[] = [
  {
    id: "user_001",
    hypdUserId: "creator_324",
    hypdUsername: "harshdubey123",
    name: "Piyush Jangir Jangir",
    email: "piyush@hypd.store",
    mobileNumber: "+91 98765 43210",
    role: "admin"
  },
  {
    id: "user_002",
    hypdUserId: "creator_672",
    hypdUsername: "aaravsharma",
    name: "Aarav Sharma",
    email: "aarav@hypd.store",
    mobileNumber: "+91 91234 56780",
    role: "creator"
  }
];

export const mockCreatorProfile = registeredHypdUsers[0];

export const CREATOR_SESSION_KEY = "hypd_creator_session";
export const MOCK_OTP = "123456";

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

export function findRegisteredHypdUser(mobileNumber: string) {
  const normalized = normalizeMobileNumber(mobileNumber);

  return (
    registeredHypdUsers.find(
      (profile) => normalizeMobileNumber(profile.mobileNumber) === normalized
    ) ?? null
  );
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
