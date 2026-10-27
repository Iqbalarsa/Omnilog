"use client";

import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import {
  X,
  Video,
  Headphones,
  Image as ImageIcon,
  BookOpen,
  ExternalLink,
  Save,
} from "lucide-react";
import { updateStoredBook } from "@/lib/storage";
import { BookItem } from "@/app/page";

const YouTubeIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor">
    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
  </svg>
);

interface EditBookModalProps {
  isOpen: boolean;
  onClose: () => void;
  book: BookItem | null;
  onBookUpdated: () => void;
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

export default function EditBookModal({
  isOpen,
  onClose,
  book,
  onBookUpdated,
}: EditBookModalProps) {
  const [mounted, setMounted] = useState(false);
  const [mediaType, setMediaType] = useState<MediaType>("BOOK");
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [url, setUrl] = useState("");
  const [coverUrl, setCoverUrl] = useState("");
  const [totalPages, setTotalPages] = useState("");
  const [description, setDescription] = useState("");
  const [status, setStatus] = useState("READING");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    setMounted(true);
  }, []);

  // Prepopulate form with previous data when book changes or modal opens
  useEffect(() => {
    if (book && isOpen) {
      const type = (book.type ? book.type.toUpperCase() : "BOOK") as MediaType;
      setMediaType(type === "VIDEO" || type === "PODCAST" ? type : "BOOK");
      setTitle(book.title || "");
      setAuthor(book.author || "");
      setUrl(book.url || "");
      setCoverUrl(book.coverUrl || "");
      setTotalPages(book.totalPages ? String(book.totalPages) : "");
      setDescription(book.description || "");
      setStatus(book.status || "READING");
      setError("");
    }
  }, [book, isOpen]);

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

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    if (mediaType === "VIDEO") {
      const ytThumb = extractYouTubeThumbnail(newUrl);
      if (ytThumb && !coverUrl) {
        setCoverUrl(ytThumb);
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!book) return;
    if (!title.trim()) {
      setError("Please provide a title.");
      return;
    }

    setIsSubmitting(true);
    setError("");

    try {
      let finalCover = coverUrl.trim() || null;
      if (mediaType === "VIDEO" && url.trim() && !finalCover) {
        finalCover = extractYouTubeThumbnail(url.trim());
      }

      updateStoredBook(book.id, {
        title: title.trim(),
        author: author.trim() || null,
        coverUrl: finalCover,
        totalPages: totalPages ? parseInt(totalPages, 10) : null,
        status: (status as "READING" | "COMPLETED" | "ON_HOLD") || "READING",
        type: mediaType,
        url: url.trim() || null,
        description: description.trim() || null,
      });

      onClose();
      onBookUpdated();
    } catch (err: any) {
      setError(err.message || "Failed to update item");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen || !mounted || !book) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 dark:bg-black/60 backdrop-blur-md animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg bg-white/95 dark:bg-[#1c1c1e]/95 backdrop-blur-3xl border border-white/80 dark:border-white/[0.1] rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-subtle-theme shrink-0">
          <div>
            <h2 className="text-[16px] font-semibold tracking-tight text-main">
              Edit Media Details
            </h2>
            <p className="text-xs text-muted-theme mt-0.5">
              Update information, synopsis, link, or status
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-muted-theme hover:text-accent-theme hover:bg-accent-light-theme transition-colors apple-press cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Media Type Segmented Tabs */}
        <div className="px-6 pt-3.5 pb-1">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-black/[0.04] dark:bg-white/[0.06] border border-black/[0.04] dark:border-white/[0.04]">
            <button
              type="button"
              onClick={() => setMediaType("BOOK")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                mediaType === "BOOK"
                  ? "bg-white dark:bg-[#2c2c2e] text-main shadow-2xs font-semibold"
                  : "text-muted-theme hover:text-main"
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              <span>Book</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType("VIDEO")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
                mediaType === "VIDEO"
                  ? "bg-white dark:bg-[#2c2c2e] text-main shadow-2xs font-semibold"
                  : "text-muted-theme hover:text-main"
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              <span>Video / YouTube</span>
            </button>
            <button
              type="button"
              onClick={() => setMediaType("PODCAST")}
              className={`flex items-center justify-center gap-1.5 py-1.5 rounded-xl text-xs font-medium transition-all cursor-pointer ${
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

        {/* Form Body */}
        <div className="p-6 overflow-y-auto space-y-3.5">
          {error && (
            <div className="p-3 text-xs font-medium rounded-2xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5">
            {/* Reference URL */}
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
                  placeholder="https://..."
                  className="w-full pl-9 pr-3 py-1.5 rounded-xl apple-input text-main text-xs focus:outline-hidden"
                />
              </div>
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
                    <span className="text-[10px]">No Cover</span>
                  </div>
                )}
              </div>

              {/* Title & Creator */}
              <div className="flex-1 space-y-2.5 min-w-0">
                <div>
                  <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider mb-1">
                    {mediaType === "VIDEO"
                      ? "Video Title *"
                      : mediaType === "PODCAST"
                      ? "Episode Title *"
                      : "Title *"}
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
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
                    className="w-full px-3 py-1.5 rounded-xl apple-input text-main text-xs focus:outline-hidden"
                  />
                </div>
              </div>
            </div>

            {/* Total Pages / Duration & Status */}
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

            {/* Description / Summary Field */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-[11px] font-semibold text-muted-theme uppercase tracking-wider">
                  {mediaType === "BOOK"
                    ? "Synopsis / Book Description"
                    : mediaType === "VIDEO"
                    ? "Video Summary / Key Topics"
                    : "Podcast Episode Overview"}
                </label>
                {description.length > 0 && (
                  <span className="text-[10px] text-muted-theme">
                    {description.length} chars
                  </span>
                )}
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Synopsis, key themes, or why you're tracking this media..."
                rows={3}
                className="w-full px-3 py-2 rounded-xl apple-input text-main text-xs resize-none focus:outline-hidden leading-relaxed"
              />
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
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl text-xs font-medium text-muted-theme hover:bg-black/[0.04] dark:hover:bg-white/[0.06] hover:text-main transition-colors apple-press cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-4.5 py-1.5 rounded-xl bg-accent-theme hover:bg-accent-hover-theme text-white text-xs font-semibold shadow-xs transition-all apple-press cursor-pointer disabled:opacity-50"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSubmitting ? "Saving..." : "Save Changes"}</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body
  );
}
