/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0B1220",      // deep navy background
        slate: {
          850: "#16213A",
        },
        teal: {
          400: "#2DD4BF",
          500: "#14B8A6",
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
        glow: "0 0 0 1px rgba(45,212,191,0.15), 0 8px 30px -10px rgba(45,212,191,0.25)",
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
