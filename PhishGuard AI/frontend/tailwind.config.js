/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        cyber: {
          bg: "#080c14",
          card: "rgba(17, 24, 39, 0.7)",
          cardBorder: "rgba(255, 255, 255, 0.08)",
          primary: "#06b6d4",      // Cyan neon
          secondary: "#6366f1",    // Indigo glow
          accent: "#ec4899",       // Pink highlights
          success: "#10b981",      // Emerald safe
          warning: "#f59e0b",      // Amber alert
          danger: "#f43f5e",       // Rose critical
          textMuted: "#94a3b8",    // Slate text
        }
      },
      backgroundImage: {
        "cyber-grid": "linear-gradient(rgba(18, 24, 38, 0.95), rgba(18, 24, 38, 0.95)), radial-gradient(circle, rgba(6, 182, 212, 0.15) 1px, transparent 1px)",
      },
    },
  },
  plugins: [],
}
