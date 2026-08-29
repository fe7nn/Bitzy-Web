import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#050811",
        surface: {
          50: "#0b1120",
          100: "#0f172a",
          200: "#1e293b",
          300: "#334155",
          glass: "rgba(15, 23, 42, 0.75)",
          card: "rgba(11, 17, 32, 0.85)",
        },
        brand: {
          blue: "#2563eb",
          "blue-hover": "#1d4ed8",
          "blue-light": "#3b82f6",
          "blue-glow": "#60a5fa",
          orange: "#f97316",
          "orange-light": "#fb923c",
        },
        accent: {
          cyan: "#06b6d4",
          emerald: "#10b981",
          rose: "#f43f5e",
          amber: "#f59e0b",
          purple: "#a855f7",
        }
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      boxShadow: {
        'glow-blue': '0 0 25px -5px rgba(37, 99, 235, 0.35)',
        'glow-blue-lg': '0 0 45px -10px rgba(59, 130, 246, 0.45)',
        'glow-orange': '0 0 20px -5px rgba(249, 115, 22, 0.35)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-8px)' },
        }
      }
    },
  },
  plugins: [],
};
export default config;
