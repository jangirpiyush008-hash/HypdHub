"use client";

import { useEffect, useState } from "react";

export function WelcomeScreen({ username, onComplete }: { username: string; onComplete: () => void }) {
  const [step, setStep] = useState(0);
  // 0=blank, 1=HYPD, 2=Deal, 3=Hub, 4=welcome username, 5=exit

  useEffect(() => {
    const timings = [150, 500, 850, 1200, 1700, 2200];
    const timers = timings.map((ms, i) =>
      setTimeout(() => {
        if (i < 5) setStep(i + 1);
        else onComplete();
      }, ms)
    );
    return () => timers.forEach(clearTimeout);
  }, [onComplete]);

  const exiting = step >= 5;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-center justify-center bg-surface transition-opacity duration-500 ${
        exiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Background glow */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/2 h-[600px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/10 blur-[120px]" />
        <div className="absolute left-1/3 top-1/3 h-[300px] w-[300px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-secondary/10 blur-[80px]" />
      </div>

      <div className="relative text-center">
        {/* Brand reveal: HYPD Deal Hub — one word at a time */}
        <h1 className="font-headline text-5xl font-black tracking-tight sm:text-7xl">
          <span
            className={`inline-block transition-all duration-500 ${
              step >= 1 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <span className="hypd-gradient-text">HYPD</span>
          </span>{" "}
          <span
            className={`inline-block transition-all duration-500 ${
              step >= 2 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <span className="text-text">Deal</span>
          </span>{" "}
          <span
            className={`inline-block transition-all duration-500 ${
              step >= 3 ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
          >
            <span className="text-text/60">Hub</span>
          </span>
        </h1>

        {/* Welcome username — appears after brand */}
        <div
          className={`mt-6 transition-all duration-600 ${
            step >= 4 ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
        >
          <p className="text-lg text-muted">Welcome back,</p>
          <p className="mt-1 font-headline text-3xl font-bold text-primary sm:text-4xl">
            @{username}
          </p>
        </div>

        {/* Progress bar */}
        <div className="mx-auto mt-8 h-1 w-40 overflow-hidden rounded-full bg-surface-high">
          <div
            className="h-full rounded-full bg-cta-gradient transition-all duration-300 ease-out"
            style={{ width: `${Math.min(step * 25, 100)}%` }}
          />
        </div>
      </div>
    </div>
  );
}
