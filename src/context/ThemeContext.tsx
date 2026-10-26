"use client";

import React, { createContext, useContext, useEffect, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
export type ThemeColor = "slate" | "amber" | "rose" | "custom1" | "custom2" | "custom3";

interface ThemeContextType {
  themeMode: ThemeMode;
  themeColor: ThemeColor;
  customColor1: string;
  customColor2: string;
  customColor3: string;
  resolvedMode: "light" | "dark";
  setThemeMode: (mode: ThemeMode) => void;
  setThemeColor: (color: ThemeColor) => void;
  setCustomColor1: (hex: string) => void;
  setCustomColor2: (hex: string) => void;
  setCustomColor3: (hex: string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  themeMode: "system",
  themeColor: "slate",
  customColor1: "#5865F2",
  customColor2: "#34A853",
  customColor3: "#8B5CF6",
  resolvedMode: "light",
  setThemeMode: () => {},
  setThemeColor: () => {},
  setCustomColor1: () => {},
  setCustomColor2: () => {},
  setCustomColor3: () => {},
});

function hexToRgba(hex: string, alpha: number): string {
  let c = hex.replace("#", "").trim();
  if (c.length === 3) {
    c = c.split("").map((x) => x + x).join("");
  }
  const num = parseInt(c, 16);
  if (isNaN(num) || c.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function normalizeHex(hex: string): string {
  let formatted = hex.trim();
  if (!formatted.startsWith("#") && formatted.length > 0) {
    formatted = `#${formatted}`;
  }
  return formatted;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [themeColor, setThemeColorState] = useState<ThemeColor>("slate");
  const [customColor1, setCustomColor1State] = useState<string>("#5865F2");
  const [customColor2, setCustomColor2State] = useState<string>("#34A853");
  const [customColor3, setCustomColor3State] = useState<string>("#8B5CF6");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");
  const [mounted, setMounted] = useState(false);

  // Initial load from localStorage and API
  useEffect(() => {
    setMounted(true);
    const savedMode = (localStorage.getItem("omnilog-theme-mode") ||
      localStorage.getItem("readlog-theme-mode")) as ThemeMode | null;
    let savedColor = (localStorage.getItem("omnilog-theme-color") ||
      localStorage.getItem("readlog-theme-color")) as string | null;

    // Migrate legacy theme names if present
    if (savedColor === "indigo") savedColor = "custom1";
    if (savedColor === "sage") savedColor = "custom2";
    if (savedColor === "custom") savedColor = "custom3";

    const savedC1 = localStorage.getItem("omnilog-custom-color-1");
    const savedC2 = localStorage.getItem("omnilog-custom-color-2");
    const savedC3 = localStorage.getItem("omnilog-custom-color-3") || localStorage.getItem("omnilog-custom-color");

    if (savedMode) setThemeModeState(savedMode);
    if (savedColor) setThemeColorState(savedColor as ThemeColor);
    if (savedC1) setCustomColor1State(savedC1);
    if (savedC2) setCustomColor2State(savedC2);
    if (savedC3) setCustomColor3State(savedC3);

    fetch("/api/preferences")
      .then((res) => res.json())
      .then((data) => {
        if (data) {
          if (data.themeMode && !savedMode) setThemeModeState(data.themeMode);
          if (data.themeColor && !savedColor) {
            let tc = data.themeColor;
            if (tc === "indigo") tc = "custom1";
            if (tc === "sage") tc = "custom2";
            if (tc === "custom") tc = "custom3";
            setThemeColorState(tc as ThemeColor);
          }
          if (data.customColor1 && !savedC1) setCustomColor1State(data.customColor1);
          if (data.customColor2 && !savedC2) setCustomColor2State(data.customColor2);
          if (data.customColor3 && !savedC3) setCustomColor3State(data.customColor3);
        }
      })
      .catch((e) => console.error("Error loading theme preference:", e));
  }, []);

  // Compute resolved mode (light or dark)
  useEffect(() => {
    if (!mounted) return;

    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolved = () => {
      if (themeMode === "system") {
        setResolvedMode(mediaQuery.matches ? "dark" : "light");
      } else {
        setResolvedMode(themeMode);
      }
    };

    updateResolved();
    mediaQuery.addEventListener("change", updateResolved);
    return () => mediaQuery.removeEventListener("change", updateResolved);
  }, [themeMode, mounted]);

  // Apply classes and CSS variables to root HTML element
  useEffect(() => {
    if (!mounted) return;

    const root = document.documentElement;

    // Apply dark class
    if (resolvedMode === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    // Apply color theme class
    root.classList.remove(
      "theme-amber",
      "theme-slate",
      "theme-rose",
      "theme-custom"
    );

    const isDark = resolvedMode === "dark";

    if (themeColor === "custom1") {
      root.classList.add("theme-custom");
      root.setAttribute("data-palette", "custom1");
      const hex = customColor1 || "#5865F2";
      root.style.setProperty("--accent", hex);
      root.style.setProperty("--accent-hover", hex);
      root.style.setProperty("--accent-light", hexToRgba(hex, isDark ? 0.20 : 0.14));
      root.style.setProperty("--accent-border", hexToRgba(hex, isDark ? 0.38 : 0.30));
      root.style.setProperty("--accent-glow", hexToRgba(hex, 0.25));
      root.style.setProperty("--accent-text", hex);
    } else if (themeColor === "custom2") {
      root.classList.add("theme-custom");
      root.setAttribute("data-palette", "custom2");
      const hex = customColor2 || "#34A853";
      root.style.setProperty("--accent", hex);
      root.style.setProperty("--accent-hover", hex);
      root.style.setProperty("--accent-light", hexToRgba(hex, isDark ? 0.20 : 0.14));
      root.style.setProperty("--accent-border", hexToRgba(hex, isDark ? 0.38 : 0.30));
      root.style.setProperty("--accent-glow", hexToRgba(hex, 0.25));
      root.style.setProperty("--accent-text", hex);
    } else if (themeColor === "custom3") {
      root.classList.add("theme-custom");
      root.setAttribute("data-palette", "custom3");
      const hex = customColor3 || "#8B5CF6";
      root.style.setProperty("--accent", hex);
      root.style.setProperty("--accent-hover", hex);
      root.style.setProperty("--accent-light", hexToRgba(hex, isDark ? 0.20 : 0.14));
      root.style.setProperty("--accent-border", hexToRgba(hex, isDark ? 0.38 : 0.30));
      root.style.setProperty("--accent-glow", hexToRgba(hex, 0.25));
      root.style.setProperty("--accent-text", hex);
    } else {
      // 3 Built-in Themes: slate (Apple Blue), amber (Warm Orange), rose (Coral Red)
      root.classList.add(`theme-${themeColor}`);
      root.setAttribute("data-palette", themeColor);
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-hover");
      root.style.removeProperty("--accent-light");
      root.style.removeProperty("--accent-border");
      root.style.removeProperty("--accent-glow");
      root.style.removeProperty("--accent-text");
    }

    root.setAttribute("data-mode", resolvedMode);
  }, [resolvedMode, themeColor, customColor1, customColor2, customColor3, mounted]);

  const setThemeMode = (mode: ThemeMode) => {
    setThemeModeState(mode);
    localStorage.setItem("omnilog-theme-mode", mode);
    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeMode: mode }),
    }).catch(() => {});
  };

  const setThemeColor = (color: ThemeColor) => {
    setThemeColorState(color);
    localStorage.setItem("omnilog-theme-color", color);
    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ themeColor: color }),
    }).catch(() => {});
  };

  const setCustomColor1 = (hex: string) => {
    const formatted = normalizeHex(hex);
    setCustomColor1State(formatted);
    localStorage.setItem("omnilog-custom-color-1", formatted);
    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customColor1: formatted }),
    }).catch(() => {});
  };

  const setCustomColor2 = (hex: string) => {
    const formatted = normalizeHex(hex);
    setCustomColor2State(formatted);
    localStorage.setItem("omnilog-custom-color-2", formatted);
    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customColor2: formatted }),
    }).catch(() => {});
  };

  const setCustomColor3 = (hex: string) => {
    const formatted = normalizeHex(hex);
    setCustomColor3State(formatted);
    localStorage.setItem("omnilog-custom-color-3", formatted);
    fetch("/api/preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ customColor3: formatted }),
    }).catch(() => {});
  };

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        themeColor,
        customColor1,
        customColor2,
        customColor3,
        resolvedMode,
        setThemeMode,
        setThemeColor,
        setCustomColor1,
        setCustomColor2,
        setCustomColor3,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
