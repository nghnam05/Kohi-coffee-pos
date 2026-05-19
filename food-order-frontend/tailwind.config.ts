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
        sans: ["var(--font-inter)", "sans-serif"],
        roboto: ["var(--font-roboto)", "sans-serif"],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        orange: {
          50: '#FFFDF9',
          100: '#FFEFE6',
          200: '#FFD3B8',
          300: '#FFA170',
          400: '#FF7330',
          500: '#E04D01', // Pho & Beyond Signature Culinary Vermilion
          600: '#C73E00',
          700: '#A33000',
          800: '#802200',
          900: '#5C1400',
          950: '#3D0A00',
          650: '#C73E00',
          655: '#A33000',
        },
        slate: {
          50: '#FCFBF9', // Warm Ivory background
          100: '#F5F2EB', // Soft Warm Linen
          150: '#EDE9DE',
          200: '#E6E0D3', // Linen Border
          300: '#D2C8B8',
          350: '#C2B6A2',
          400: '#AFA08A',
          450: '#9B8C76',
          500: '#857560',
          550: '#756550',
          600: '#665743',
          700: '#524535',
          800: '#3E3427', // Espresso Black / Rich text
          900: '#2A2219',
          950: '#15100B',
        },
        gray: {
          50: '#FCFBF9',
          100: '#F5F2EB',
          150: '#EDE9DE',
          200: '#E6E0D3',
          300: '#D2C8B8',
          400: '#AFA08A',
          500: '#857560',
          600: '#665743',
          700: '#524535',
          800: '#3E3427',
          900: '#2A2219',
          950: '#15100B',
        },
        zinc: {
          50: '#FCFBF9',
          100: '#F5F2EB',
          200: '#E6E0D3',
          300: '#D2C8B8',
          400: '#AFA08A',
          500: '#857560',
          600: '#665743',
          700: '#463D34',   // Cozy Warm Cocoa border / divider
          750: '#393129',
          800: '#211C18',   // Lighter dark card background
          850: '#171310',
          900: '#100D0B',   // Dark navbar / popover background
          950: '#0A0807',   // Main screen background (luxurious dark coffee obsidian)
        }
      },
    },
  },
  plugins: [],
};
export default config;
