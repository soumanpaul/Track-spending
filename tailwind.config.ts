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
            background: "#edf4ff",
            foreground: "#16202f",
            content1: "rgba(255, 255, 255, 0.28)",
            content2: "rgba(255, 255, 255, 0.2)",
            content3: "rgba(255, 255, 255, 0.14)",
            content4: "rgba(226, 232, 240, 0.18)",
            primary: {
              50: "#ecfeff",
              100: "#cffafe",
              200: "#a5f3fc",
              300: "#67e8f9",
              400: "#22d3ee",
              500: "#06b6d4",
              600: "#0891b2",
              700: "#0e7490",
              800: "#155e75",
              900: "#164e63",
              DEFAULT: "#0891b2",
              foreground: "#ffffff"
            },
            secondary: {
              DEFAULT: "#7c3aed",
              foreground: "#ffffff"
            }
          }
        },
        dark: {
          colors: {
            background: "#07111f",
            foreground: "#eef6ff",
            content1: "rgba(255, 255, 255, 0.095)",
            content2: "rgba(255, 255, 255, 0.075)",
            content3: "rgba(255, 255, 255, 0.055)",
            content4: "rgba(255, 255, 255, 0.045)",
            primary: {
              50: "#083344",
              100: "#164e63",
              200: "#155e75",
              300: "#0e7490",
              400: "#0891b2",
              500: "#22d3ee",
              600: "#67e8f9",
              700: "#a5f3fc",
              800: "#cffafe",
              900: "#ecfeff",
              DEFAULT: "#22d3ee",
              foreground: "#04111d"
            },
            secondary: {
              DEFAULT: "#c4b5fd",
              foreground: "#160f2e"
            }
          }
        }
      }
    }),
  ],
};

export default config;
