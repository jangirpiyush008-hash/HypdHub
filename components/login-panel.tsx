"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCreatorAuth } from "@/components/auth-provider";
import { PapapaPromo, shouldShowPapapaPromo } from "@/components/papapa-promo";
import { WelcomeScreen } from "@/components/welcome-screen";

type PostLoginPhase = "none" | "welcome" | "papapa" | "done";

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/deals";
  const { isAuthenticated, isReady, pendingMobileNumber, pendingHypdUsername, requestOtp, verifyOtp } =
    useCreatorAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("Enter your HYPD registered mobile number.");
  const [otpStepReady, setOtpStepReady] = useState(false);
  const [loading, setLoading] = useState<"idle" | "otp" | "verify">("idle");
  const [phase, setPhase] = useState<PostLoginPhase>("none");
  const [welcomeUsername, setWelcomeUsername] = useState("");

  // Only auto-redirect if user was already authenticated AND we're not in a post-login phase
  useEffect(() => {
    if (isReady && isAuthenticated && phase === "none") {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isReady, nextPath, router, phase]);

  // Navigate away when done
  useEffect(() => {
    if (phase === "done") {
      router.replace(nextPath);
    }
  }, [phase, nextPath, router]);

  function handleWelcomeComplete() {
    if (shouldShowPapapaPromo()) {
      setPhase("papapa");
    } else {
      setPhase("done");
    }
  }

  function handlePapapaClose() {
    setPhase("done");
  }

  async function handleRequestOtp() {
    setLoading("otp");
    const result = await requestOtp(mobileNumber);
    setStatus(result.message);
    setOtpStepReady(result.ok);
    setLoading("idle");
  }

  async function handleVerifyOtp() {
    setLoading("verify");
    const result = await verifyOtp(otp);
    setStatus(result.message);
    setLoading("idle");
    if (result.ok) {
      setWelcomeUsername(result.username ?? pendingHypdUsername ?? "creator");
      setPhase("welcome");
    }
  }

  if (phase === "welcome") {
    return <WelcomeScreen username={welcomeUsername} onComplete={handleWelcomeComplete} />;
  }

  if (phase === "papapa") {
    return <PapapaPromo onClose={handlePapapaClose} />;
  }

  return (
    <section className="mx-auto max-w-md">
      <div className="mb-8">
        <h1 className="font-headline text-3xl font-black tracking-tight text-text">
          Login to <span className="hypd-gradient-text">HYPD Hub</span>
        </h1>
        <p className="mt-2 text-sm text-muted">
          Use your HYPD registered mobile number and OTP.
        </p>
      </div>

      <div className="space-y-4 rounded-xl bg-surface-card p-6">
        <label className="block space-y-1.5">
          <span className="text-xs font-semibold text-muted">Mobile Number</span>
          <input
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            placeholder="+91 98765 43210"
            className="w-full rounded-lg bg-surface-high px-4 py-3 text-sm text-text outline-none placeholder:text-muted/50 focus:ring-1 focus:ring-primary/40"
          />
        </label>

        <button
          type="button"
          onClick={handleRequestOtp}
          disabled={loading !== "idle" || !mobileNumber.trim()}
          className="w-full rounded-lg bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow disabled:opacity-50"
        >
          {loading === "otp" ? "Sending OTP..." : "Send OTP"}
        </button>

        {otpStepReady ? (
          <>
            <label className="block space-y-1.5">
              <span className="text-xs font-semibold text-muted">OTP</span>
              <input
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                placeholder="Enter 6-digit OTP"
                className="w-full rounded-lg bg-surface-high px-4 py-3 text-sm text-text outline-none placeholder:text-muted/50 focus:ring-1 focus:ring-primary/40"
              />
            </label>

            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={loading !== "idle" || !otp.trim()}
              className="w-full rounded-lg bg-surface-high px-5 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright disabled:opacity-50"
            >
              {loading === "verify" ? "Verifying..." : "Verify OTP"}
            </button>
          </>
        ) : null}
      </div>

      {/* Status */}
      <div className="mt-4 rounded-lg bg-surface-card p-4">
        <p className="text-sm text-muted">{status}</p>
        {pendingMobileNumber ? (
          <p className="mt-2 text-xs font-semibold text-primary">
            OTP sent to {pendingMobileNumber}
            {pendingHypdUsername ? ` · @${pendingHypdUsername}` : ""}
          </p>
        ) : null}
      </div>
    </section>
  );
}
