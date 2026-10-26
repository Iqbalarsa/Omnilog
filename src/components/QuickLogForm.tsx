"use client";

import React, { useState } from "react";
import { Bookmark, Check } from "lucide-react";

interface BookOption {
  id: string;
  title: string;
  type?: string;
}

interface QuickLogFormProps {
  bookId: string;
  books?: BookOption[];
  mediaType?: string;
  onEntrySaved: () => void;
}

export default function QuickLogForm({
  bookId,
  books = [],
  mediaType = "BOOK",
  onEntrySaved,
}: QuickLogFormProps) {
  const [selectedBookId, setSelectedBookId] = useState(bookId);
  const [content, setContent] = useState("");
  const [pageNumber, setPageNumber] = useState("");
  const [engageAi, setEngageAi] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);

  React.useEffect(() => {
    if (bookId && bookId !== "ALL") {
      setSelectedBookId(bookId);
    } else if (bookId === "ALL" && books.length > 0) {
      setSelectedBookId(books[0].id);
    }
  }, [bookId, books]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) {
      setError("Please write down your reflection or takeaway.");
      return;
    }

    const targetId = selectedBookId || bookId;
    if (!targetId || targetId === "ALL") {
      setError("Please select a book for this reflection.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      const res = await fetch(`/api/books/${targetId}/entries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          content: content.trim(),
          pageNumber: pageNumber.trim() || null,
          engageAi,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to save entry");
      }

      setContent("");
      setPageNumber("");
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);

      onEntrySaved();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("entry-saved"));
      }
    } catch (err: any) {
      setError(err.message || "Failed to save reflection");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="apple-card p-4.5">
      <div className="flex items-center justify-between mb-3 pb-2 border-b border-subtle-theme">
        <div>
          <h2 className="text-[14px] font-semibold tracking-tight text-main">
            Quick Reflection
          </h2>
          <p className="text-xs text-muted-theme mt-0.5">
            Record spontaneous thoughts and discuss with your AI sparring partner
          </p>
        </div>

        {success && (
          <span className="flex items-center gap-1 text-[11px] font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full animate-in fade-in">
            <Check className="w-3 h-3" />
            Saved
          </span>
        )}
      </div>

      {error && (
        <div className="p-2.5 mb-3 text-xs font-medium rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        {/* Book Selector if viewing All Books */}
        {books.length > 1 && (!bookId || bookId === "ALL") && (
          <div className="flex items-center gap-2">
            <label className="text-[11px] font-semibold text-muted-theme uppercase tracking-wider">
              Log To:
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="px-2.5 py-1 rounded-lg bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] text-main text-xs focus:outline-hidden font-medium cursor-pointer"
            >
              {books.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.title}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Apple Inset Textarea */}
        <div className="relative">
          <textarea
            required
            rows={3}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder="What core insight, counterintuitive idea, or mental model did you discover?"
            className="w-full p-3.5 rounded-2xl bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] text-main text-xs sm:text-sm placeholder:text-muted-theme/60 leading-relaxed focus:outline-hidden focus:border-accent-theme resize-y transition-all font-sans"
          />
        </div>

        {/* Bottom controls row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          {/* Page/Timestamp/Chapter Input */}
          <div className="flex items-center gap-2">
            <Bookmark className="w-3.5 h-3.5 text-muted-theme" />
            <input
              type="text"
              value={pageNumber}
              onChange={(e) => setPageNumber(e.target.value)}
              placeholder={
                mediaType === "VIDEO"
                  ? "12:45 or Part 1"
                  : mediaType === "PODCAST"
                  ? "24:10 or Ep. 3"
                  : "pp. 45–60 or Ch. 2"
              }
              className="px-3 py-1.5 rounded-xl bg-white dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.1] text-main text-xs placeholder:text-muted-theme/60 focus:outline-hidden focus:border-accent-theme w-44 transition-all font-normal"
            />
          </div>

          <div className="flex items-center gap-3 self-end sm:self-auto">
            {/* AI Sparing Partner Toggle */}
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={engageAi}
                onChange={(e) => setEngageAi(e.target.checked)}
                className="w-4 h-4 rounded-md accent-[var(--accent)] cursor-pointer"
              />
              <span className="text-xs font-medium text-main">
                AI Sparring Partner
              </span>
            </label>

            {/* Apple Primary Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-4.5 py-1.5 rounded-xl bg-accent-theme hover:bg-accent-hover-theme text-white font-medium text-xs shadow-xs transition-all apple-press cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? "Logging..." : "Log Note"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
