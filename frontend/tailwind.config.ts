/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
    "./store/**/*.{js,ts,jsx,tsx,mdx}",
    "./hooks/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#eef9ff",
          100: "#d8f0ff",
          200: "#b9e6ff",
          300: "#89d8ff",
          400: "#52c1ff",
          500: "#29a3ff",
          600: "#0e84f5",
          700: "#076de1",
          800: "#0c57b6",
          900: "#104a8f",
          950: "#0d2e5a",
        },
        surface: {
          50:  "#f0f4ff",
          100: "#e4e9f7",
          800: "#111827",
          850: "#0d1424",
          900: "#080f1e",
          950: "#050a14",
        },
        up:   "#22c55e",
        down: "#ef4444",
      },
      fontFamily: {
        sans: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      backgroundImage: {
        "glass": "linear-gradient(135deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)",
        "glow-green": "radial-gradient(circle, rgba(34,197,94,0.15) 0%, transparent 70%)",
        "glow-red":   "radial-gradient(circle, rgba(239,68,68,0.15) 0%, transparent 70%)",
        "glow-blue":  "radial-gradient(circle, rgba(41,163,255,0.2) 0%, transparent 70%)",
      },
      animation: {
        "ticker": "ticker 40s linear infinite",
        "pulse-green": "pulse-green 2s ease-in-out infinite",
        "fade-in": "fadeIn 0.3s ease-in-out",
        "slide-up": "slideUp 0.3s ease-out",
        "glow": "glow 2s ease-in-out infinite alternate",
        "flash-green": "flashGreen 0.5s ease-out",
        "flash-red": "flashRed 0.5s ease-out",
      },
      keyframes: {
        ticker: {
          "0%":   { transform: "translateX(0)" },
          "100%": { transform: "translateX(-50%)" },
        },
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(8px)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        glow: {
          "0%":   { boxShadow: "0 0 5px rgba(41,163,255,0.3)" },
          "100%": { boxShadow: "0 0 20px rgba(41,163,255,0.7), 0 0 40px rgba(41,163,255,0.3)" },
        },
        flashGreen: {
          "0%":   { backgroundColor: "rgba(34,197,94,0.3)" },
          "100%": { backgroundColor: "transparent" },
        },
        flashRed: {
          "0%":   { backgroundColor: "rgba(239,68,68,0.3)" },
          "100%": { backgroundColor: "transparent" },
        },
      },
    },
  },
  plugins: [],
};
