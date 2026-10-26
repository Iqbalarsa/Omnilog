"use client";

import React, { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X, Loader2, RefreshCw } from "lucide-react";
import {
  getStoredLatestReview,
  saveStoredReview,
  getStoredEntries,
  getStoredBooks,
} from "@/lib/storage";

interface WeeklyReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface ReviewData {
  id?: string;
  empty?: boolean;
  message?: string;
  title: string;
  executiveSummary: string;
  coreThemes: string[];
  takeaways: string[];
  questionsToPonder: string[];
  readingMomentum?: string | null;
  entriesAnalyzed: number;
  booksCovered: string[];
  generatedAt: string;
  saved?: boolean;
}

export default function WeeklyReviewModal({ isOpen, onClose }: WeeklyReviewModalProps) {
  const [mounted, setMounted] = useState(false);
  const [data, setData] = useState<ReviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Load saved review
  const loadSavedReview = () => {
    setLoading(true);
    setError("");
    try {
      const saved = getStoredLatestReview();
      if (saved) {
        setData({
          ...saved,
          saved: true,
          generatedAt: saved.createdAt,
        });
      } else {
        setData({
          empty: true,
          message:
            "No saved weekly review yet. Click 'Generate Review' to synthesize your reading reflections with AI!",
          title: "Weekly Reading Synthesis",
          executiveSummary: "",
          coreThemes: [],
          takeaways: [],
          questionsToPonder: [],
          entriesAnalyzed: 0,
          booksCovered: [],
          generatedAt: new Date().toISOString(),
        });
      }
    } catch (err: any) {
      setError(err.message || "Failed to load review");
    } finally {
      setLoading(false);
    }
  };

  // Generate fresh review (POST)
  const generateNewReview = async () => {
    setLoading(true);
    setError("");
    try {
      const entries = getStoredEntries();
      const books = getStoredBooks();

      const res = await fetch("/api/ai/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entries: entries.slice(0, 15).map((e) => ({
            book: e.book?.title || "Book",
            pageNumber: e.pageNumber,
            content: e.content,
          })),
          books: books.map((b) => b.title),
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate weekly review");
      }
      const json = await res.json();
      saveStoredReview(json);
      setData(json);
    } catch (err: any) {
      setError(err.message || "Failed to generate review");
    } finally {
      setLoading(false);
    }
  };

  // Mount effect for SSR-safe portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      loadSavedReview();
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !mounted) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/25 dark:bg-black/50 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-2xl bg-white/85 dark:bg-[#1c1c1e]/85 backdrop-blur-3xl border border-white/80 dark:border-white/[0.1] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.15)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4.5 border-b border-subtle-theme">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-main">
              Weekly Reading Digest
            </h2>
            <p className="text-xs text-muted-theme mt-0.5">
              Synthesized takeaways and cognitive patterns from your reflections
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={generateNewReview}
              disabled={loading}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-subtle-theme bg-surface hover:bg-accent-light-theme hover:text-accent-tint hover:border-accent-border-theme text-xs font-medium text-main transition-all apple-press cursor-pointer disabled:opacity-50"
              title="Generate fresh review"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
              <span>Regenerate</span>
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-muted-theme hover:text-accent-theme hover:bg-accent-light-theme transition-colors apple-press cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-5 text-xs text-main">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-6 h-6 text-muted-theme animate-spin" />
              <div className="text-center">
                <p className="text-sm font-medium text-main">
                  Synthesizing reading reflections...
                </p>
                <p className="text-xs text-muted-theme mt-0.5">
                  Distilling themes, takeaways, and questions
                </p>
              </div>
            </div>
          )}

          {error && !loading && (
            <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
              <p className="font-semibold mb-1">Unable to load digest</p>
              <p className="text-xs">{error}</p>
              <button
                onClick={generateNewReview}
                className="mt-3 px-3 py-1.5 bg-surface border border-theme rounded-xl text-xs font-medium apple-press cursor-pointer"
              >
                Try Again
              </button>
            </div>
          )}

          {data?.empty && !loading && (
            <div className="py-12 text-center bg-black/[0.02] dark:bg-white/[0.03] border border-dashed border-subtle-theme rounded-2xl p-6">
              <h3 className="text-sm font-semibold text-main mb-1">
                No Digest Generated Yet
              </h3>
              <p className="text-xs text-muted-theme max-w-sm mx-auto mb-4">
                {data.message}
              </p>
              <button
                onClick={generateNewReview}
                className="px-4.5 py-2 rounded-xl bg-accent-theme hover:bg-accent-hover-theme text-white text-xs font-medium shadow-xs cursor-pointer apple-press transition-all"
              >
                Generate First Review
              </button>
            </div>
          )}

          {data && !data.empty && !loading && (
            <div className="space-y-4">
              {/* Header Card with Meta Badges */}
              <div className="p-4.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-2.5">
                <div className="flex items-center gap-2 flex-wrap text-[11px]">
                  <span className="font-medium apple-badge-neutral px-2.5 py-0.5 rounded-full">
                    {data.entriesAnalyzed} {data.entriesAnalyzed === 1 ? "reflection" : "reflections"}
                  </span>
                  {data.booksCovered?.map((b) => (
                    <span
                      key={b}
                      className="font-medium text-main apple-badge-neutral px-2.5 py-0.5 rounded-full"
                    >
                      {b}
                    </span>
                  ))}
                  {data.generatedAt && (
                    <span className="text-muted-theme text-[10px] ml-auto">
                      Saved {new Date(data.generatedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  )}
                </div>

                <h3 className="text-[15px] font-semibold text-main leading-snug tracking-tight">
                  {data.title}
                </h3>
                <p className="text-xs text-muted-theme leading-relaxed">
                  {data.executiveSummary}
                </p>
              </div>

              {/* Core Themes */}
              {data.coreThemes?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted-theme uppercase tracking-wider">
                    Core Themes
                  </div>
                  <div className="flex items-center gap-2 flex-wrap">
                    {data.coreThemes.map((theme, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 rounded-full bg-accent-light-theme text-accent-tint border border-accent-border-theme text-xs font-medium"
                      >
                        {theme}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Key Takeaways */}
              {data.takeaways?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted-theme uppercase tracking-wider">
                    Key Takeaways & Conceptual Shifts
                  </div>
                  <div className="space-y-2">
                    {data.takeaways.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-start gap-2.5 text-xs leading-relaxed text-main p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]"
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-theme mt-1.5 shrink-0" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Socratic Questions to Ponder */}
              {data.questionsToPonder?.length > 0 && (
                <div className="space-y-2">
                  <div className="text-[11px] font-semibold text-muted-theme uppercase tracking-wider">
                    Curiosity Hooks for the Week Ahead
                  </div>
                  <div className="space-y-2">
                    {data.questionsToPonder.map((q, idx) => (
                      <div
                        key={idx}
                        className="p-3.5 rounded-2xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-xs text-main leading-relaxed"
                      >
                        "{q}"
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Reading Momentum Observation */}
              {data.readingMomentum && (
                <div className="p-3.5 rounded-2xl bg-accent-light-theme border border-accent-border-theme text-xs text-accent-tint leading-relaxed">
                  {data.readingMomentum}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-subtle-theme bg-black/[0.02] dark:bg-white/[0.02]">
          <span className="text-[11px] text-muted-theme">
            Stored securely in your local browser storage
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4.5 py-1.5 rounded-full bg-accent-theme hover:bg-accent-hover-theme text-white font-medium text-xs shadow-xs apple-press cursor-pointer transition-all"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}
