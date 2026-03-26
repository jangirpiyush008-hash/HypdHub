"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import {
  CREATOR_SESSION_KEY,
  MOCK_OTP,
  findRegisteredHypdUser,
  parseCreator,
  serializeCreator
} from "@/lib/auth";
import { CreatorProfile } from "@/lib/types";

type AuthContextValue = {
  creator: CreatorProfile | null;
  isAuthenticated: boolean;
  isReady: boolean;
  pendingMobileNumber: string | null;
  pendingHypdUsername: string | null;
  requestOtp: (mobileNumber: string) => {
    ok: boolean;
    message: string;
  };
  verifyOtp: (otp: string) => {
    ok: boolean;
    message: string;
  };
  logout: () => void;
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
    setCreator(parseCreator(stored));
    setIsReady(true);
  }, []);

  function requestOtp(mobileNumber: string) {
    const profile = findRegisteredHypdUser(mobileNumber);

    if (!profile) {
      setPendingCreator(null);
      setPendingMobileNumber(null);
      setPendingHypdUsername(null);
      return {
        ok: false,
        message: "This mobile number is not registered on HYPD, so login is not allowed."
      };
    }

    setPendingCreator(profile);
    setPendingMobileNumber(profile.mobileNumber);
    setPendingHypdUsername(profile.hypdUsername);

    return {
      ok: true,
      message: `OTP sent to ${profile.mobileNumber}. HYPD username: @${profile.hypdUsername}. Use ${MOCK_OTP} for this demo flow.`
    };
  }

  function verifyOtp(otp: string) {
    if (!pendingCreator) {
      return {
        ok: false,
        message: "Enter your HYPD mobile number first."
      };
    }

    if (otp !== MOCK_OTP) {
      return {
        ok: false,
        message: "Incorrect OTP. Please try again."
      };
    }

    window.localStorage.setItem(CREATOR_SESSION_KEY, serializeCreator(pendingCreator));
    setCreator(pendingCreator);
    setPendingCreator(null);
    setPendingMobileNumber(null);
    setPendingHypdUsername(null);

    return {
      ok: true,
      message: "Login successful."
    };
  }

  function logout() {
    window.localStorage.removeItem(CREATOR_SESSION_KEY);
    setCreator(null);
    setPendingCreator(null);
    setPendingMobileNumber(null);
    setPendingHypdUsername(null);
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
