import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./sections/**/*.{js,ts,jsx,tsx,mdx}"
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
        "accent-blue": "rgb(var(--accent-blue) / <alpha-value>)",
        text: "rgb(var(--text) / <alpha-value>)",
        muted: "rgb(var(--muted) / <alpha-value>)",
        outline: "rgb(var(--outline) / <alpha-value>)"
      },
      fontFamily: {
        headline: [
          "var(--font-headline)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ],
        body: [
          "var(--font-body)",
          "ui-sans-serif",
          "system-ui",
          "sans-serif"
        ]
      },
      boxShadow: {
        ambient: "0 24px 80px rgba(0, 0, 0, 0.28)",
        glow: "0 8px 24px rgba(233, 64, 87, 0.28)",
        "glow-red": "0 8px 24px rgba(233, 64, 87, 0.32)"
      },
      backgroundImage: {
        "hero-glow":
          "radial-gradient(circle at top, rgba(255,255,255,0.12), transparent 38%), radial-gradient(circle at 20% 80%, rgba(120,120,130,0.12), transparent 32%)",
        "cta-gradient":
          "linear-gradient(135deg, #fb6c23 0%, #e94057 50%, #8a2387 100%)",
        "hypd-gradient":
          "linear-gradient(20deg, #8a2387, #e94057, #f27121)",
        "card-gradient":
          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.02))"
      }
    }
  },
  plugins: []
};

export default config;
