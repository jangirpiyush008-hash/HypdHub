"use client";

import { useState } from "react";

export default function UnlockPage() {
  const [password, setPassword] = useState("");
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleUnlock = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const res = await fetch("/api/unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      if (res.ok) {
        // Cookie is set by the server response — just redirect
        window.location.href = "/";
      } else {
        setError(true);
        setTimeout(() => setError(false), 2000);
      }
    } catch {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-gray-950 via-gray-900 to-gray-950 p-4">
      <div className="w-full max-w-sm rounded-2xl bg-gray-800/60 p-8 shadow-2xl backdrop-blur border border-gray-700/50">
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-orange-500/15">
            <svg className="h-7 w-7 text-orange-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-white">HYPD Hub</h1>
          <p className="mt-1 text-sm text-gray-400">This site is currently locked. Enter password to access.</p>
        </div>

        <form onSubmit={handleUnlock} className="space-y-4">
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter password"
            autoFocus
            className={`w-full rounded-xl border bg-gray-900/50 px-4 py-3 text-sm text-white placeholder-gray-500 outline-none transition-all focus:ring-2 ${
              error
                ? "border-red-500 ring-red-500/30 animate-[shake_0.3s_ease-in-out]"
                : "border-gray-600 focus:border-orange-500 focus:ring-orange-500/30"
            }`}
          />
          {error && <p className="text-xs text-red-400 text-center">Wrong password. Try again.</p>}
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 py-3 text-sm font-bold text-white shadow-lg transition-all hover:from-orange-600 hover:to-orange-700 active:scale-[0.98] disabled:opacity-50"
          >
            {loading ? "Unlocking..." : "Unlock"}
          </button>
        </form>
      </div>
    </div>
  );
}
