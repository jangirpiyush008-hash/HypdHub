"use client";

import { useEffect, useState } from "react";

const PAPAPA_DISMISSED_KEY = "hypd-papapa-promo-dismissed";

export function PapapaPromo({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Small delay so it feels like it appears after the page loads
    const t = setTimeout(() => setVisible(true), 200);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setVisible(false);
    try { sessionStorage.setItem(PAPAPA_DISMISSED_KEY, "1"); } catch {}
    setTimeout(onClose, 300);
  }

  return (
    <div
      className={`fixed inset-0 z-[90] flex items-center justify-center px-4 transition-opacity duration-300 ${
        visible ? "opacity-100" : "opacity-0 pointer-events-none"
      }`}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={dismiss} />

      {/* Popup */}
      <div
        className={`relative w-full max-w-sm rounded-2xl bg-surface-card p-6 shadow-xl transition-all duration-300 ${
          visible ? "scale-100 translate-y-0" : "scale-95 translate-y-4"
        }`}
      >
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-surface-high text-muted transition-colors hover:text-text"
        >
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <line x1="18" y1="6" x2="6" y2="18" />
            <line x1="6" y1="6" x2="18" y2="18" />
          </svg>
        </button>

        {/* Papapa branding */}
        <div className="flex flex-col items-center text-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-tertiary/15">
            <svg className="h-8 w-8 text-tertiary" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <line x1="3" y1="6" x2="21" y2="6" />
              <path d="M16 10a4 4 0 01-8 0" />
            </svg>
          </div>

          <h3 className="mt-4 font-headline text-xl font-black text-text">
            Shop on <span className="text-tertiary">Papapa</span>
          </h3>

          <p className="mt-2 text-sm text-muted leading-relaxed">
            Papapa is HYPD&apos;s own shopping platform with a <span className="font-semibold text-text">reward points system</span>.
            Buy products and earn points you can use for future purchases!
          </p>

          {/* Highlights */}
          <div className="mt-4 flex gap-3">
            <div className="flex-1 rounded-lg bg-surface-high px-3 py-2">
              <p className="text-lg font-bold text-tertiary">Earn</p>
              <p className="text-[10px] text-muted">Points on every buy</p>
            </div>
            <div className="flex-1 rounded-lg bg-surface-high px-3 py-2">
              <p className="text-lg font-bold text-tertiary">Redeem</p>
              <p className="text-[10px] text-muted">Use points to shop</p>
            </div>
            <div className="flex-1 rounded-lg bg-surface-high px-3 py-2">
              <p className="text-lg font-bold text-tertiary">Save</p>
              <p className="text-[10px] text-muted">Exclusive deals</p>
            </div>
          </div>

          {/* CTA */}
          <a
            href="https://getpapapa.com/"
            target="_blank"
            rel="noreferrer"
            className="mt-5 w-full rounded-xl bg-tertiary px-6 py-3 text-center text-sm font-bold text-white shadow-lg transition-transform hover:scale-[1.02] active:scale-[0.98]"
          >
            Visit Papapa
          </a>

          <button
            onClick={dismiss}
            className="mt-3 text-xs text-muted hover:text-text transition-colors"
          >
            Maybe later
          </button>
        </div>
      </div>
    </div>
  );
}

/** Returns true if the promo should be shown (not dismissed this session) */
export function shouldShowPapapaPromo(): boolean {
  try {
    return !sessionStorage.getItem(PAPAPA_DISMISSED_KEY);
  } catch {
    return true;
  }
}
