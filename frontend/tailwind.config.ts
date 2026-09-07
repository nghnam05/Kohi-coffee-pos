import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "var(--font-manrope)", "'Inter'", "'Manrope'", "system-ui", "sans-serif"],
        heading: ["var(--font-inter)", "var(--font-manrope)", "'Inter'", "'Manrope'", "system-ui", "sans-serif"],
        pinyon: ["var(--font-pinyon)", "'Pinyon Script'", "cursive"],
        cormorant: ["var(--font-cormorant)", "'Cormorant Garamond'", "serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        bento: {
          bg: "#0B0F17",
          surface: "#0F172A",
          card: "rgba(15, 23, 42, 0.6)",
          border: "rgba(255, 255, 255, 0.08)",
          borderLight: "rgba(255, 255, 255, 0.12)",
          blue: "#3B82F6",
          blueHover: "#2563EB",
          amber: "#F59E0B",
          emerald: "#10B981",
          muted: "#94A3B8",
        },
        surface: {
          DEFAULT: '#f9f9ff',
          dim: '#d7dae4',
          bright: '#f9f9ff',
          lowest: '#ffffff',
          low: '#f1f3fe',
          container: '#ebedf8',
          high: '#e6e8f2',
          highest: '#e0e2ec',
        },
        primary: {
          DEFAULT: '#3B82F6',
          hover: '#2563EB',
          container: '#1D4ED8',
        },
        secondary: {
          DEFAULT: '#64748B',
          container: '#1E293B',
        },
        tertiary: {
          DEFAULT: '#F59E0B',
          container: '#B45309',
        },
      },
      borderRadius: {
        '2xl': '16px',
        'xl': '12px',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};
export default config;
