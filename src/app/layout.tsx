import type { Metadata } from "next";
import { Geist, Geist_Mono, Newsreader } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import Navbar from "@/components/Navbar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const newsreader = Newsreader({
  variable: "--font-serif",
  subsets: ["latin"],
  style: ["normal", "italic"],
});

export const metadata: Metadata = {
  title: "OmniLog AI — Universal Knowledge & Reflection Workspace",
  description:
    "Curate and reflect on books, videos, and podcasts with frictionless micro-journaling, Socratic AI sparring, and habit tracking.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${geistSans.variable} ${geistMono.variable} ${newsreader.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-page text-main">
        <ThemeProvider>
          <Navbar />
          <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-6">
            {children}
          </main>
          <footer className="w-full border-t border-subtle-theme py-6 text-xs text-muted-theme">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="font-semibold text-main">
                OmniLog AI
              </span>
              <span>
                Books • Videos • Podcasts • Socratic AI Sparring Partner
              </span>
              <span className="text-faint-theme text-[11px]">
                Active Recall Engine
              </span>
            </div>
          </footer>
        </ThemeProvider>
      </body>
    </html>
  );
}
