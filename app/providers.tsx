"use client";

import { NextUIProvider } from "@nextui-org/react";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type ThemeMode = "light" | "dark";

type ThemeContextValue = {
  theme: ThemeMode;
  toggleTheme: () => void;
};

const themeStorageKey = "expense-desk-theme";
const ThemeContext = createContext<ThemeContextValue | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeMode>("dark");
  const [hasLoadedTheme, setHasLoadedTheme] = useState(false);

  useEffect(() => {
    const savedTheme = window.localStorage.getItem(themeStorageKey);
    const initialTheme = savedTheme === "dark" || savedTheme === "light" ? savedTheme : "dark";
    setTheme(initialTheme);
    setHasLoadedTheme(true);
  }, []);

  useEffect(() => {
    if (!hasLoadedTheme) return;

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(themeStorageKey, theme);
  }, [hasLoadedTheme, theme]);

  const value = useMemo(
    () => ({
      theme,
      toggleTheme: () => setTheme((current) => (current === "dark" ? "light" : "dark")),
    }),
    [theme],
  );

  return (
    <ThemeContext.Provider value={value}>
      <NextUIProvider>{children}</NextUIProvider>
    </ThemeContext.Provider>
  );
}

export function useThemeMode() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useThemeMode must be used inside Providers.");
  }
  return context;
}
