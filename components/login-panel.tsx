"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { useCreatorAuth } from "@/components/auth-provider";

export function LoginPanel() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") || "/deals";
  const { isAuthenticated, isReady, pendingMobileNumber, pendingHypdUsername, requestOtp, verifyOtp } =
    useCreatorAuth();
  const [mobileNumber, setMobileNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [status, setStatus] = useState("Use your HYPD registered mobile number to request OTP.");
  const [otpStepReady, setOtpStepReady] = useState(false);
  const [loading, setLoading] = useState<"idle" | "otp" | "verify">("idle");

  useEffect(() => {
    if (isReady && isAuthenticated) {
      router.replace(nextPath);
    }
  }, [isAuthenticated, isReady, nextPath, router]);

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
      router.replace(nextPath);
    }
  }

  return (
    <section className="mx-auto max-w-2xl rounded-[2rem] bg-surface-card p-8 shadow-ambient sm:p-10">
      <div className="max-w-xl">
        <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">HYPD Login</p>
        <h1 className="mt-4 font-headline text-4xl font-extrabold tracking-[-0.05em] text-text sm:text-5xl">
          Login with mobile number and OTP
        </h1>
        <p className="mt-4 text-base leading-7 text-muted">
          Only users whose mobile number is already registered on HYPD can sign in. If the number does
          not exist on HYPD, login will be blocked.
        </p>
        <p className="mt-3 text-sm leading-7 text-muted">
          Each HYPD user has their own username. After login, all generated links will use that logged-in
          user&apos;s HYPD username automatically.
        </p>

        <div className="mt-8 grid gap-4 rounded-[1.5rem] bg-surface-low p-5">
          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted">Mobile number</span>
            <input
              value={mobileNumber}
              onChange={(event) => setMobileNumber(event.target.value)}
              placeholder="+91 98765 43210"
              className="w-full rounded-xl bg-surface-top px-4 py-3 text-sm text-text outline-none"
            />
          </label>

          <button
            type="button"
            onClick={handleRequestOtp}
            disabled={loading !== "idle"}
            className="rounded-xl bg-cta-gradient px-5 py-3 font-headline text-sm font-bold text-white shadow-glow"
          >
            {loading === "otp" ? "Sending OTP..." : "Send OTP"}
          </button>

          <label className="space-y-2">
            <span className="text-xs font-bold uppercase tracking-[0.24em] text-muted">OTP</span>
            <input
              value={otp}
              onChange={(event) => setOtp(event.target.value)}
              placeholder="Enter 6-digit OTP"
              className="w-full rounded-xl bg-surface-top px-4 py-3 text-sm text-text outline-none"
              disabled={!otpStepReady || loading !== "idle"}
            />
          </label>

          <button
            type="button"
            onClick={handleVerifyOtp}
            disabled={!otpStepReady || loading !== "idle"}
            className="rounded-xl bg-surface-top px-5 py-3 font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading === "verify" ? "Verifying..." : "Verify OTP"}
          </button>
        </div>

        <div className="mt-6 rounded-[1.25rem] bg-[linear-gradient(180deg,rgba(255,171,243,0.12),rgba(138,35,135,0.18))] p-4">
          <p className="text-sm leading-7 text-text/90">{status}</p>
          {pendingMobileNumber ? (
            <div className="mt-2 space-y-2">
              <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                OTP waiting for {pendingMobileNumber}
              </p>
              {pendingHypdUsername ? (
                <p className="text-xs font-bold uppercase tracking-[0.24em] text-primary">
                  Username detected: @{pendingHypdUsername}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/"
            className="rounded-xl bg-surface-top px-6 py-4 text-center font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
          >
            Back to home
          </Link>
          <Link
            href="/deals"
            className="rounded-xl bg-surface-top px-6 py-4 text-center font-headline text-sm font-bold text-text transition-colors hover:bg-surface-bright"
          >
            View deals preview
          </Link>
        </div>
      </div>
    </section>
  );
}
