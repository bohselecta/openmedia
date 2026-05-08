import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        bg: "#070708",
        panel: "#101113",
        "panel-elevated": "#16171a",
        line: "rgba(255,255,255,0.08)",
        "line-strong": "rgba(255,255,255,0.16)",
        ink: "#f4f1ea",
        "ink-muted": "rgba(244,241,234,0.62)",
        "ink-faint": "rgba(244,241,234,0.38)",
        accent: {
          lime: "#c8ff5f",
          cyan: "#7dd7ff",
          amber: "#f2b35d",
          rose: "#ff7a90",
          violet: "#a78bfa",
        },
        success: "#85f0a3",
        warning: "#ffd166",
        danger: "#ff5d73",
      },
      borderRadius: {
        xl: "1.25rem",
        "2xl": "1.5rem",
        "3xl": "1.75rem",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "sans-serif",
        ],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(255,255,255,0.06), 0 24px 80px rgba(0,0,0,0.55)",
      },
      ringOffsetColor: {
        bg: "#070708",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
