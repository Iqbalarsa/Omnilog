"use client";

import React, { useEffect, useState } from "react";
import { Flame, CheckCircle2, Clock, Sparkles, BookOpen, PenLine } from "lucide-react";
import AddBookModal from "./AddBookModal";
import { calculateReadingStreak } from "@/lib/storage";

interface HabitHeroProps {
  onBookAdded: () => void;
}

export default function HabitHero({ onBookAdded }: HabitHeroProps) {
  const [stats, setStats] = useState({
    streak: 0,
    hasLoggedToday: false,
    totalEntries: 0,
    activeBooksCount: 0,
  });

  const loadStats = () => {
    try {
      const data = calculateReadingStreak();
      setStats(data);
    } catch (e) {
      console.error("Streak load error:", e);
    }
  };

  useEffect(() => {
    loadStats();
    const handleEntrySaved = () => loadStats();
    window.addEventListener("entry-saved", handleEntrySaved);
    window.addEventListener("omnilog-storage-updated", handleEntrySaved);
    return () => {
      window.removeEventListener("entry-saved", handleEntrySaved);
      window.removeEventListener("omnilog-storage-updated", handleEntrySaved);
    };
  }, []);

  return (
    <div className="relative overflow-hidden rounded-2xl bg-surface border border-theme p-4 sm:p-5 shadow-xs">
      {/* Decorative ambient gradient backdrop */}
      <div className="absolute top-0 right-0 -mt-10 -mr-10 w-48 h-48 rounded-full bg-accent-light-theme opacity-40 blur-2xl pointer-events-none" />

      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        {/* Left Column: Heading & Concise prompt */}
        <div className="max-w-md">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent-light-theme text-accent-tint border border-accent-border-theme">
              <Sparkles className="w-3 h-3" />
              Reading Habit
            </span>

            {/* Today Habit Indicator */}
            {stats.hasLoggedToday ? (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-500/15 border border-emerald-500/30">
                <CheckCircle2 className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                Streak Aman Hari Ini
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-medium text-amber-700 dark:text-amber-300 bg-amber-500/15 border border-amber-500/30">
                <Clock className="w-3 h-3 text-amber-600 dark:text-amber-400" />
                Belum baca hari ini
              </span>
            )}
          </div>

          <h1 className="font-serif font-bold text-xl sm:text-2xl text-main tracking-tight leading-snug">
            Read deeply, reflect daily.
          </h1>

          <p className="text-xs sm:text-sm text-muted-theme mt-1 leading-relaxed">
            Record your key takeaways and spar with your personal Socratic AI companion.
          </p>
        </div>

        {/* Right Column: Clean Compact Stats & Add Book CTA */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Flame Streak Metric Box */}
          <div className="flex items-center gap-2.5 bg-surface-elevated border border-subtle-theme px-3.5 py-2 rounded-xl shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-accent-theme/10 border border-accent-border-theme flex items-center justify-center text-accent-theme">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-serif font-black text-lg text-main leading-none">
                  {stats.streak}
                </span>
                <span className="text-[10px] font-bold text-muted-theme uppercase">
                  {stats.streak === 1 ? "Day" : "Days"}
                </span>
              </div>
              <span className="text-[10px] text-muted-theme font-medium block leading-tight">
                Streak
              </span>
            </div>
          </div>

          {/* Reflections Count Box */}
          <div className="flex items-center gap-2.5 bg-surface-elevated border border-subtle-theme px-3.5 py-2 rounded-xl shadow-2xs">
            <div className="w-8 h-8 rounded-lg bg-surface border border-subtle-theme flex items-center justify-center text-accent-theme">
              <PenLine className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-baseline gap-1">
                <span className="font-serif font-black text-lg text-main leading-none">
                  {stats.totalEntries}
                </span>
                <span className="text-[10px] font-bold text-muted-theme uppercase">
                  Notes
                </span>
              </div>
              <span className="text-[10px] text-muted-theme font-medium block leading-tight">
                Reflections
              </span>
            </div>
          </div>

          {/* Add Book Trigger */}
          <div className="ml-auto sm:ml-0">
            <AddBookModal onBookAdded={onBookAdded} />
          </div>
        </div>
      </div>
    </div>
  );
}
