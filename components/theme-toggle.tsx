"use client";

import { useEffect, useState } from "react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"light" | "dark">("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("hypd-theme");
    const nextTheme = stored === "dark" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    setTheme(nextTheme);
  }, []);

  function toggleTheme() {
    const nextTheme = theme === "light" ? "dark" : "light";
    document.documentElement.setAttribute("data-theme", nextTheme);
    window.localStorage.setItem("hypd-theme", nextTheme);
    setTheme(nextTheme);
  }

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="rounded-xl bg-surface-top px-3 py-2 font-headline text-xs font-bold uppercase tracking-[0.22em] text-text transition-colors hover:bg-surface-bright"
    >
      {theme === "light" ? "Dark" : "Light"} mode
    </button>
  );
}
