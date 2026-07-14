import React from "react";
import { Sun, Moon } from "lucide-react";
import { useTheme } from "../context/ThemeContext";

/**
 * Reusable theme toggle button — drop anywhere in Admin, BD, or Client.
 * Shows Moon icon in dark mode, Sun icon in light mode.
 */
export default function ThemeToggle({ className = "" }) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light mode" : "Switch to dark mode"}
      title={isDark ? "Light Mode" : "Dark Mode"}
      className={`
        relative flex items-center justify-center
        w-9 h-9 rounded-xl
        transition-all duration-300
        focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
        ${className}
      `}
      style={{
        backgroundColor: "var(--btn-secondary-bg)",
        color: "var(--text-primary)",
        focusRingOffset: "var(--bg-primary)",
      }}
      onMouseEnter={(e) =>
        (e.currentTarget.style.backgroundColor =
          "var(--btn-secondary-hover)")
      }
      onMouseLeave={(e) =>
        (e.currentTarget.style.backgroundColor =
          "var(--btn-secondary-bg)")
      }
    >
      <div
        className="transition-transform duration-500"
        style={{
          transform: isDark ? "rotate(0deg)" : "rotate(360deg)",
        }}
      >
        {isDark ? (
          <Moon className="w-[18px] h-[18px]" />
        ) : (
          <Sun className="w-[18px] h-[18px]" />
        )}
      </div>
    </button>
  );
}
