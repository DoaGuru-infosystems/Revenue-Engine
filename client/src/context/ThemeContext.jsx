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
  const [forceLight, setForceLight] = useState(false);

  // Apply data-theme attribute on <html> whenever theme, forceDark, or forceLight changes
  useEffect(() => {
    const effectiveTheme = forceLight ? "light" : forceDark ? "dark" : theme;
    document.documentElement.setAttribute("data-theme", effectiveTheme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      // localStorage unavailable
    }
  }, [theme, forceDark, forceLight]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, toggleTheme, forceDark, setForceDark, forceLight, setForceLight }}>
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

/**
 * Hook to enforce light/paper theme on document pages (e.g. Public Proposal)
 * regardless of the global light/dark toggle, restoring user theme on unmount.
 */
export function useForceLight() {
  const ctx = useContext(ThemeContext);
  useEffect(() => {
    if (!ctx?.setForceLight) return;
    ctx.setForceLight(true);
    return () => {
      ctx.setForceLight(false);
    };
  }, [ctx]);
}

export default ThemeContext;
