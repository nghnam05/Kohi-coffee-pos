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
        sans: ["var(--font-manrope)", "'Manrope'", "var(--font-inter)", "'Inter'", "system-ui", "sans-serif"],
        heading: ["var(--font-manrope)", "'Manrope'", "var(--font-inter)", "'Inter'", "system-ui", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
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
          DEFAULT: '#0059b9',
          hover: '#004591',
          container: '#0071e7',
        },
        secondary: {
          DEFAULT: '#445e8f',
          container: '#acc7fe',
        },
        tertiary: {
          DEFAULT: '#9b4000',
          container: '#c35200',
        },
      },
    },
  },
  plugins: [],
};
export default config;
