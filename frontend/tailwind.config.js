/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0A0A0A",
        slate: {
          950: "#0A0A0A",
          900: "#171717",
          800: "#1F1F1F",
          700: "#2A2A2A",
        },
        teal: {
          300: "#E4C569",
          400: "#D4AF37",
          500: "#C9982A",
        },
        gold: {
          300: "#E4C569",
          400: "#D4AF37",
          500: "#C9982A",
        },
        success: {
          500: "#16A34A",
        },
        amber: {
          400: "#FBBF24",
          500: "#F59E0B",
        },
        alarm: {
          500: "#EF4444",
          600: "#DC2626",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "ui-sans-serif", "system-ui"],
        body: ["'Inter'", "ui-sans-serif", "system-ui"],
        mono: ["'JetBrains Mono'", "ui-monospace", "SFMono-Regular"],
      },
      boxShadow: {
        glow: "0 0 0 1px rgba(212,175,55,0.18), 0 8px 30px -10px rgba(212,175,55,0.22)",
      },
      keyframes: {
        ringPulse: {
          "0%, 100%": { transform: "scale(1)", opacity: "1" },
          "50%": { transform: "scale(1.06)", opacity: "0.85" },
        },
      },
      animation: {
        ringPulse: "ringPulse 1.1s ease-in-out infinite",
      },
    },
  },
  plugins: [],
};
