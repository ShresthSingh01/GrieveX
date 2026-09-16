import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-geist)", "system-ui", "-apple-system", "sans-serif"],
        mono: ["var(--font-geist-mono)", "JetBrains Mono", "Fira Code", "monospace"],
      },
      colors: {
        bg: {
          base:     "#09090b", // Zinc 950
          surface:  "#18181b", // Zinc 900
          elevated: "#27272a", // Zinc 800
          overlay:  "#3f3f46", // Zinc 700
        },
        accent: {
          DEFAULT: "#10b981",  // Emerald 500
          muted:   "#065f46",  // Emerald 900
          hover:   "#34d399",  // Emerald 400
        },
      },
      boxShadow: {
        subtle:   "0 1px 2px 0 rgba(0, 0, 0, 0.4)",
        card:     "0 4px 12px -2px rgba(0, 0, 0, 0.45)",
        elevated: "0 12px 28px -4px rgba(0, 0, 0, 0.6)",
      },
      animation: {
        "slide-in": "slide-in 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-up":  "fade-up 0.25s cubic-bezier(0.16, 1, 0.3, 1) both",
        "breathe":  "breathe 3s ease-in-out infinite",
      },
      keyframes: {
        "slide-in": {
          from: { transform: "translateX(calc(100% + 20px))", opacity: "0" },
          to:   { transform: "translateX(0)", opacity: "1" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(8px)" },
          to:   { opacity: "1", transform: "translateY(0)" },
        },
        "breathe": {
          "0%, 100%": { opacity: "1" },
          "50%":      { opacity: "0.45" },
        },
      },
      transitionTimingFunction: {
        premium: "cubic-bezier(0.16, 1, 0.3, 1)",
      },
    },
  },
  plugins: [],
};

export default config;
