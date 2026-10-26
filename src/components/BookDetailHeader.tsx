"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Trash2,
  Clock,
  PauseCircle,
  FileText,
  AlertCircle,
  Loader2,
} from "lucide-react";
import { updateStoredBook, deleteStoredBook } from "@/lib/storage";

interface BookDetailHeaderProps {
  book: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    totalPages: number | null;
    status: string;
    entries: any[];
  };
  onBookUpdated: () => void;
}

export default function BookDetailHeader({ book, onBookUpdated }: BookDetailHeaderProps) {
  const router = useRouter();
  const [isUpdating, setIsUpdating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleStatusChange = (newStatus: string) => {
    setIsUpdating(true);
    try {
      updateStoredBook(book.id, { status: newStatus as any });
      onBookUpdated();
    } catch (e) {
      console.error("Status update error:", e);
    } finally {
      setIsUpdating(false);
    }
  };

  const handleDelete = () => {
    setIsDeleting(true);
    try {
      deleteStoredBook(book.id);
      router.push("/");
    } catch (e) {
      console.error("Delete error:", e);
    } finally {
      setIsDeleting(false);
    }
  };

  const toggleFinished = () => {
    const nextStatus = book.status === "COMPLETED" ? "READING" : "COMPLETED";
    handleStatusChange(nextStatus);
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Back button & top bar */}
      <div className="flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-xs font-semibold text-muted-theme hover:text-main transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
          <span>Back to Bookshelf</span>
        </Link>

        {/* Delete Book action */}
        <div>
          {!showDeleteConfirm ? (
            <button
              onClick={() => setShowDeleteConfirm(true)}
              className="text-xs text-muted-theme hover:text-red-500 transition-colors p-1.5 rounded-lg hover:bg-surface-elevated"
              title="Delete book and journals"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          ) : (
            <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg">
              <span className="text-[11px] font-semibold text-red-600 dark:text-red-400">
                Delete book & entries?
              </span>
              <button
                onClick={handleDelete}
                disabled={isDeleting}
                className="text-[11px] font-bold text-red-600 hover:underline cursor-pointer"
              >
                {isDeleting ? "Deleting..." : "Yes"}
              </button>
              <button
                onClick={() => setShowDeleteConfirm(false)}
                className="text-[11px] font-medium text-muted-theme hover:underline cursor-pointer"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Book Card */}
      <div className="bg-surface border border-theme rounded-2xl p-4 sm:p-5 shadow-xs flex flex-col sm:flex-row gap-5 items-start">
        {/* Book Cover */}
        <div className="w-24 sm:w-28 aspect-[3/4] bg-surface-elevated rounded-xl overflow-hidden border border-subtle-theme shrink-0 shadow-xs relative group">
          {book.coverUrl ? (
            <img
              src={book.coverUrl}
              alt={book.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center p-3 text-center bg-gradient-to-br from-surface-elevated to-surface">
              <BookOpen className="w-7 h-7 text-accent-theme/40 mb-1" />
              <span className="font-serif font-bold text-[11px] text-main line-clamp-2">
                {book.title}
              </span>
            </div>
          )}
          <div className="absolute inset-y-0 left-0 w-1.5 bg-gradient-to-r from-black/25 to-transparent pointer-events-none" />
        </div>

        {/* Book Details */}
        <div className="flex-1 flex flex-col justify-between h-full w-full">
          <div>
            <div className="flex items-center gap-1.5 flex-wrap mb-1.5">
              {/* Status Selector */}
              <select
                value={book.status}
                disabled={isUpdating}
                onChange={(e) => handleStatusChange(e.target.value)}
                className="px-2 py-0.5 rounded-full text-[11px] font-bold tracking-wider uppercase bg-surface-elevated border border-subtle-theme text-main focus:outline-hidden focus:border-accent-theme"
              >
                <option value="READING">Reading</option>
                <option value="COMPLETED">Completed</option>
                <option value="ON_HOLD">On Hold</option>
              </select>

              {book.totalPages && (
                <span className="text-[11px] text-muted-theme font-medium bg-surface-elevated px-2 py-0.5 rounded-full border border-subtle-theme">
                  {book.totalPages} Pages
                </span>
              )}

              <span className="text-[11px] text-muted-theme font-medium bg-surface-elevated px-2 py-0.5 rounded-full border border-subtle-theme">
                {book.entries.length} {book.entries.length === 1 ? "Note" : "Notes"}
              </span>
            </div>

            <h1 className="font-serif font-bold text-xl sm:text-2xl text-main leading-tight">
              {book.title}
            </h1>
            <p className="text-xs font-medium text-muted-theme mt-0.5">
              by {book.author || "Unknown Author"}
            </p>
          </div>

          {/* Action Row */}
          <div className="mt-4 pt-3.5 border-t border-subtle-theme flex items-center justify-between flex-wrap gap-3">
            <div className="text-[11px] text-muted-theme">
              {book.entries.length > 0 ? (
                <span>
                  Last reflection:{" "}
                  <strong className="text-main">
                    {new Date(book.entries[0].createdAt).toLocaleDateString("en-US", {
                      month: "short",
                      day: "numeric",
                    })}
                  </strong>
                </span>
              ) : (
                <span>No reflections logged yet.</span>
              )}
            </div>

            {/* "Mark as Finished" Toggle Button */}
            <button
              onClick={toggleFinished}
              disabled={isUpdating}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all shadow-xs active:scale-95 cursor-pointer ${
                book.status === "COMPLETED"
                  ? "bg-surface-elevated text-muted-theme hover:text-main border border-subtle-theme"
                  : "bg-accent-theme hover:bg-accent-theme/90 text-white"
              }`}
            >
              {isUpdating ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <CheckCircle2 className="w-3 h-3" />
              )}
              <span>
                {book.status === "COMPLETED" ? "Tandai Sedang Dibaca" : "Selesai Membaca"}
              </span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
