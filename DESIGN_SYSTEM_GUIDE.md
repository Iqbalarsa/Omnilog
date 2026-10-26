# Apple Liquid Glass Design System — Implementation Guide for AI Agents

> **Cara Penggunaan**: Berikan isi file ini langsung ke AI Agent (Antigravity, Cursor, Claude Code, Windsurf, ChatGPT) saat kamu ingin mengaplikasikan desain Apple-inspired ini ke aplikasi web lain.
> Teks prompt instruksi siap pakai ada di bagian **[Prompt untuk Agent]** di bawah.

---

## 📋 Prompt untuk Agent (Copy & Paste ke Chat Agent Lain)

```markdown
Role: Senior UI/UX Designer & Lead Frontend Engineer.
Task: Terapkan sistem desain "Apple Liquid Glass & Adaptive Accent Theme" ke dalam aplikasi ini.

Ikuti panduan desain berikut dengan ketat:
1. Filosofi Estetika: Apple Sonoma/Sequoia & visionOS liquid glassmorphism (frosted glass, specular highlights, border halus 1px, sudut membulat rounded-2xl, dan micro-shadows).
2. Tata Letak (Grid Layout): Gunakan container simetris `max-w-6xl mx-auto px-4 sm:px-6`. Header dan kartu di bawahnya harus sejajar secara vertikal:
   - Sisi kiri header (logo) sejajar dengan sisi kiri kartu kolom kiri.
   - Sisi kanan header (tombol tema & settings) sejajar dengan sisi kanan kartu kolom kanan.
3. Palet Tema & Custom Hex:
   - 3 Tema Bawaan: Apple Blue (#007AFF), Warm Orange (#FF9F0A), Coral Red (#EA4335).
   - 3 Tema Kustom: Custom 1 (#5865F2), Custom 2 (#34A853), Custom 3 (#8B5CF6) yang bisa diketik langsung nilai hex-nya oleh user di modal settings.
   - Mode Terang (Light) dan Gelap (Dark) yang konsisten dengan transisi CSS halus.
4. Micro-Interactions: Tombol dan kartu interaktif wajib memiliki efek tekan `apple-press` (active scale 0.98) dan hover transisi yang halus.
5. Referensi Kode Lengkap: Terapkan kode CSS tokens (`globals.css`), Theme Context (`ThemeContext.tsx`), serta layout simetris seperti yang dijelaskan di dalam spesifikasi teknis di bawah.
```

---

## 🎨 1. Design Tokens & Core Aesthetics

### A. Palet Warna (Theme Accents)
- **Built-in Apple Accents**:
  - `slate`: Apple Blue (`#007AFF`)
  - `amber`: Warm Orange (`#FF9F0A`)
  - `rose`: Coral Red (`#EA4335`)
- **Customizable User Accents**:
  - `custom1`: Custom 1 (default: `#5865F2` / Blurple)
  - `custom2`: Custom 2 (default: `#34A853` / Emerald)
  - `custom3`: Custom 3 (default: `#8B5CF6` / Violet)

### B. Warna Surface & Kanvas
| Token | Light Mode | Dark Mode | Fungsi |
|---|---|---|---|
| `--bg-page` | `#f5f5f7` (Mac canvas) | `#000000` (OLED Pure Black) | Latar belakang seluruh halaman |
| `--bg-surface` | `#ffffff` | `#1c1c1e` (Apple Dark Slate) | Kartu default |
| `--bg-surface-elevated`| `#ffffff` | `#2c2c2e` | Modal, tooltip, dropdown |
| `--bg-surface-subtle` | `#eeeff3` | `#141416` | Background input / tag |
| `--border-color` | `rgba(0, 0, 0, 0.07)` | `rgba(255, 255, 255, 0.10)` | Border kartu standar |
| `--border-subtle` | `rgba(0, 0, 0, 0.04)` | `rgba(255, 255, 255, 0.06)` | Divider / garis pembatas |
| `--text-main` | `#1d1d1f` | `#f5f5f7` | Teks judul & isi utama |
| `--text-muted` | `#6e6e73` | `#98989d` | Keterangan / subteks |
| `--text-faint` | `#86868b` | `#636366` | Placeholder / label kecil |

---

## 🛠️ 2. CSS Masterfile (`globals.css`)

Tambahkan CSS ini ke dalam file CSS utama proyek (misal `src/app/globals.css`):

```css
@import "tailwindcss";

@custom-variant dark (&:where(.dark, .dark *));

:root {
  /* Canvas Light */
  --bg-page: #f5f5f7;
  --bg-surface: #ffffff;
  --bg-surface-elevated: #ffffff;
  --bg-surface-subtle: #eeeff3;
  --border-color: rgba(0, 0, 0, 0.07);
  --border-subtle: rgba(0, 0, 0, 0.04);
  --text-main: #1d1d1f;
  --text-muted: #6e6e73;
  --text-faint: #86868b;

  /* Default Accent: Apple Blue */
  --accent: #007AFF;
  --accent-hover: #0066D6;
  --accent-light: rgba(0, 122, 255, 0.12);
  --accent-border: rgba(0, 122, 255, 0.28);
  --accent-glow: rgba(0, 122, 255, 0.25);
  --accent-text: #0062cc;
}

/* Built-in Palettes (Light) */
:root.theme-slate, :root[data-palette="slate"] {
  --accent: #007AFF;
  --accent-hover: #0066D6;
  --accent-light: rgba(0, 122, 255, 0.12);
  --accent-border: rgba(0, 122, 255, 0.28);
  --accent-glow: rgba(0, 122, 255, 0.25);
  --accent-text: #0062cc;
}

:root.theme-amber, :root[data-palette="amber"] {
  --accent: #FF9F0A;
  --accent-hover: #E08B00;
  --accent-light: rgba(255, 159, 10, 0.14);
  --accent-border: rgba(255, 159, 10, 0.32);
  --accent-glow: rgba(255, 159, 10, 0.25);
  --accent-text: #B26A00;
}

:root.theme-rose, :root[data-palette="rose"] {
  --accent: #EA4335;
  --accent-hover: #D13527;
  --accent-light: rgba(234, 67, 53, 0.13);
  --accent-border: rgba(234, 67, 53, 0.28);
  --accent-glow: rgba(234, 67, 53, 0.22);
  --accent-text: #B3261E;
}

/* Dark Mode Tokens */
:root.dark {
  --bg-page: #000000;
  --bg-surface: #1c1c1e;
  --bg-surface-elevated: #2c2c2e;
  --bg-surface-subtle: #141416;
  --border-color: rgba(255, 255, 255, 0.10);
  --border-subtle: rgba(255, 255, 255, 0.06);
  --text-main: #f5f5f7;
  --text-muted: #98989d;
  --text-faint: #636366;

  --accent: #0A84FF;
  --accent-hover: #409CFF;
  --accent-light: rgba(10, 132, 255, 0.18);
  --accent-border: rgba(10, 132, 255, 0.35);
  --accent-glow: rgba(10, 132, 255, 0.25);
  --accent-text: #64D2FF;
}

:root.dark.theme-slate, :root.dark[data-palette="slate"] {
  --accent: #0A84FF;
  --accent-hover: #409CFF;
  --accent-light: rgba(10, 132, 255, 0.18);
  --accent-border: rgba(10, 132, 255, 0.35);
  --accent-glow: rgba(10, 132, 255, 0.25);
  --accent-text: #64D2FF;
}

:root.dark.theme-amber, :root.dark[data-palette="amber"] {
  --accent: #FF9F0A;
  --accent-hover: #FFB340;
  --accent-light: rgba(255, 159, 10, 0.20);
  --accent-border: rgba(255, 159, 10, 0.38);
  --accent-glow: rgba(255, 159, 10, 0.25);
  --accent-text: #FFB340;
}

:root.dark.theme-rose, :root.dark[data-palette="rose"] {
  --accent: #EA4335;
  --accent-hover: #F25C4F;
  --accent-light: rgba(234, 67, 53, 0.18);
  --accent-border: rgba(234, 67, 53, 0.35);
  --accent-glow: rgba(234, 67, 53, 0.25);
  --accent-text: #FFA49B;
}

/* Base Body with Subtle Ambient Mesh Glow */
body {
  background-color: var(--bg-page);
  color: var(--text-main);
  transition: background-color 0.25s cubic-bezier(0.16, 1, 0.3, 1), color 0.25s ease;
  -webkit-font-smoothing: antialiased;
  background-image: 
    radial-gradient(at 0% 0%, var(--accent-light) 0px, transparent 45%),
    radial-gradient(at 100% 12%, color-mix(in srgb, var(--accent) 8%, transparent) 0px, transparent 42%),
    radial-gradient(at 90% 95%, var(--accent-light) 0px, transparent 42%);
  background-attachment: fixed;
}

/* Utilities */
.bg-page { background-color: var(--bg-page); }
.bg-surface { background-color: var(--bg-surface); }
.bg-surface-elevated { background-color: var(--bg-surface-elevated); }
.bg-surface-subtle { background-color: var(--bg-surface-subtle); }
.border-theme { border-color: var(--border-color); }
.border-subtle-theme { border-color: var(--border-subtle); }
.text-main { color: var(--text-main); }
.text-muted-theme { color: var(--text-muted); }
.text-faint-theme { color: var(--text-faint); }

.bg-accent-theme { background-color: var(--accent); }
.bg-accent-hover-theme:hover { background-color: var(--accent-hover); }
.bg-accent-light-theme { background-color: var(--accent-light); }
.border-accent-theme { border-color: var(--accent); }
.border-accent-border-theme { border-color: var(--accent-border); }
.text-accent-theme { color: var(--accent); }
.text-accent-tint { color: var(--accent-text); }

/* 🌟 Apple Liquid Glass Card */
.apple-card {
  background: rgba(255, 255, 255, 0.68);
  backdrop-filter: blur(28px) saturate(210%);
  -webkit-backdrop-filter: blur(28px) saturate(210%);
  border: 1px solid rgba(255, 255, 255, 0.85);
  border-radius: 1.25rem;
  box-shadow: 
    0 1px 3px 0 rgba(0, 0, 0, 0.02),
    0 10px 32px -4px rgba(0, 0, 0, 0.05),
    inset 0 1.5px 1px 0 rgba(255, 255, 255, 1);
  transition: all 0.22s cubic-bezier(0.16, 1, 0.3, 1);
}

:root.dark .apple-card {
  background: rgba(28, 28, 30, 0.72);
  backdrop-filter: blur(24px) saturate(190%);
  -webkit-backdrop-filter: blur(24px) saturate(190%);
  border: 1px solid rgba(255, 255, 255, 0.10);
  box-shadow: 
    0 2px 8px rgba(0, 0, 0, 0.3),
    0 12px 36px -4px rgba(0, 0, 0, 0.45),
    inset 0 1px 1px 0 rgba(255, 255, 255, 0.12);
}

.apple-card:hover {
  background: rgba(255, 255, 255, 0.80);
  box-shadow: 
    0 2px 4px 0 rgba(0, 0, 0, 0.04),
    0 18px 42px -6px rgba(0, 0, 0, 0.08),
    inset 0 1.5px 1px 0 rgba(255, 255, 255, 1);
}

:root.dark .apple-card:hover {
  background: rgba(36, 36, 40, 0.82);
  box-shadow: 
    0 6px 16px rgba(0, 0, 0, 0.4),
    0 20px 48px -4px rgba(0, 0, 0, 0.6),
    inset 0 1px 1.5px 0 rgba(255, 255, 255, 0.18);
}

/* 🌟 Apple Frosted Header */
.apple-header-glass {
  background: color-mix(in srgb, var(--accent) 6%, rgba(255, 255, 255, 0.75));
  backdrop-filter: blur(28px) saturate(210%);
  -webkit-backdrop-filter: blur(28px) saturate(210%);
  border-bottom: 1px solid rgba(255, 255, 255, 0.85);
  box-shadow: 
    0 1px 3px rgba(0, 0, 0, 0.02),
    0 8px 24px -6px var(--accent-light);
  transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
}

:root.dark .apple-header-glass {
  background: color-mix(in srgb, var(--accent) 8%, rgba(20, 20, 22, 0.75));
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  box-shadow: 0 8px 28px -6px rgba(0, 0, 0, 0.6);
}

/* 🌟 Micro-interactions */
.apple-press {
  transition: transform 0.12s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.12s ease;
}
.apple-press:active {
  transform: scale(0.97);
}

/* 🌟 Apple Badges */
.apple-badge-neutral {
  background-color: var(--bg-surface-subtle);
  color: var(--text-muted);
  border: 1px solid var(--border-color);
}
.apple-badge-accent {
  background-color: var(--accent-light);
  color: var(--accent-text);
  border: 1px solid var(--accent-border);
}
```

---

## ⚡ 3. Theme Engine (`src/context/ThemeContext.tsx`)

Context ini mengelola:
- Dark Mode / Light Mode / System
- 3 Tema Bawaan (`slate`, `amber`, `rose`)
- 3 Custom Hex Codes (`custom1`, `custom2`, `custom3`)
- Menginjeksi CSS variables secara dinamis saat user mengganti kode HEX tanpa reload.

```tsx
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
  if (c.length === 3) c = c.split("").map((x) => x + x).join("");
  const num = parseInt(c, 16);
  if (isNaN(num) || c.length !== 6) return `rgba(99, 102, 241, ${alpha})`;
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [themeColor, setThemeColorState] = useState<ThemeColor>("slate");
  const [customColor1, setCustomColor1State] = useState<string>("#5865F2");
  const [customColor2, setCustomColor2State] = useState<string>("#34A853");
  const [customColor3, setCustomColor3State] = useState<string>("#8B5CF6");
  const [resolvedMode, setResolvedMode] = useState<"light" | "dark">("light");

  useEffect(() => {
    const savedMode = localStorage.getItem("app-theme-mode") as ThemeMode | null;
    const savedColor = localStorage.getItem("app-theme-color") as ThemeColor | null;
    const savedC1 = localStorage.getItem("app-custom-1");
    const savedC2 = localStorage.getItem("app-custom-2");
    const savedC3 = localStorage.getItem("app-custom-3");

    if (savedMode) setThemeModeState(savedMode);
    if (savedColor) setThemeColorState(savedColor);
    if (savedC1) setCustomColor1State(savedC1);
    if (savedC2) setCustomColor2State(savedC2);
    if (savedC3) setCustomColor3State(savedC3);
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

    const updateResolved = () => {
      const isDark = themeMode === "dark" || (themeMode === "system" && mediaQuery.matches);
      setResolvedMode(isDark ? "dark" : "light");
      root.classList.toggle("dark", isDark);
    };

    updateResolved();
    mediaQuery.addEventListener("change", updateResolved);
    return () => mediaQuery.removeEventListener("change", updateResolved);
  }, [themeMode]);

  useEffect(() => {
    const root = document.documentElement;
    root.classList.remove("theme-slate", "theme-amber", "theme-rose", "theme-custom1", "theme-custom2", "theme-custom3");
    root.classList.add(`theme-${themeColor}`);
    root.setAttribute("data-palette", themeColor);

    if (themeColor === "custom1" || themeColor === "custom2" || themeColor === "custom3") {
      const activeHex = themeColor === "custom1" ? customColor1 : themeColor === "custom2" ? customColor2 : customColor3;
      const isDark = resolvedMode === "dark";
      root.style.setProperty("--accent", activeHex);
      root.style.setProperty("--accent-hover", activeHex);
      root.style.setProperty("--accent-light", hexToRgba(activeHex, isDark ? 0.22 : 0.14));
      root.style.setProperty("--accent-border", hexToRgba(activeHex, isDark ? 0.40 : 0.30));
      root.style.setProperty("--accent-glow", hexToRgba(activeHex, 0.25));
      root.style.setProperty("--accent-text", activeHex);
    } else {
      root.style.removeProperty("--accent");
      root.style.removeProperty("--accent-hover");
      root.style.removeProperty("--accent-light");
      root.style.removeProperty("--accent-border");
      root.style.removeProperty("--accent-glow");
      root.style.removeProperty("--accent-text");
    }
  }, [themeColor, customColor1, customColor2, customColor3, resolvedMode]);

  return (
    <ThemeContext.Provider
      value={{
        themeMode,
        themeColor,
        customColor1,
        customColor2,
        customColor3,
        resolvedMode,
        setThemeMode: (m) => { setThemeModeState(m); localStorage.setItem("app-theme-mode", m); },
        setThemeColor: (c) => { setThemeColorState(c); localStorage.setItem("app-theme-color", c); },
        setCustomColor1: (h) => { setCustomColor1State(h); localStorage.setItem("app-custom-1", h); },
        setCustomColor2: (h) => { setCustomColor2State(h); localStorage.setItem("app-custom-2", h); },
        setCustomColor3: (h) => { setCustomColor3State(h); localStorage.setItem("app-custom-3", h); },
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
```

---

## 📐 4. Blueprint Tata Letak Simetris (Layout Architecture)

Agar header dan kartu konten sejajar sempurna:

### A. Di `layout.tsx`:
```tsx
<body className="min-h-full flex flex-col bg-page text-main">
  <ThemeProvider>
    <Navbar />
    {/* Bounding box yang sama persis dengan header */}
    <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
      {children}
    </main>
    <footer className="w-full border-t border-subtle-theme py-6 text-xs text-muted-theme">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between">
        <span>© App Name</span>
      </div>
    </footer>
  </ThemeProvider>
</body>
```

### B. Di `Navbar.tsx`:
```tsx
<header className="sticky top-0 z-40 w-full apple-header-glass transition-colors">
  <div className="max-w-6xl mx-auto px-4 sm:px-6 h-13 flex items-center justify-between">
    {/* Logo Sejajar Kartu Kiri */}
    <div className="flex items-center gap-2.5">
      <div className="w-7 h-7 rounded-lg bg-accent-theme text-white flex items-center justify-center">
        ...
      </div>
      <span className="font-semibold text-[15px] text-main">App Brand</span>
    </div>

    {/* Controls Sejajar Kartu Kanan */}
    <div className="flex items-center gap-1">
      {/* Palette, Theme Toggle, Settings buttons */}
    </div>
  </div>
</header>
```

### C. Di Halaman Konten (`page.tsx`):
```tsx
<div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start w-full pb-16">
  {/* Kolom 1 (Sidebar / Left cards) */}
  <aside className="w-full md:w-80 lg:w-76 shrink-0 flex flex-col gap-4">
    <div className="apple-card p-4.5">Card 1</div>
    <div className="apple-card p-4">Card 2 (Tracker)</div>
  </aside>

  {/* Kolom 2 (Main Workspace / Right cards) */}
  <section className="flex-1 w-full min-w-0 flex flex-col gap-4">
    <div className="apple-card p-4">Card Utama</div>
    <div className="apple-card p-4">Timeline / Content Feed</div>
  </section>
</div>
```

---

## 🎯 5. Aturan Penting Desain (Design Checklist)
1. **No Ad-Hoc Colors**: Jangan gunakan warna mentah seperti `bg-blue-600` untuk tombol utama. Selalu gunakan `bg-accent-theme text-white` atau `bg-accent-light-theme text-accent-tint`.
2. **Apple Blur**: Semua kartu menggunakan `.apple-card` yang memiliki kombinasi `backdrop-filter: blur(28px) saturate(210%)` serta `inset` specular border untuk efek kaca nyata.
3. **Typography Hierarchy**:
   - Judul kartu: `text-[15px] font-semibold tracking-tight text-main`
   - Subjudul / Meta: `text-xs text-muted-theme`
   - Badge: `text-[10px] font-semibold tracking-wide rounded-full px-2 py-0.5`
4. **Clean & Uncluttered**: Hindari elemen yang terlalu besar atau teks berulang. Pertahankan kesan ringkas, modern, dan bernafas lega (airy whitespace).
