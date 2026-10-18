import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        agri: {
          50: "#f0f9f1",
          100: "#dcf2e0",
          200: "#bbe4c4",
          300: "#8ecc9d",
          400: "#5bac72",
          500: "#36904f",
          600: "#27733d",
          700: "#215c32",
          800: "#1d492a",
          900: "#193d24",
          950: "#0c2113",
        },
        earth: {
          50: "#fbf8f5",
          100: "#f5eee7",
          200: "#ebdcd0",
          300: "#ddc4b0",
          400: "#cba58d",
          500: "#bc8a6f",
          600: "#ad765d",
          700: "#905e4c",
          800: "#754e41",
          900: "#604137",
        },
      },
      fontFamily: {
        sans: [
          "system-ui",
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "'Noto Sans Devanagari'",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
};
export default config;
