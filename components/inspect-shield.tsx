"use client";

/**
 * InspectShield + DecoyTrap — client-side inspection deterrent with
 * fake-code redirection.
 *
 * IMPORTANT — what this is and isn't:
 *   - It's a deterrent that raises the bar against casual snooping
 *     (right-click, F12, "view source", Cmd+S, copy-paste of prices)
 *     AND actively misleads anyone who pops DevTools open by feeding
 *     their console fake function bodies, fake stack traces, and
 *     fake source URLs.
 *   - It is NOT cryptographic protection. A determined dev with
 *     Charles/mitmproxy or curl can still read the network traffic.
 *     Real protection lives server-side: source-of-truth in API routes,
 *     /api/deals strips source-evidence, prod source maps are off,
 *     console.* calls stripped from prod bundle.
 *
 * Layered defenses (least → most aggressive):
 *   1. Block right-click + F12 + DevTools shortcuts
 *   2. Disable text selection on non-form elements
 *   3. Override Function.prototype.toString so any function the
 *      inspector tries to read returns a fake minified blob
 *   4. Pollute the console with decoy log lines that look like
 *      legitimate framework internals (so real logs are needles in
 *      a haystack of fakes)
 *   5. When DevTools is detected open, replace the entire page with
 *      a static decoy and tear down the React tree
 *
 * Active only in production. In dev we want full DevTools.
 */

import { useEffect } from "react";

// Fake "minified" function bodies the toString trap returns. These
// look plausible enough that someone reading them in Sources panel
// might briefly think they're real, then move on.
const FAKE_FN_BODIES = [
  "function(t,n,r){var i=n.length,o=Array(i);for(;i--;)o[i]=n[i];return t.apply(r,o)}",
  "function(){var e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};return Object.assign({},e,{__cached__:true})}",
  "function(t){return t&&typeof t==='object'?Object.keys(t).reduce(function(r,k){return r[k]=t[k],r},{}):t}",
  "function(e,t){if(!e||typeof e!=='function')throw new TypeError('Expected fn');return function(){return e.apply(t,arguments)}}",
];

// Decoy console messages. Sprinkled randomly so a real inspector sees
// a noisy, low-information console rather than our actual logs.
const FAKE_CONSOLE_LINES = [
  "[hh-runtime] hydrated 0 nodes",
  "[hh-runtime] cache miss /v3/sync — refetching",
  "[hh-runtime] WS heartbeat ok",
  "[hh-store] wrote 0 entries to volatile",
  "[hh-net] retry 1/3 (idle)",
  "[hh-perf] FCP 412ms LCP 887ms",
];

export function InspectShield() {
  useEffect(() => {
    if (process.env.NODE_ENV !== "production") return;

    // ─── Right-click block ────────────────────────────────────────────
    const onContextMenu = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return;
      e.preventDefault();
    };

    // ─── DevTools shortcut block ──────────────────────────────────────
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

    // ─── Function.prototype.toString trap ─────────────────────────────
    // When someone types `myFunction.toString()` or React DevTools tries
    // to read a component function's source, return a fake minified blob
    // instead. Native toString IS preserved for built-ins so the trap
    // isn't obvious from `String.toString` (which would return [native
    // code] and leak the override).
    const realToString = Function.prototype.toString;
    let pickIdx = 0;
    function fakeToString(this: unknown): string {
      // Built-ins from the global scope keep their real strings — those
      // checks would be obvious if we lied about them.
      try {
        const real = realToString.call(this);
        if (real.includes("[native code]")) return real;
      } catch {
        /* ignore */
      }
      pickIdx = (pickIdx + 1) % FAKE_FN_BODIES.length;
      return FAKE_FN_BODIES[pickIdx];
    }
    try {
      Object.defineProperty(Function.prototype, "toString", {
        value: fakeToString,
        configurable: true,
        writable: false,
      });
      // The trap itself should also lie about its own source.
      Object.defineProperty(fakeToString, "toString", {
        value: () => "function toString() { [native code] }",
        configurable: true,
      });
    } catch {
      /* environment refused; non-fatal */
    }

    // ─── Console pollution ────────────────────────────────────────────
    // Periodically emit fake log lines so any real console output is
    // buried under noise. Uses console.debug (lower priority filter)
    // so it doesn't drown legitimate errors.
    const consoleSpamId = window.setInterval(() => {
      try {
        const msg = FAKE_CONSOLE_LINES[Math.floor(Math.random() * FAKE_CONSOLE_LINES.length)];
        // Original console.* refs may have been stripped from the prod
        // bundle (see next.config.ts removeConsole), so feature-detect.
        const fn = (window.console as Console | undefined)?.debug;
        if (typeof fn === "function") fn.call(window.console, msg);
      } catch {
        /* ignore */
      }
    }, 4000);

    // ─── DevTools-open detection (timing trick) ───────────────────────
    // The `debugger` statement halts execution when DevTools is open.
    // Wrapping it in a Function and timing the call reveals the panel
    // state: open → 100ms+, closed → <5ms.
    let blanked = false;
    const overlay = document.createElement("div");
    overlay.id = "__hh_shield";
    overlay.style.cssText =
      "position:fixed;inset:0;background:#0a0a0a;color:#888;z-index:2147483647;display:none;align-items:center;justify-content:center;font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;line-height:1.6;text-align:left;padding:32px;white-space:pre;overflow:auto;";

    // Decoy "source code" shown when the inspector pops DevTools. Looks
    // like a minified bundle so they're tempted to paste it into a
    // beautifier — and find nothing useful.
    overlay.textContent = `/*! hypdhub.runtime ° v3.41.2 ° build af7c91 */
!function(e){"use strict";var t={cache:Object.create(null),hydrate:function(n){return e.__hh_h=(e.__hh_h||0)+1,n}};e.__hypd=t}(typeof globalThis!="undefined"?globalThis:window);
!function(){var e=Object.freeze({_v:3.41,_b:"af7c91",_s:["sync","cache","queue"]});Object.defineProperty(window,"__hh_meta",{value:e,writable:!1,configurable:!1})}();
/* eof */`;

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
      try {
        const probe = new Function("debugger");
        probe();
      } catch {
        /* ignore */
      }
      const elapsed = performance.now() - start;
      setBlanked(elapsed > 100);
    };

    document.addEventListener("contextmenu", onContextMenu);
    document.addEventListener("keydown", onKeyDown);
    const interval = window.setInterval(detectDevtools, 1500);

    // ─── Disable text selection on non-form content ───────────────────
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
      window.clearInterval(consoleSpamId);
      style.remove();
      overlay.remove();
      // We deliberately don't restore Function.prototype.toString —
      // restoring it would fire on every component unmount, which is
      // both unnecessary and could leak the trap on hot reload.
    };
  }, []);

  return null;
}
