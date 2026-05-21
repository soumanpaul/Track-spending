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
        }
      }
    }),
  ],
};

export default config;
