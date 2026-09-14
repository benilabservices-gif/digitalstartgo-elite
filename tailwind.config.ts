import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#150F1A",
        paper: "#F3F1ED",
        ochre: "#C9A24B",
        amber: "#A6822E",
        dark: "#1D1720",
        secondary: "#726C78",
        success: "#4B6B3C",
        warning: "#96591A",
        error: "#B23A2E",
      },
      fontFamily: {
        sans: ["var(--font-plex)", "system-ui", "sans-serif"],
        heading: ["var(--font-fraunces)", "Georgia", "serif"],
      },
      keyframes: {
        "draw-line": {
          "0%": { transform: "scaleX(0)", opacity: "0" },
          "100%": { transform: "scaleX(1)", opacity: "1" },
        },
        "rise-in": {
          "0%": { transform: "translateY(14px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
      },
      animation: {
        "draw-line": "draw-line 900ms cubic-bezier(0.16,1,0.3,1) forwards",
        "rise-in": "rise-in 700ms cubic-bezier(0.16,1,0.3,1) forwards",
      },
    },
  },
  plugins: [],
};
export default config;
