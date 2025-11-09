import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./hooks/**/*.{ts,tsx}",
    "./fhevm/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}"
  ],
  theme: {
    extend: {
      colors: {
        iris: {
          50: "#f2f1fb",
          100: "#e2dcf8",
          200: "#c8bdf0",
          300: "#a693e4",
          400: "#8369d7",
          500: "#684dbe",
          600: "#503999",
          700: "#3b2b73",
          800: "#281d4d",
          900: "#1a1336"
        },
        blush: {
          50: "#fff1f5",
          100: "#ffd8e5",
          200: "#ffb2cc",
          300: "#ff8bb2",
          400: "#ff6599",
          500: "#f94981",
          600: "#d53068",
          700: "#a8224f",
          800: "#7c1839",
          900: "#571026"
        },
        fern: {
          50: "#eefdf4",
          100: "#d2f8e4",
          200: "#a6f1cc",
          300: "#75e4b0",
          400: "#48d294",
          500: "#2ab678",
          600: "#1e9360",
          700: "#18754d",
          800: "#105139",
          900: "#093428"
        },
        amber: {
          50: "#fff8eb",
          100: "#ffe8c2",
          200: "#ffd080",
          300: "#ffb73d",
          400: "#ffa000",
          500: "#e08600",
          600: "#b76600",
          700: "#8d4b00",
          800: "#633300",
          900: "#432200"
        },
        graphite: "#202533",
        smoke: "#535c6a",
        mist: "#f6f7fb",
        cloud: "#e5e8f0",
        porcelain: "#fdfcf8"
      },
      fontFamily: {
        heading: ["\"DM Sans\"", "Inter", "sans-serif"],
        body: ["\"Inter\"", "\"Noto Sans SC\"", "sans-serif"],
        sans: ["\"Inter\"", "\"Noto Sans SC\"", "sans-serif"]
      },
      boxShadow: {
        glow: "0 22px 55px rgba(104, 77, 190, 0.18)",
        "glow-lg": "0 28px 85px rgba(104, 77, 190, 0.22), 0 18px 40px rgba(42, 182, 120, 0.18)",
        halo: "0 0 32px rgba(104, 77, 190, 0.24)"
      },
      animation: {
        float: "float 4s ease-in-out infinite",
        "pulse-slow": "pulse 4s ease-in-out infinite",
        shimmer: "shimmer 6s linear infinite"
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-16px)" }
        },
        shimmer: {
          "0%": { backgroundPosition: "0% 50%" },
          "100%": { backgroundPosition: "200% 50%" }
        }
      }
    }
  },
  plugins: []
};

export default config;

