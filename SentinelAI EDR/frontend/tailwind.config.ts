import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#080b11", // Deep cyber slate black
        panel: "rgba(16, 22, 35, 0.65)", // Glassmorphic card fill
        cyberBlue: "#00d8ff",
        cyberPurple: "#a855f7",
        cyberGreen: "#10b981",
        cyberRed: "#ef4444",
        cyberOrange: "#f97316",
        cyberSlate: "#1e293b",
        border: "rgba(255, 255, 255, 0.08)",
      },
      backdropBlur: {
        xs: "2px",
      },
    },
  },
  plugins: [],
};
export default config;
