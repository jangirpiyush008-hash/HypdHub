"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { CREATOR_SESSION_KEY, parseCreator, serializeCreator } from "@/lib/auth";
import { CreatorProfile } from "@/lib/types";

type AuthContextValue = {
  creator: CreatorProfile | null;
  isAuthenticated: boolean;
  isReady: boolean;
  pendingMobileNumber: string | null;
  pendingHypdUsername: string | null;
  requestOtp: (mobileNumber: string) => Promise<{
    ok: boolean;
    message: string;
  }>;
  verifyOtp: (otp: string) => Promise<{
    ok: boolean;
    message: string;
    username: string | null;
  }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [creator, setCreator] = useState<CreatorProfile | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [pendingCreator, setPendingCreator] = useState<CreatorProfile | null>(null);
  const [pendingMobileNumber, setPendingMobileNumber] = useState<string | null>(null);
  const [pendingHypdUsername, setPendingHypdUsername] = useState<string | null>(null);

  useEffect(() => {
    const stored = window.localStorage.getItem(CREATOR_SESSION_KEY);
    const cached = parseCreator(stored);

    if (cached) {
      setCreator(cached);
    }

    async function loadSession() {
      try {
        const response = await fetch("/api/session", {
          cache: "no-store"
        });

        if (!response.ok) {
          window.localStorage.removeItem(CREATOR_SESSION_KEY);
          setCreator(null);
          return;
        }

        const payload = (await response.json()) as { creator: CreatorProfile };
        setCreator(payload.creator);
        window.localStorage.setItem(CREATOR_SESSION_KEY, serializeCreator(payload.creator));
      } catch {
        if (!cached) {
          setCreator(null);
        }
      } finally {
        setIsReady(true);
      }
    }

    loadSession().catch(() => setIsReady(true));
  }, []);

  async function requestOtp(mobileNumber: string) {
    try {
      const response = await fetch("/api/auth/request-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ mobileNumber })
      });
      const result = (await response.json()) as {
        ok: boolean;
        message: string;
      };

      if (!response.ok || !result.ok) {
        setPendingCreator(null);
        setPendingMobileNumber(null);
        setPendingHypdUsername(null);
        return result;
      }

      setPendingMobileNumber(mobileNumber);
      setPendingHypdUsername(null);
      return result;
    } catch {
      setPendingCreator(null);
      setPendingMobileNumber(null);
      setPendingHypdUsername(null);
      return {
        ok: false,
        message: "Unable to request OTP from HYPD right now."
      };
    }
  }

  async function verifyOtp(otp: string) {
    if (!pendingMobileNumber) {
      return {
        ok: false,
        message: "Enter your HYPD mobile number first.",
        username: null as string | null
      };
    }

    try {
      const response = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          mobileNumber: pendingMobileNumber,
          otp
        })
      });
      const result = (await response.json()) as {
        ok: boolean;
        message: string;
        creator?: CreatorProfile;
      };

      if (!response.ok || !result.ok || !result.creator) {
        return {
          ok: false,
          message: result.message || "Incorrect OTP. Please try again.",
          username: null as string | null
        };
      }

      window.localStorage.setItem(CREATOR_SESSION_KEY, serializeCreator(result.creator));
      setCreator(result.creator);
      setPendingCreator(result.creator);
      setPendingMobileNumber(null);
      setPendingHypdUsername(result.creator.hypdUsername);

      return {
        ok: true,
        message: result.message,
        username: result.creator.hypdUsername
      };
    } catch {
      return {
        ok: false,
        message: "Unable to verify OTP right now.",
        username: null as string | null
      };
    }
  }

  async function logout() {
    try {
      await fetch("/api/auth/logout", {
        method: "POST"
      });
    } catch {
      // Ignore logout network failures and still clear the local shell session.
    } finally {
      window.localStorage.removeItem(CREATOR_SESSION_KEY);
      setCreator(null);
      setPendingCreator(null);
      setPendingMobileNumber(null);
      setPendingHypdUsername(null);
    }
  }

  const value = useMemo(
    () => ({
      creator,
      isAuthenticated: Boolean(creator),
      isReady,
      pendingMobileNumber,
      pendingHypdUsername,
      requestOtp,
      verifyOtp,
      logout
    }),
    [creator, isReady, pendingHypdUsername, pendingMobileNumber]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useCreatorAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useCreatorAuth must be used within AuthProvider");
  }

  return context;
}
