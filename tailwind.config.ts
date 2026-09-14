import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1220",
        royal: "#155EEF",
        electric: "#2F80ED",
        soft: "#F7F9FC",
        dark: "#101828",
        secondary: "#667085",
        success: "#12B76A",
        warning: "#F79009",
        error: "#F04438",
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;
