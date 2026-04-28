"use client";

/**
 * InspectShield — client-side inspection deterrent.
 *
 * IMPORTANT — this is a deterrent, NOT real protection. Anything served to
 * a browser can be inspected with curl, a proxy, the `view-source:` URL
 * scheme, or by simply disabling JavaScript. Treat this as the front-door
 * lock: it blocks casual snooping (right-click, F12, Cmd+Opt+I) and visibly
 * obscures the page when DevTools is opened, but a determined dev will
 * always get past it. The actual protection lives elsewhere:
 *   - All scraper / source-of-truth logic stays server-side
 *   - /api/deals strips source-evidence and per-source counts
 *   - Production source maps are off (next.config.ts)
 *   - console.* calls are stripped from the prod bundle
 *
 * Activated only in production. In dev we want full DevTools.
 */

import { useEffect } from "react";

export function InspectShield() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // ─── Right-click block ────────────────────────────────────────────
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      // Allow right-click in form fields so users can paste/edit
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      e.preventDefault();
    };

    // ─── Block common inspect shortcuts ──────────────────────────────
    // F12, Ctrl/Cmd+Shift+I/J/C, Ctrl/Cmd+U (view source), Ctrl/Cmd+S (save)
    const onKeyDown = (e: KeyboardEvent) => {
      const key = e.key;
      const ctrl = e.ctrlKey || e.metaKey;
      const shift = e.shiftKey;
      if (
        key === "F12" ||
        (ctrl && shift && (key === "I" || key === "i" || key === "J" || key === "j" || key === "C" || key === "c")) ||
        (ctrl && (key === "U" || key === "u" || key === "S" || key === "s"))
      ) {
        e.preventDefault();
        e.stopPropagation();
      }
    };

    // ─── DevTools-open detection via timing trick ─────────────────────
    // When DevTools is open, console.log of a getter triggers a property
    // access (the panel inspects it). We measure the cost; if it's slow
    // enough, hide the page contents until DevTools closes.
    let blanked = false;
    const overlay = document.createElement("div");
    overlay.id = "__hh_shield";
    overlay.style.cssText =
      "position:fixed;inset:0;background:#fff;z-index:2147483647;display:none;align-items:center;justify-content:center;font-family:system-ui,sans-serif;color:#222;font-size:14px;text-align:center;padding:24px;";
    overlay.textContent = "Inspector closed — return to the deals page.";
    const attachOverlay = () => {
      if (!document.body.contains(overlay)) document.body.appendChild(overlay);
    };
    attachOverlay();

    const setBlanked = (next: boolean) => {
      if (next === blanked) return;
      blanked = next;
      overlay.style.display = next ? "flex" : "none";
    };

    const detectDevtools = () => {
      const start = performance.now();
      // The debugger statement halts execution while DevTools is open;
      // wrapping it in a function and toString-ing forces a "panel access".
      // We then time the round-trip: open panel → ~100ms+, closed → < 5ms.
      const probe = new Function("debugger");
      probe();
      const elapsed = performance.now() - start;
      setBlanked(elapsed > 100);
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    const interval = window.setInterval(detectDevtools, 1500);

    // Also disable text-selection on non-input elements via CSS so casual
    // copy-paste of pricing data is mildly inconvenienced. (Form fields
    // remain selectable thanks to the `:not(input):not(textarea)` part.)
    const style = document.createElement("style");
    style.textContent = `
      body { -webkit-user-select: none; user-select: none; }
      input, textarea, [contenteditable="true"] { -webkit-user-select: text; user-select: text; }
      ::selection { background: transparent; }
    `;
    document.head.appendChild(style);

    return () => {
      document.removeEventListener("contextmenu", onContextMenu);
      document.removeEventListener("keydown", onKeyDown);
      window.clearInterval(interval);
      style.remove();
      overlay.remove();
    };
  }, []);

  return null;
}
