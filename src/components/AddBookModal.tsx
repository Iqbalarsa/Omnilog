"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import {
  Plus,
  Search,
  Book,
  Video,
  Headphones,
  Image as ImageIcon,
  Check,
  X,
  Loader2,
  AlertCircle,
  ExternalLink,
} from "lucide-react";
import { saveNewBook } from "@/lib/storage";

const YouTubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface AddBookModalProps {
  onBookAdded: () => void;
}

interface GoogleBookItem {
  id: string;
  title: string;
  author: string;
  coverUrl: string | null;
  totalPages: number | null;
  description: string | null;
  publishedDate: string | null;
}

type MediaType = "BOOK" | "VIDEO" | "PODCAST";

function extractYouTubeThumbnail(url: string): string | null {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
  } catch {
    // fallback
  }
  return null;
}

export default function AddBookModal({ onBookAdded }: AddBookModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("BOOK");

  // Search state for Books
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GoogleBookItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showManualForm, setShowManualForm] = useState(false);

  // Common Form Fields
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [status, setStatus] = useState("READING");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  const searchTimeout = useRef<NodeJS.Timeout | null>(null);

  // Mount effect for SSR-safe portal rendering
  useEffect(() => {
    setMounted(true);
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen]);

  // Debounced search via Google Books API (only active for BOOK type)
  useEffect(() => {
    if (mediaType !== "BOOK" || !searchQuery.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    setIsSearching(true);
    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/books/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data.results || []);
        }
      } catch (err) {
        console.error("Book search failed:", err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => {
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
    };
  }, [searchQuery, mediaType]);

  // When URL changes in VIDEO mode, auto-detect YouTube thumbnail
  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (mediaType === "VIDEO") {
      const ytThumb = extractYouTubeThumbnail(newUrl);
      if (ytThumb && !coverUrl) {
        setCoverUrl(ytThumb);
      }
    }
  };

  const selectGoogleBook = (book: GoogleBookItem) => {
    setTitle(book.title);
    setAuthor(book.author);
    setCoverUrl(book.coverUrl || "");
    setTotalPages(book.totalPages ? String(book.totalPages) : "");
    setShowManualForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setError(`Please provide a ${mediaType.toLowerCase()} title.`);
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      // Auto-extract YouTube thumbnail if empty
      let finalCover = coverUrl.trim() || null;
      if (mediaType === "VIDEO" && url.trim() && !finalCover) {
        finalCover = extractYouTubeThumbnail(url.trim());
      }

      saveNewBook({
        title: title.trim(),
        author: author.trim() || null,
        coverUrl: finalCover,
        totalPages: totalPages ? parseInt(totalPages, 10) : null,
        status: (status as "READING" | "COMPLETED" | "ON_HOLD") || "READING",
        type: mediaType,
        url: url.trim() || null,
      });

      // Reset and close
      resetForm();
      setIsOpen(false);
      onBookAdded();
    } catch (err: any) {
      setError(err.message || "Failed to add item");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setMediaType("BOOK");
    setSearchQuery("");
    setSearchResults([]);
    setTitle("");
    setAuthor("");
    setUrl("");
    setCoverUrl("");
    setTotalPages("");
    setStatus("READING");
    setShowManualForm(false);
    setError("");
  };

  const handleTypeSwitch = (type: MediaType) => {
    setMediaType(type);
    setError("");
    if (type !== "BOOK") {
      setShowManualForm(true);
    }
  };

  return (
    <>
      {/* Trigger Button - Apple Theme Accent */}
      <button
        onClick={() => {
          resetForm();
          setIsOpen(true);
        }}
        className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-accent-theme hover:bg-accent-hover-theme text-white font-medium text-xs shadow-xs transition-all apple-press cursor-pointer"
      >
        <Plus className="w-3.5 h-3.5" />
        <span>Add Media</span>
      </button>

      {/* Modal Backdrop & Popup Window (Portaled to document.body for true screen centering) */}
      {isOpen && mounted && createPortal(
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="relative w-full max-w-lg bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-3xl border border-white/80 dark:border-white/[0.1] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="flex items-center justify-between px-6 py-4.5 border-b border-subtle-theme shrink-0">
              <div>
                <h2 className="text-[16px] font-semibold tracking-tight text-main">
                  Add to Shelf
                </h2>
                <p className="text-xs text-muted-theme mt-0.5">
                  Track books, YouTube videos, and podcasts
                </p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full text-muted-theme hover:text-accent-theme hover:bg-accent-light-theme transition-colors apple-press cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Media Type Segmented Tabs */}
            <div className="px-6 pt-4 pb-1">
              <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04]">
                <button
                  type="button"
                  onClick={() => handleTypeSwitch("BOOK")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all apple-press cursor-pointer ${
                    mediaType === "BOOK"
                      ? "bg-white dark:bg-[#2c2c2e] text-main shadow-2xs font-semibold"
                      : "text-muted-theme hover:text-main"
                  }`}
                >
                  <Book className="w-3.5 h-3.5" />
                  <span>Book</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSwitch("VIDEO")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all apple-press cursor-pointer ${
                    mediaType === "VIDEO"
                      ? "bg-white dark:bg-[#2c2c2e] text-main shadow-2xs font-semibold"
                      : "text-muted-theme hover:text-main"
                  }`}
                >
                  <Video className="w-3.5 h-3.5" />
                  <span>Video</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeSwitch("PODCAST")}
                  className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all apple-press cursor-pointer ${
                    mediaType === "PODCAST"
                      ? "bg-white dark:bg-[#2c2c2e] text-main shadow-2xs font-semibold"
                      : "text-muted-theme hover:text-main"
                  }`}
                >
                  <Headphones className="w-3.5 h-3.5" />
                  <span>Podcast</span>
                </button>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 overflow-y-auto space-y-4 text-xs text-main">
              {error && (
                <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 flex items-center gap-2 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{error}</span>
                </div>
              )}

              {/* BOOK: Google Books Search Section */}
              {mediaType === "BOOK" && !showManualForm && (
                <div className="space-y-1.5">
                  <label className="text-[11px] font-semibold uppercase tracking-wider text-muted-theme">
                    Search Google Books
                  </label>
                  <div className="relative">
                    <Search className="w-4 h-4 text-muted-theme absolute left-3.5 top-3" />
                    <input
                      type="text"
                      placeholder="Search by title, author, or ISBN..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-9.5 pr-10 py-2 rounded-xl apple-input text-main placeholder:text-muted-theme text-xs focus:outline-hidden"
                    />
                    {isSearching && (
                      <Loader2 className="w-4 h-4 text-accent-theme absolute right-3 top-2.5 animate-spin" />
                    )}
                  </div>

                  {/* Search Results Dropdown/Grid */}
                  {searchResults.length > 0 && (
                    <div className="mt-2 flex flex-col gap-1 max-h-52 overflow-y-auto p-1.5 border border-subtle-theme rounded-2xl bg-surface-subtle">
                      <div className="text-[11px] font-semibold text-muted-theme px-2.5 py-1">
                        Select a match to auto-fill:
                      </div>
                      {searchResults.map((book) => (
                        <div
                          key={book.id}
                          onClick={() => selectGoogleBook(book)}
                          className="flex items-center gap-2.5 p-2 rounded-xl hover:bg-surface-elevated border border-transparent hover:border-accent-border-theme cursor-pointer transition-all apple-press text-left"
                        >
                          <div className="w-9 h-12 bg-surface-elevated rounded-md overflow-hidden shrink-0 border border-subtle-theme flex items-center justify-center">
                            {book.coverUrl ? (
                              <img
                                src={book.coverUrl}
                                alt={book.title}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <Book className="w-4 h-4 text-faint-theme" />
                            )}
                          </div>
                          <div className="flex-1 min-w-0">
                            <h4 className="text-xs font-semibold text-main truncate">
                              {book.title}
                            </h4>
                            <p className="text-[11px] text-muted-theme truncate">
                              {book.author} {book.publishedDate ? `• ${book.publishedDate.substring(0, 4)}` : ""}
                            </p>
                            {book.totalPages && (
                              <span className="text-[10px] text-faint-theme">
                                {book.totalPages} pages
                              </span>
                            )}
                          </div>
                          <span className="text-[11px] font-medium text-accent-tint bg-accent-light-theme px-2.5 py-1 rounded-full shrink-0">
                            Select
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Manual Toggle */}
                  <div className="flex items-center justify-between text-xs pt-2">
                    <span className="text-muted-theme">
                      Can&apos;t find it via search?
                    </span>
                    <button
                      type="button"
                      onClick={() => setShowManualForm(true)}
                      className="text-accent-theme font-semibold hover:underline cursor-pointer"
                    >
                      Enter details manually
                    </button>
                  </div>
                </div>
              )}

              {/* BOOK Search reset button when manual form is open */}
              {mediaType === "BOOK" && showManualForm && (
                <div className="flex items-center justify-between text-xs pb-1">
                  <span className="text-muted-theme">Review book details:</span>
                  <button
                    type="button"
                    onClick={() => setShowManualForm(false)}
                    className="text-accent-theme font-semibold hover:underline cursor-pointer"
                  >
                    Search again
                  </button>
                </div>
              )}

              {/* Main Manual / Details Form (for Book manual, Video, and Podcast) */}
              {(showManualForm || mediaType !== "BOOK") && (
                <form onSubmit={handleSubmit} className="space-y-3.5 animate-in fade-in duration-150">
                  {/* Link Input (Crucial for Video & Podcast, also optional for Book) */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider mb-1">
                      {mediaType === "VIDEO"
                        ? "Video / YouTube URL"
                        : mediaType === "PODCAST"
                        ? "Podcast / Episode URL"
                        : "Reference Link (Optional)"}
                    </label>
                    <div className="relative">
                      {mediaType === "VIDEO" ? (
                        <YouTubeIcon className="w-4 h-4 text-red-500 absolute left-3 top-2.5" />
                      ) : (
                        <ExternalLink className="w-3.5 h-3.5 text-muted-theme absolute left-3 top-2.5" />
                      )}
                      <input
                        type="url"
                        value={url}
                        onChange={(e) => handleUrlChange(e.target.value)}
                        placeholder={
                          mediaType === "VIDEO"
                            ? "https://www.youtube.com/watch?v=... or https://youtu.be/..."
                            : mediaType === "PODCAST"
                            ? "https://open.spotify.com/episode/... or Apple Podcasts link"
                            : "https://..."
                        }
                        className="w-full pl-9 pr-3 py-1.5 rounded-xl apple-input text-main text-xs focus:outline-hidden"
                      />
                    </div>
                    {mediaType === "VIDEO" && (
                      <p className="text-[10px] text-muted-theme mt-1">
                        Tip: Pasting a YouTube link will automatically fetch the video thumbnail!
                      </p>
                    )}
                  </div>

                  <div className="flex gap-3.5 items-start">
                    {/* Cover Preview */}
                    <div className="w-20 h-28 bg-surface-elevated border border-subtle-theme rounded-xl overflow-hidden shrink-0 flex items-center justify-center relative shadow-2xs">
                      {coverUrl ? (
                        <img
                          src={coverUrl}
                          alt="Preview"
                          className="w-full h-full object-cover"
                          onError={() => setCoverUrl("")}
                        />
                      ) : (
                        <div className="text-center p-2 text-faint-theme">
                          {mediaType === "VIDEO" ? (
                            <Video className="w-5 h-5 mx-auto mb-1 opacity-60" />
                          ) : mediaType === "PODCAST" ? (
                            <Headphones className="w-5 h-5 mx-auto mb-1 opacity-60" />
                          ) : (
                            <ImageIcon className="w-5 h-5 mx-auto mb-1 opacity-60" />
                          )}
                          <span className="text-[10px]">No Thumbnail</span>
                        </div>
                      )}
                    </div>

                    {/* Title & Creator Input Fields */}
                    <div className="flex-1 space-y-2.5 min-w-0">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider mb-1">
                          {mediaType === "VIDEO"
                            ? "Video Title *"
                            : mediaType === "PODCAST"
                            ? "Episode / Show Title *"
                            : "Title *"}
                        </label>
                        <input
                          type="text"
                          required
                          value={title}
                          onChange={(e) => setTitle(e.target.value)}
                          placeholder={
                            mediaType === "VIDEO"
                              ? "e.g. How to Build Focus & Deep Work"
                              : mediaType === "PODCAST"
                              ? "e.g. The Science of Learning Fast"
                              : "e.g. Atomic Habits"
                          }
                          className="w-full px-3 py-1.5 rounded-xl apple-input text-main text-xs focus:outline-hidden"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider mb-1">
                          {mediaType === "VIDEO"
                            ? "Channel / Creator"
                            : mediaType === "PODCAST"
                            ? "Host / Podcast Name"
                            : "Author"}
                        </label>
                        <input
                          type="text"
                          value={author}
                          onChange={(e) => setAuthor(e.target.value)}
                          placeholder={
                            mediaType === "VIDEO"
                              ? "e.g. Andrew Huberman, Veritasium"
                              : mediaType === "PODCAST"
                              ? "e.g. Tim Ferriss, Lex Fridman"
                              : "e.g. James Clear"
                          }
                          className="w-full px-3 py-1.5 rounded-xl apple-input text-main text-xs focus:outline-hidden"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider mb-1">
                        {mediaType === "BOOK"
                          ? "Total Pages"
                          : "Duration (Minutes)"}
                      </label>
                      <input
                        type="number"
                        value={totalPages}
                        onChange={(e) => setTotalPages(e.target.value)}
                        placeholder={mediaType === "BOOK" ? "320" : "45"}
                        className="w-full px-3 py-1.5 rounded-xl apple-input text-main text-xs focus:outline-hidden"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider mb-1">
                        Status
                      </label>
                      <select
                        value={status}
                        onChange={(e) => setStatus(e.target.value)}
                        className="w-full px-2.5 py-1.5 rounded-xl apple-input text-main text-xs focus:outline-hidden cursor-pointer"
                      >
                        <option value="READING">
                          {mediaType === "VIDEO"
                            ? "Watching"
                            : mediaType === "PODCAST"
                            ? "Listening"
                            : "Reading"}
                        </option>
                        <option value="COMPLETED">Completed</option>
                        <option value="ON_HOLD">On Hold / Later</option>
                      </select>
                    </div>
                  </div>

                  {/* Custom Cover / Thumbnail URL */}
                  <div>
                    <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider mb-1">
                      Custom Thumbnail / Cover URL (Optional)
                    </label>
                    <input
                      type="url"
                      value={coverUrl}
                      onChange={(e) => setCoverUrl(e.target.value)}
                      placeholder="https://..."
                      className="w-full px-3 py-1.5 rounded-xl apple-input text-main text-xs focus:outline-hidden"
                    />
                  </div>

                  {/* Submit Actions */}
                  <div className="flex items-center justify-end gap-2 pt-3 border-t border-subtle-theme">
                    <button
                      type="button"
                      onClick={() => setIsOpen(false)}
                      className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-muted-theme hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-main transition-colors apple-press cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl bg-accent-theme hover:bg-accent-hover-theme text-white font-medium text-xs shadow-xs transition-all apple-press cursor-pointer disabled:opacity-50"
                    >
                      {isSubmitting ? (
                        <>
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                          <span>Adding...</span>
                        </>
                      ) : (
                        <span>Add to Shelf</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
