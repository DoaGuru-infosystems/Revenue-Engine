import React, { createContext, useContext, useEffect, useState } from "react";

const ThemeContext = createContext();

const STORAGE_KEY = "app-theme";

export function ThemeProvider({ children }) {
  // Default theme = dark (current look preserved)
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(STORAGE_KEY) || "dark";
    } catch {
      return "dark";
    }
  });

  const [forceDark, setForceDark] = useState(false);

  // Apply data-theme attribute on <html> whenever theme or forceDark changes
  useEffect(() => {
    const effectiveTheme = forceDark ? "dark" : theme;
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme, forceDark]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, forceDark, setForceDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within a ThemeProvider");
  return ctx;
}

/**
 * Hook to enforce dark theme on specific pages (e.g. Proforma, Balance Proforma, Invoice, Instant Proforma)
 * regardless of the global light/dark toggle, restoring user theme on unmount.
 */
export function useForceDark() {
  const ctx = useContext(ThemeContext);
  useEffect(() => {
    if (!ctx?.setForceDark) return;
    ctx.setForceDark(true);
    return () => {
      ctx.setForceDark(false);
    };
  }, [ctx]);
}

export default ThemeContext;
