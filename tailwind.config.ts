import { nextui } from "@nextui-org/theme";
import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./node_modules/@nextui-org/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    nextui({
      themes: {
        light: {
          colors: {
            background: "#f7f8fb",
            foreground: "#172026",
            primary: {
              50: "#eefbf6",
              100: "#d4f5e8",
              200: "#aeead4",
              300: "#78d9b8",
              400: "#42c397",
              500: "#1aa878",
              600: "#108861",
              700: "#0e6d50",
              800: "#0e5742",
              900: "#0d4838",
              DEFAULT: "#1aa878",
              foreground: "#ffffff"
            },
            secondary: {
              DEFAULT: "#3457d5",
              foreground: "#ffffff"
            }
          }
        },
        dark: {
          colors: {
            background: "#0f172a",
            foreground: "#e5eef8",
            content1: "#111827",
            content2: "#172033",
            content3: "#243045",
            content4: "#334155",
            primary: {
              50: "#09251c",
              100: "#0b3b2c",
              200: "#0d513d",
              300: "#0f6a4e",
              400: "#148864",
              500: "#23b887",
              600: "#49cca0",
              700: "#7dddbb",
              800: "#b7eed8",
              900: "#e8fbf4",
              DEFAULT: "#23b887",
              foreground: "#061912"
            },
            secondary: {
              DEFAULT: "#8ea4ff",
              foreground: "#0b1020"
            }
          }
        }
      }
    }),
  ],
};

export default config;
