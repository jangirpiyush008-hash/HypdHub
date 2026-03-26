import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        surface: "rgb(var(--surface) / <alpha-value>)",
        "surface-low": "rgb(var(--surface-low) / <alpha-value>)",
        "surface-card": "rgb(var(--surface-card) / <alpha-value>)",
        "surface-high": "rgb(var(--surface-high) / <alpha-value>)",
        "surface-top": "rgb(var(--surface-top) / <alpha-value>)",
        "surface-bright": "rgb(var(--surface-bright) / <alpha-value>)",
        primary: "rgb(var(--primary) / <alpha-value>)",
        "primary-deep": "rgb(var(--primary-deep) / <alpha-value>)",
        secondary: "rgb(var(--secondary) / <alpha-value>)",
        tertiary: "rgb(var(--tertiary) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        outline: "rgb(var(--outline) / <alpha-value>)"
      },
      fontFamily: {
        headline: [
          "\"Plus Jakarta Sans\"",
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        body: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        ambient: "0 18px 42px rgba(85, 37, 89, 0.10)",
        glow: "0 0 24px rgba(255,171,243,0.22)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top right, rgba(255,171,243,0.16), transparent 32%), radial-gradient(circle at bottom left, rgba(138,35,135,0.18), transparent 26%)",
        "cta-gradient":
          "linear-gradient(135deg, #ffabf3 0%, #d459c7 45%, #8a2387 100%)"
      }
    }
  },
  plugins: []
};

export default config;
