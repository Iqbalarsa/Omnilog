"use client";

import React, { useState } from "react";
import Link from "next/link";
import {
  Layers,
  Sun,
  Moon,
  Settings,
  Palette,
  Check,
} from "lucide-react";
import { useTheme, ThemeColor } from "@/context/ThemeContext";
import SettingsModal from "./SettingsModal";

export default function Navbar() {
  const {
    themeMode,
    themeColor,
    customColor1,
    customColor2,
    customColor3,
    resolvedMode,
    setThemeMode,
    setThemeColor,
  } = useTheme();
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const palettes: { id: ThemeColor; name: string; dot: string }[] = [
    { id: "slate", name: "Apple Blue", dot: "#007AFF" },
    { id: "amber", name: "Warm Orange", dot: "#FF9F0A" },
    { id: "rose", name: "Coral Red", dot: "#EA4335" },
    { id: "custom1", name: "Custom 1", dot: customColor1 || "#5865F2" },
    { id: "custom2", name: "Custom 2", dot: customColor2 || "#34A853" },
    { id: "custom3", name: "Custom 3", dot: customColor3 || "#8B5CF6" },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 w-full apple-header-glass transition-colors">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
          {/* Brand Logo - Uses active Apple theme accent */}
          <Link
            href="/"
            className="flex items-center gap-2.5 group apple-press shrink-0"
          >
            <div className="w-7 h-7 rounded-lg bg-accent-theme text-white flex items-center justify-center shadow-xs transition-all group-hover:scale-105">
              <Layers className="w-3.5 h-3.5" />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-[15px] tracking-tight text-main">
                OmniLog
              </span>
              <span className="text-[10px] font-semibold tracking-wide px-1.5 py-0.2 rounded-full bg-accent-light-theme text-accent-tint border border-accent-border-theme">
                AI
              </span>
            </div>
          </Link>

          {/* Right Controls */}
          <div className="flex items-center gap-1">
            {/* Apple Color Palette Selector */}
            <div className="relative">
              <button
                onClick={() => setPaletteMenuOpen(!paletteMenuOpen)}
                className="p-2 rounded-full text-muted-theme hover:text-main hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors apple-press cursor-pointer flex items-center justify-center"
                title="Apple Accent Color (Blue, Yellow, Green, Red)"
              >
                <Palette className="w-4 h-4" />
              </button>

              {paletteMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-44 rounded-2xl bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-2xl border border-white/80 dark:border-white/[0.1] shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-1.5 z-50 animate-in fade-in zoom-in-95 duration-100"
                  onClick={() => setPaletteMenuOpen(false)}
                >
                  <div className="text-[10px] font-semibold text-muted-theme px-2.5 py-1 uppercase tracking-wider">
                    Apple Theme Color
                  </div>
                  {palettes.map((p) => (
                    <button
                      key={p.id}
                      onClick={() => setThemeColor(p.id)}
                      className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-xl text-xs font-medium transition-colors cursor-pointer ${
                        themeColor === p.id
                          ? "bg-accent-light-theme text-accent-tint font-semibold"
                          : "text-muted-theme hover:text-main hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                      }`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span
                          className="w-2.5 h-2.5 rounded-full shadow-2xs shrink-0"
                          style={{ backgroundColor: p.dot }}
                        />
                        <span className="truncate">{p.name}</span>
                      </div>
                      {themeColor === p.id && (
                        <Check className="w-3.5 h-3.5 text-accent-theme shrink-0" />
                      )}
                    </button>
                  ))}
                  <div className="h-px bg-subtle-theme my-1" />
                  <button
                    onClick={() => {
                      setPaletteMenuOpen(false);
                      setIsSettingsOpen(true);
                    }}
                    className="w-full flex items-center gap-2 px-2.5 py-1.5 rounded-xl text-[11px] text-muted-theme hover:text-main hover:bg-black/[0.03] dark:hover:bg-white/[0.05] transition-colors cursor-pointer"
                  >
                    <Settings className="w-3 h-3 text-accent-theme" />
                    <span>Customize Colors...</span>
                  </button>
                </div>
              )}
            </div>

            {/* Light / Dark Mode Toggle */}
            <button
              onClick={() => setThemeMode(resolvedMode === "dark" ? "light" : "dark")}
              className="p-2 rounded-full text-muted-theme hover:text-main hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors apple-press cursor-pointer flex items-center justify-center"
              title={`Switch to ${resolvedMode === "dark" ? "Light" : "Dark"} Mode`}
            >
              {resolvedMode === "dark" ? (
                <Sun className="w-4 h-4 text-accent-theme" />
              ) : (
                <Moon className="w-4 h-4 text-accent-theme" />
              )}
            </button>

            {/* Settings Modal Popup */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 rounded-full text-muted-theme hover:text-main hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors apple-press cursor-pointer flex items-center justify-center"
              title="Settings & Reminders"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
      />
    </>
  );
}
