"use client";

import React, { useEffect, useState, useCallback, useMemo } from "react";
import {
  BookOpen,
  ChevronRight,
  Trash2,
  Video,
  Headphones,
  ExternalLink,
  Layers,
  Pin,
  Edit3,
  Bookmark,
} from "lucide-react";
import AddBookModal from "@/components/AddBookModal";
import EditBookModal from "@/components/EditBookModal";
import QuickLogForm from "@/components/QuickLogForm";
import EntriesTimeline, { EntryItem } from "@/components/EntriesTimeline";
import WeeklyReviewModal from "@/components/WeeklyReviewModal";
import ActivityCalendarCard from "@/components/ActivityCalendarCard";
import {
  getStoredBooks,
  getStoredEntries,
  calculateReadingStreak,
  updateStoredBook,
  deleteStoredBook,
} from "@/lib/storage";

const YouTubeIcon = ({ className = "w-3.5 h-3.5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

export interface BookItem {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  totalPages: number | null;
  status: string; // READING, COMPLETED, ON_HOLD
  type: string; // "BOOK" | "VIDEO" | "PODCAST"
  url: string | null;
  description?: string | null;
  entriesCount: number;
  lastReadAt: string | null;
  lastPage: string | null;
  createdAt?: string;
  updatedAt?: string;
}

interface StreakStats {
  streak: number;
  hasLoggedToday: boolean;
  totalEntries: number;
  activeDates?: string[];
  dailyCounts?: Record<string, number>;
  dailyActivity?: Record<string, { count: number; types: string[] }>;
}

export default function ReadingWorkspace() {
  const [books, setBooks] = useState<BookItem[]>([]);
  const [selectedBookId, setSelectedBookId] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [entries, setEntries] = useState<EntryItem[]>([]);
  const [streakStats, setStreakStats] = useState<StreakStats>({
    streak: 0,
    hasLoggedToday: false,
    totalEntries: 0,
  });
  const [loadingBooks, setLoadingBooks] = useState(true);
  const [loadingEntries, setLoadingEntries] = useState(true);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showDeleteBookConfirm, setShowDeleteBookConfirm] = useState(false);
  const [isDeletingBook, setIsDeletingBook] = useState(false);

  // Load streak stats
  const loadStreak = useCallback(() => {
    try {
      const stats = calculateReadingStreak();
      setStreakStats(stats);
    } catch (e) {
      console.error("Streak load error:", e);
    }
  }, []);

  // Load books & media
  const loadBooks = useCallback(() => {
    try {
      const stored = getStoredBooks();
      setBooks(stored as any);
    } catch (err) {
      console.error("Failed to load media:", err);
    } finally {
      setLoadingBooks(false);
    }
  }, []);

  // Load entries for current book or all books
  const loadEntries = useCallback(() => {
    setLoadingEntries(true);
    try {
      const data = getStoredEntries(selectedBookId);
      setEntries(data as any);
    } catch (err) {
      console.error("Failed to load entries:", err);
    } finally {
      setLoadingEntries(false);
    }
  }, [selectedBookId]);

  useEffect(() => {
    loadBooks();
    loadStreak();
    if (typeof window !== "undefined") {
      const urlParams = new URLSearchParams(window.location.search);
      const bId = urlParams.get("bookId");
      if (bId) {
        setSelectedBookId(bId);
      }

      const handleStorageUpdate = () => {
        loadStreak();
        loadBooks();
      };
      window.addEventListener("omnilog-storage-updated", handleStorageUpdate);
      window.addEventListener("entry-saved", handleStorageUpdate);
      return () => {
        window.removeEventListener("omnilog-storage-updated", handleStorageUpdate);
        window.removeEventListener("entry-saved", handleStorageUpdate);
      };
    }
  }, [loadBooks, loadStreak]);

  useEffect(() => {
    loadEntries();
  }, [loadEntries]);

  // Active book / media object (if not ALL)
  const activeBook = useMemo(() => {
    if (selectedBookId === "ALL") return null;
    return books.find((b) => b.id === selectedBookId) || null;
  }, [books, selectedBookId]);

  // Category counts
  const categoryCounts = useMemo(() => {
    const counts = { ALL: books.length, BOOK: 0, VIDEO: 0, PODCAST: 0 };
    books.forEach((b) => {
      const t = (b.type ? b.type.toUpperCase() : "BOOK") as "BOOK" | "VIDEO" | "PODCAST";
      if (counts[t] !== undefined) counts[t]++;
    });
    return counts;
  }, [books]);

  // Filter books in left panel by status and category
  // Active reading items stay prioritized naturally at top without extra headers
  const filteredBooks = useMemo(() => {
    const list = books.filter((b) => {
      const itemType = b.type ? b.type.toUpperCase() : "BOOK";
      const matchesCategory =
        categoryFilter === "ALL" || itemType === categoryFilter;
      const matchesStatus =
        statusFilter === "ALL" || b.status === statusFilter;
      return matchesCategory && matchesStatus;
    });

    return list.sort((a, b) => {
      if (a.status === "READING" && b.status !== "READING") return -1;
      if (b.status === "READING" && a.status !== "READING") return 1;
      const timeA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
      const timeB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
      return timeB - timeA;
    });
  }, [books, categoryFilter, statusFilter]);

  // Total entries across all media
  const totalEntriesCount = useMemo(() => {
    return books.reduce((acc, b) => acc + (b.entriesCount || 0), 0);
  }, [books]);

  // Toggle book status between READING and COMPLETED
  const handleToggleFinished = () => {
    if (!activeBook) return;
    const newStatus = activeBook.status === "COMPLETED" ? "READING" : "COMPLETED";
    updateStoredBook(activeBook.id, { status: newStatus });
    loadBooks();
  };

  // Change book status via select dropdown
  const handleStatusChange = (newStatus: string) => {
    if (!activeBook) return;
    updateStoredBook(activeBook.id, { status: newStatus as any });
    loadBooks();
  };

  // Delete active book
  const handleDeleteBook = () => {
    if (!activeBook) return;
    setIsDeletingBook(true);
    try {
      deleteStoredBook(activeBook.id);
      setShowDeleteBookConfirm(false);
      setSelectedBookId("ALL");
      loadBooks();
      loadEntries();
      loadStreak();
    } catch (err) {
      console.error("Failed to delete media:", err);
    } finally {
      setIsDeletingBook(false);
    }
  };

  const getMediaBadge = (type?: string) => {
    const t = type ? type.toUpperCase() : "BOOK";
    if (t === "VIDEO") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20">
          <Video className="w-2.5 h-2.5" />
          <span>Video</span>
        </span>
      );
    }
    if (t === "PODCAST") {
      return (
        <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
          <Headphones className="w-2.5 h-2.5" />
          <span>Podcast</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 text-[10px] font-medium px-1.5 py-0.2 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20">
        <BookOpen className="w-2.5 h-2.5" />
        <span>Book</span>
      </span>
    );
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 lg:gap-8 items-start w-full pb-16">
      {/* Left Column: Command Center & Interactive Shelf */}
      <aside className="w-full md:w-80 lg:w-76 shrink-0 flex flex-col gap-4">
        {/* OmniLog Command Center Card */}
        <div className="apple-card p-4.5 flex flex-col gap-3">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-[15px] font-semibold tracking-tight text-main">
                Command Center
              </h1>
              <p className="text-xs text-muted-theme mt-0.5">
                {streakStats.streak} {streakStats.streak === 1 ? "day" : "days"} streak • {totalEntriesCount} reflections
              </p>
            </div>
            <span className="text-[11px] font-medium px-2.5 py-0.5 rounded-full apple-badge-neutral">
              {books.length} {books.length === 1 ? "item" : "items"}
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-2 border-t border-subtle-theme">
            <button
              onClick={() => setIsReviewModalOpen(true)}
              className="w-full py-2 px-3 rounded-xl bg-surface border border-subtle-theme hover:bg-accent-light-theme hover:text-accent-tint hover:border-accent-border-theme text-main text-xs font-medium text-center transition-all apple-press cursor-pointer"
            >
              Weekly Review
            </button>
            <AddBookModal onBookAdded={loadBooks} />
          </div>
        </div>

        {/* 30-Day Activity Track Card (Placed directly under Command Center) */}
        <ActivityCalendarCard
          dailyActivity={streakStats.dailyActivity || {}}
        />

        {/* Media Shelf Card */}
        <div className="apple-card p-4 flex flex-col gap-3.5">
          {/* Header & Status Segmented Control */}
          <div className="flex items-center justify-between pb-2 border-b border-subtle-theme">
            <div className="flex items-center gap-1.5">
              <h2 className="text-xs font-semibold text-main tracking-tight uppercase">
                Bookshelf & Media
              </h2>
              <span className="text-[10px] font-semibold px-1.5 py-0.2 rounded-full bg-accent-light-theme text-accent-tint border border-accent-border-theme">
                {books.length}
              </span>
            </div>

            {/* Apple iOS Segmented Control for Status */}
            <div className="apple-segmented-container">
              {[
                { id: "ALL", label: "All" },
                { id: "READING", label: "Active" },
                { id: "COMPLETED", label: "Done" },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setStatusFilter(tab.id)}
                  className={`apple-segmented-btn cursor-pointer ${
                    statusFilter === tab.id ? "active" : ""
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category Tabs: All, Books, Videos, Podcasts */}
          <div className="grid grid-cols-4 gap-1 p-1 rounded-xl bg-black/[0.03] dark:bg-white/[0.05] border border-black/[0.04] dark:border-white/[0.04]">
            {[
              { id: "ALL", label: "All", count: categoryCounts.ALL },
              { id: "BOOK", label: "Books", count: categoryCounts.BOOK },
              { id: "VIDEO", label: "Videos", count: categoryCounts.VIDEO },
              { id: "PODCAST", label: "Audio", count: categoryCounts.PODCAST },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setCategoryFilter(tab.id)}
                className={`py-1 px-1 rounded-lg text-[11px] font-medium transition-all text-center cursor-pointer ${
                  categoryFilter === tab.id
                    ? "bg-white dark:bg-[#2c2c2e] text-main shadow-2xs font-semibold"
                    : "text-muted-theme hover:text-main"
                }`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="ml-1 opacity-60 text-[10px]">({tab.count})</span>
                )}
              </button>
            ))}
          </div>

          {/* "All Media Stream" Button */}
          <button
            onClick={() => setSelectedBookId("ALL")}
            className={`w-full flex items-center justify-between p-2.5 rounded-xl text-left transition-all apple-press cursor-pointer border ${
              selectedBookId === "ALL"
                ? "bg-accent-light-theme border-accent-border-theme text-accent-tint font-semibold shadow-2xs"
                : "bg-transparent border-transparent text-muted-theme hover:bg-accent-light-theme/40 hover:text-accent-tint"
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-accent-theme" />
              <div>
                <div className="text-xs leading-tight">All Media Stream</div>
                <div className="text-[11px] text-muted-theme font-normal mt-0.5">
                  {totalEntriesCount} total reflections
                </div>
              </div>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-muted-theme/80" />
          </button>

          {/* Shelf Items List Feed */}
          <div className="flex flex-col gap-1 max-h-[560px] overflow-y-auto pr-0.5">
            {loadingBooks && (
              <div className="py-8 text-center text-xs text-muted-theme">
                Loading shelf...
              </div>
            )}

            {!loadingBooks && filteredBooks.length === 0 && (
              <div className="py-6 text-center text-xs text-muted-theme">
                No items match this filter.
              </div>
            )}

            {!loadingBooks &&
              filteredBooks.map((b) => {
                const isSelected = selectedBookId === b.id;
                const itemType = b.type ? b.type.toUpperCase() : "BOOK";

                return (
                  <div
                    key={b.id}
                    onClick={() => setSelectedBookId(b.id)}
                    className={`group flex items-center gap-2.5 p-2 rounded-xl text-left transition-all apple-press cursor-pointer border ${
                      isSelected
                        ? "bg-accent-light-theme border-accent-border-theme text-accent-tint font-semibold shadow-2xs"
                        : "bg-transparent border-transparent text-main hover:bg-accent-light-theme/40 hover:text-accent-tint"
                    }`}
                  >
                    {/* Cover Thumbnail */}
                    <div className="w-8 h-11 bg-surface-elevated rounded-[6px] overflow-hidden shrink-0 border border-subtle-theme flex items-center justify-center shadow-2xs">
                      {b.coverUrl ? (
                        <img
                          src={b.coverUrl}
                          alt={b.title}
                          className="w-full h-full object-cover"
                        />
                      ) : itemType === "VIDEO" ? (
                        <Video className="w-3.5 h-3.5 text-muted-theme/50" />
                      ) : itemType === "PODCAST" ? (
                        <Headphones className="w-3.5 h-3.5 text-muted-theme/50" />
                      ) : (
                        <BookOpen className="w-3.5 h-3.5 text-muted-theme/50" />
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-xs font-medium truncate leading-tight">
                        {b.title}
                      </h3>
                      <p className="text-[11px] text-muted-theme truncate mt-0.5">
                        {b.author || (itemType === "VIDEO" ? "YouTube Creator" : itemType === "PODCAST" ? "Podcast Host" : "Author")}
                      </p>
                      <div className="flex items-center gap-1.5 mt-1 text-[10px]">
                        {getMediaBadge(b.type)}
                        <span className="text-muted-theme/40">•</span>
                        <span className="text-muted-theme">{b.entriesCount || 0} notes</span>
                      </div>
                    </div>

                    {/* Quick Link Shortcut */}
                    {b.url && (
                      <a
                        href={b.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={(e) => e.stopPropagation()}
                        title={itemType === "VIDEO" ? "Watch on YouTube" : "Open Link"}
                        className="p-1.5 rounded-lg text-muted-theme hover:text-accent-theme hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors shrink-0"
                      >
                        {itemType === "VIDEO" ? (
                          <YouTubeIcon className="w-3.5 h-3.5 text-red-500" />
                        ) : (
                          <ExternalLink className="w-3.5 h-3.5" />
                        )}
                      </a>
                    )}

                    <ChevronRight
                      className={`w-3.5 h-3.5 shrink-0 transition-transform ${
                        isSelected
                          ? "text-main translate-x-0.5"
                          : "text-muted-theme/50 opacity-0 group-hover:opacity-100"
                      }`}
                    />
                  </div>
                );
              })}
          </div>
        </div>
      </aside>

      {/* Right Column: Main Reading / Media Feed & Journal Workspace */}
      <section className="flex-1 w-full min-w-0 flex flex-col gap-4">
        {/* Active Media Card (or All Media Header) */}
        <div className="apple-card p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {activeBook ? (
            <>
              <div className="flex items-center gap-3.5 min-w-0">
                <div className="w-12 h-16 bg-surface-elevated rounded-lg overflow-hidden shrink-0 border border-subtle-theme shadow-xs flex items-center justify-center">
                  {activeBook.coverUrl ? (
                    <img
                      src={activeBook.coverUrl}
                      alt={activeBook.title}
                      className="w-full h-full object-cover"
                    />
                  ) : activeBook.type === "VIDEO" ? (
                    <Video className="w-6 h-6 text-muted-theme/50" />
                  ) : activeBook.type === "PODCAST" ? (
                    <Headphones className="w-6 h-6 text-muted-theme/50" />
                  ) : (
                    <BookOpen className="w-6 h-6 text-muted-theme/50" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {getMediaBadge(activeBook.type)}

                    <select
                      value={activeBook.status}
                      onChange={(e) => handleStatusChange(e.target.value)}
                      className="px-2.5 py-0.5 rounded-full text-[11px] font-medium apple-input text-main focus:outline-hidden cursor-pointer"
                    >
                      <option value="READING">
                        {activeBook.type === "VIDEO"
                          ? "Watching"
                          : activeBook.type === "PODCAST"
                          ? "Listening"
                          : "Reading"}
                      </option>
                      <option value="COMPLETED">Completed</option>
                      <option value="ON_HOLD">On Hold</option>
                    </select>

                    {activeBook.totalPages && (
                      <span className="text-[11px] font-medium apple-badge-neutral px-2.5 py-0.5 rounded-full">
                        {activeBook.type === "BOOK"
                          ? `${activeBook.totalPages} pages`
                          : `${activeBook.totalPages} mins`}
                      </span>
                    )}

                    <span className="text-[11px] font-medium apple-badge-neutral px-2.5 py-0.5 rounded-full">
                      {entries.length} reflections
                    </span>
                  </div>

                  <h2 className="text-base sm:text-lg font-semibold text-main tracking-tight truncate mt-1">
                    {activeBook.title}
                  </h2>
                  <p className="text-xs text-muted-theme truncate">
                    {activeBook.type === "VIDEO"
                      ? `by ${activeBook.author || "YouTube Channel"}`
                      : activeBook.type === "PODCAST"
                      ? `hosted by ${activeBook.author || "Podcast Host"}`
                      : `by ${activeBook.author || "Unknown Author"}`}
                  </p>
                </div>
              </div>

              {/* Actions: Link, Status, Edit, Delete */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0 flex-wrap">
                {/* Simple Link Button that opens in a new tab */}
                {activeBook.url && (
                  <a
                    href={activeBook.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-accent-light-theme hover:bg-accent-border-theme/40 text-accent-tint text-xs font-semibold transition-all border border-accent-border-theme shadow-2xs apple-press"
                  >
                    {activeBook.type === "VIDEO" ? (
                      <YouTubeIcon className="w-3.5 h-3.5 text-red-500 shrink-0" />
                    ) : (
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    )}
                    <span>
                      {activeBook.type === "VIDEO" ? "Watch ↗" : "Source ↗"}
                    </span>
                  </a>
                )}

                <button
                  onClick={handleToggleFinished}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-medium transition-all apple-press cursor-pointer ${
                    activeBook.status === "COMPLETED"
                      ? "apple-btn-secondary"
                      : "bg-accent-theme hover:bg-accent-hover-theme text-white shadow-xs"
                  }`}
                >
                  {activeBook.status === "COMPLETED"
                    ? "Mark Active"
                    : "Mark Finished"}
                </button>

                {/* Edit Media Popup Trigger Button */}
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(true)}
                  className="p-2 rounded-xl text-muted-theme hover:text-accent-theme hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition-colors apple-press cursor-pointer"
                  title="Edit media details"
                >
                  <Edit3 className="w-4 h-4" />
                </button>

                {!showDeleteBookConfirm ? (
                  <button
                    onClick={() => setShowDeleteBookConfirm(true)}
                    className="p-2 rounded-xl text-muted-theme hover:text-red-500 hover:bg-red-500/10 transition-colors apple-press cursor-pointer"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="flex items-center gap-1.5 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-xl text-xs">
                    <span className="text-red-600 dark:text-red-400 font-medium">
                      Delete?
                    </span>
                    <button
                      onClick={handleDeleteBook}
                      disabled={isDeletingBook}
                      className="text-red-600 font-semibold hover:underline cursor-pointer"
                    >
                      {isDeletingBook ? "..." : "Yes"}
                    </button>
                    <button
                      onClick={() => setShowDeleteBookConfirm(false)}
                      className="text-muted-theme hover:underline cursor-pointer"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex items-center justify-between w-full">
              <div>
                <h2 className="text-base font-semibold text-main tracking-tight">
                  Universal Reflection Journal
                </h2>
                <p className="text-xs text-muted-theme mt-0.5">
                  Reflections and AI dialogues across books, videos, and podcasts
                </p>
              </div>
              <span className="text-xs font-medium apple-badge-neutral px-2.5 py-1 rounded-full">
                {entries.length} reflections
              </span>
            </div>
          )}
        </div>

        {/* Quick Log Form with Dynamic Type */}
        <QuickLogForm
          bookId={selectedBookId}
          books={books.map((b) => ({ id: b.id, title: b.title, type: b.type }))}
          mediaType={activeBook ? (activeBook.type || "BOOK") : "BOOK"}
          onEntrySaved={() => {
            loadEntries();
            loadBooks();
            loadStreak();
          }}
        />

        {/* Entries Timeline */}
        <EntriesTimeline
          entries={entries}
          onRefresh={() => {
            loadEntries();
            loadBooks();
            loadStreak();
          }}
          activeBookTitle={activeBook?.title || "All Media"}
        />
      </section>

      {/* Weekly AI Review Modal */}
      <WeeklyReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        activeBook={activeBook}
      />

      {/* Edit Media Modal Popup */}
      <EditBookModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        book={activeBook}
        onBookUpdated={loadBooks}
      />
    </div>
  );
}
