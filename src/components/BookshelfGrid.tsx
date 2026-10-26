"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BookOpen, BookText, CheckCircle2, PauseCircle, Clock, Book as BookIcon } from "lucide-react";

export interface BookItem {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  totalPages: number | null;
  status: string; // READING, COMPLETED, ON_HOLD
  entriesCount: number;
  lastReadAt: string | null;
  lastPage: string | null;
}

interface BookshelfGridProps {
  books: BookItem[];
  loading: boolean;
}

export default function BookshelfGrid({ books, loading }: BookshelfGridProps) {
  const [filter, setFilter] = useState<string>("ALL");

  const filteredBooks = books.filter((b) => {
    if (filter === "ALL") return true;
    return b.status === filter;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "READING":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-accent-light-theme text-accent-tint border border-accent-border-theme">
            <span className="w-1.5 h-1.5 rounded-full bg-accent-theme animate-ping" />
            Reading
          </span>
        );
      case "COMPLETED":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-3 h-3" />
            Completed
          </span>
        );
      case "ON_HOLD":
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wider uppercase bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20">
            <PauseCircle className="w-3 h-3" />
            On Hold
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Status Filter Tabs */}
      <div className="flex items-center justify-between flex-wrap gap-3 pb-2 border-b border-subtle-theme">
        <div className="flex items-center gap-1.5 bg-surface-elevated p-1 rounded-xl border border-subtle-theme text-xs font-medium">
          {[
            { id: "ALL", label: "All Books", count: books.length },
            { id: "READING", label: "Reading", count: books.filter((b) => b.status === "READING").length },
            { id: "COMPLETED", label: "Completed", count: books.filter((b) => b.status === "COMPLETED").length },
            { id: "ON_HOLD", label: "On Hold", count: books.filter((b) => b.status === "ON_HOLD").length },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-3 py-1.5 rounded-lg transition-all ${
                filter === tab.id
                  ? "bg-surface text-main font-bold shadow-xs border border-subtle-theme"
                  : "text-muted-theme hover:text-main"
              }`}
            >
              {tab.label}{" "}
              <span className="text-[10px] opacity-70 ml-1">({tab.count})</span>
            </button>
          ))}
        </div>

        <div className="text-xs text-muted-theme font-medium">
          Showing {filteredBooks.length} {filteredBooks.length === 1 ? "book" : "books"}
        </div>
      </div>

      {/* Loading Skeleton */}
      {loading && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div
              key={i}
              className="h-56 rounded-xl bg-surface-elevated/60 animate-pulse border border-subtle-theme"
            />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && filteredBooks.length === 0 && (
        <div className="text-center py-12 px-4 bg-surface rounded-2xl border border-dashed border-subtle-theme">
          <BookIcon className="w-10 h-10 text-muted-theme mx-auto mb-2 opacity-40" />
          <h3 className="font-serif font-bold text-base text-main mb-1">
            Belum ada buku di kategori ini
          </h3>
          <p className="text-xs text-muted-theme max-w-sm mx-auto mb-3">
            {filter === "ALL"
              ? "Rak bukumu masih kosong. Tambahkan buku baru melalui pencarian Google Books di atas!"
              : `Kamu belum memiliki buku dengan status '${filter.toLowerCase()}'.`}
          </p>
        </div>
      )}

      {/* Book Grid */}
      {!loading && filteredBooks.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-4">
          {filteredBooks.map((book) => (
            <Link
              key={book.id}
              href={`/books/${book.id}`}
              className="group relative flex flex-col bg-surface rounded-xl border border-theme p-2.5 sm:p-3 card-hover-effect overflow-hidden"
            >
              {/* Cover & Spine Mockup */}
              <div className="relative aspect-[3/4] w-full rounded-lg overflow-hidden bg-surface-elevated mb-2.5 shadow-2xs border border-subtle-theme flex items-center justify-center group-hover:shadow-xs transition-shadow">
                {book.coverUrl ? (
                  <img
                    src={book.coverUrl}
                    alt={book.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                ) : (
                  <div className="w-full h-full p-2.5 flex flex-col items-center justify-center text-center bg-gradient-to-br from-surface-elevated to-surface">
                    <BookOpen className="w-6 h-6 text-accent-theme/40 mb-1.5" />
                    <span className="font-serif font-bold text-[11px] text-main line-clamp-2">
                      {book.title}
                    </span>
                    <span className="text-[9px] text-muted-theme mt-0.5 line-clamp-1">
                      {book.author || "Penulis"}
                    </span>
                  </div>
                )}

                {/* Status Badge overlay */}
                <div className="absolute top-1.5 right-1.5 scale-90 origin-top-right">
                  {getStatusBadge(book.status)}
                </div>

                {/* Subtle book spine edge highlight */}
                <div className="absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-black/20 to-transparent pointer-events-none" />
              </div>

              {/* Book Info */}
              <div className="flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="font-serif font-bold text-xs sm:text-sm text-main line-clamp-1 group-hover:text-accent-theme transition-colors">
                    {book.title}
                  </h3>
                  <p className="text-[11px] text-muted-theme mt-0.5 line-clamp-1">
                    {book.author || "Unknown Author"}
                  </p>
                </div>

                <div className="mt-2 pt-2 border-t border-subtle-theme flex items-center justify-between text-[10px] text-muted-theme">
                  <div className="flex items-center gap-1 font-medium">
                    <BookText className="w-3 h-3 text-accent-theme" />
                    <span>
                      {book.entriesCount} {book.entriesCount === 1 ? "note" : "notes"}
                    </span>
                  </div>

                  {book.lastPage && (
                    <span className="text-[9px] font-semibold bg-surface-elevated px-1.5 py-0.5 rounded text-main line-clamp-1 max-w-[70px]">
                      {book.lastPage}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
