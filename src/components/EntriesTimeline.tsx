"use client";

import React, { useState, useMemo } from "react";
import {
  MessageSquare,
  Calendar,
  Bookmark,
  ChevronDown,
  ChevronUp,
  User,
  Bot,
  Trash2,
  AlertCircle,
  Search,
  X,
  BookOpen,
  Video,
  Headphones,
} from "lucide-react";
import { addAiMessageToEntry, deleteStoredEntry } from "@/lib/storage";

interface AiMessage {
  id: string;
  sender: string; // "USER" | "AI"
  message: string;
  createdAt: string;
}

export interface EntryItem {
  id: string;
  content: string;
  pageNumber: string | null;
  createdAt: string;
  bookId?: string;
  book?: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    status: string;
    type?: string;
    url?: string | null;
  };
  aiThreads: AiMessage[];
}

interface EntriesTimelineProps {
  entries: EntryItem[];
  onRefresh: () => void;
  activeBookTitle?: string | null;
}

export default function EntriesTimeline({
  entries,
  onRefresh,
  activeBookTitle,
}: EntriesTimelineProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedThreads, setExpandedThreads] = useState<Record<string, boolean>>({});
  const [replyText, setReplyText] = useState<Record<string, string>>({});
  const [isSendingReply, setIsSendingReply] = useState<Record<string, boolean>>({});
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<Record<string, boolean>>({});

  const toggleThread = (entryId: string) => {
    setExpandedThreads((prev) => ({
      ...prev,
      [entryId]: !prev[entryId],
    }));
  };

  const handleSendReply = async (entryId: string) => {
    const text = replyText[entryId];
    if (!text || !text.trim()) return;

    const trimmed = text.trim();
    const entry = entries.find((e) => e.id === entryId);

    // 1. Optimistically append user message to local entry
    addAiMessageToEntry(entryId, "USER", trimmed);
    setReplyText((prev) => ({ ...prev, [entryId]: "" }));
    onRefresh();

    setIsSendingReply((prev) => ({ ...prev, [entryId]: true }));

    try {
      const res = await fetch(`/api/entries/${entryId}/ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          bookTitle: entry?.book?.title || "Book",
          bookAuthor: entry?.book?.author || null,
          entryContent: entry?.content || "",
          pageNumber: entry?.pageNumber || null,
          previousMessages:
            entry?.aiThreads?.map((m) => ({
              sender: m.sender,
              message: m.message,
            })) || [],
        }),
      });

      if (res.ok) {
        const data = await res.json();
        const replyContent = data.reply || data.aiMessage?.message;
        if (replyContent) {
          addAiMessageToEntry(entryId, "AI", replyContent);
          onRefresh();
        }
      }
    } catch (err) {
      console.error("Sparring reply error:", err);
    } finally {
      setIsSendingReply((prev) => ({ ...prev, [entryId]: false }));
    }
  };

  const handleDeleteEntry = (entryId: string) => {
    setIsDeleting((prev) => ({ ...prev, [entryId]: true }));
    try {
      deleteStoredEntry(entryId);
      setConfirmDeleteId(null);
      onRefresh();
      if (typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("entry-saved"));
      }
    } catch (err) {
      console.error("Failed to delete entry:", err);
      alert("Error occurred while deleting");
    } finally {
      setIsDeleting((prev) => ({ ...prev, [entryId]: false }));
    }
  };

  // Filter entries based on search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase().trim();
    return entries.filter((entry) => {
      const contentMatch = entry.content.toLowerCase().includes(q);
      const pageMatch = entry.pageNumber?.toLowerCase().includes(q);
      const bookMatch = entry.book?.title.toLowerCase().includes(q);
      const aiMatch = entry.aiThreads?.some((m) =>
        m.message.toLowerCase().includes(q)
      );
      return contentMatch || pageMatch || bookMatch || aiMatch;
    });
  }, [entries, searchQuery]);

  // Group filtered entries by date
  const groupedEntries: { [dateStr: string]: EntryItem[] } = {};
  filteredEntries.forEach((entry) => {
    const date = new Date(entry.createdAt);
    const dateKey = date.toLocaleDateString("en-US", {
      weekday: "short",
      year: "numeric",
      month: "short",
      day: "numeric",
    });
    if (!groupedEntries[dateKey]) {
      groupedEntries[dateKey] = [];
    }
    groupedEntries[dateKey].push(entry);
  });

  return (
    <div className="flex flex-col gap-4">
      {/* Header Bar with Apple Spotlight Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-subtle-theme">
        <div className="flex items-center gap-2">
          <h2 className="text-[15px] font-semibold tracking-tight text-main">
            Reading Journal
          </h2>
          <span className="text-[11px] font-medium apple-badge-neutral px-2.5 py-0.5 rounded-full">
            {filteredEntries.length} {filteredEntries.length === 1 ? "note" : "notes"}
          </span>
          {activeBookTitle && (
            <span className="text-xs text-muted-theme hidden md:inline">
              in <span className="text-main font-medium">{activeBookTitle}</span>
            </span>
          )}
        </div>

        {/* Apple Spotlight Search Bar */}
        <div className="relative w-full sm:w-72">
          <Search className="w-3.5 h-3.5 text-muted-theme absolute left-3 top-2.5" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, quotes, or AI chats..."
            className="w-full pl-8.5 pr-8 py-1.5 rounded-full bg-white dark:bg-white/[0.06] border border-black/[0.08] dark:border-white/[0.08] shadow-2xs focus:border-accent-theme text-main text-xs placeholder:text-muted-theme/60 focus:outline-hidden transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-2.5 top-2 p-0.5 rounded-full text-muted-theme hover:text-main cursor-pointer"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* Empty State when no notes match search */}
      {entries.length > 0 && filteredEntries.length === 0 && (
        <div className="text-center py-10 px-4 apple-card">
          <Search className="w-7 h-7 text-muted-theme/40 mx-auto mb-2" />
          <p className="text-xs font-medium text-main">
            No notes matching "{searchQuery}"
          </p>
          <button
            onClick={() => setSearchQuery("")}
            className="mt-2 text-xs font-semibold text-[#0071e3] hover:underline cursor-pointer"
          >
            Clear search filter
          </button>
        </div>
      )}

      {/* Empty State when zero total entries */}
      {entries.length === 0 && (
        <div className="text-center py-12 px-4 apple-card">
          <MessageSquare className="w-8 h-8 text-muted-theme/40 mx-auto mb-2" />
          <h3 className="text-sm font-semibold text-main">
            No reading reflections logged yet
          </h3>
          <p className="text-xs text-muted-theme mt-1 max-w-sm mx-auto">
            Use the quick log form above to record your first takeaway and discuss with your AI sparring partner.
          </p>
        </div>
      )}

      {/* Date-Grouped Timeline Feed */}
      {Object.entries(groupedEntries).map(([dateGroup, items]) => (
        <div key={dateGroup} className="flex flex-col gap-3">
          {/* Apple Sticky Date Pill */}
          <div className="sticky top-16 z-20 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-medium bg-white/80 dark:bg-[#2c2c2e]/80 backdrop-blur-xl border border-white/80 dark:border-white/[0.1] text-main shadow-2xs">
              <Calendar className="w-3.5 h-3.5 text-accent-theme" />
              {dateGroup}
            </span>
            <div className="h-px flex-1 bg-black/[0.06] dark:bg-white/[0.06]" />
          </div>

          {/* Cards for this Date */}
          <div className="flex flex-col gap-2.5 pl-3 border-l border-black/[0.08] dark:border-white/[0.08] ml-3">
            {items.map((entry) => {
              const isExpanded = expandedThreads[entry.id] ?? false;
              const aiMessages = entry.aiThreads || [];
              const timeString = new Date(entry.createdAt).toLocaleTimeString("en-US", {
                hour: "numeric",
                minute: "2-digit",
              });

              return (
                <div
                  key={entry.id}
                  className="apple-card p-4 flex flex-col gap-2.5 transition-all"
                >
                  {/* Card Header */}
                  <div className="flex items-center justify-between gap-2 text-xs text-muted-theme">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-medium text-main text-[11px]">{timeString}</span>

                      {/* Media badge if viewing across all media */}
                      {entry.book && (!activeBookTitle || activeBookTitle === "All Media" || activeBookTitle === "All Books") && (
                        <span className="inline-flex items-center gap-1 text-[11px] font-medium text-main apple-badge-neutral px-2.5 py-0.5 rounded-full">
                          {entry.book.type === "VIDEO" ? (
                            <Video className="w-2.5 h-2.5 text-red-500" />
                          ) : entry.book.type === "PODCAST" ? (
                            <Headphones className="w-2.5 h-2.5 text-purple-500" />
                          ) : (
                            <BookOpen className="w-2.5 h-2.5 text-accent-theme" />
                          )}
                          <span className="truncate max-w-[140px]">{entry.book.title}</span>
                        </span>
                      )}

                      {entry.pageNumber && (
                        <span className="inline-flex items-center gap-1 bg-accent-light-theme text-accent-tint border border-accent-border-theme px-2 py-0.5 rounded-full font-medium text-[10px]">
                          <Bookmark className="w-2.5 h-2.5" />
                          {entry.pageNumber}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {aiMessages.length > 0 && (
                        <button
                          onClick={() => toggleThread(entry.id)}
                          className={`flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-medium transition-colors border apple-press cursor-pointer ${
                            isExpanded
                              ? "bg-accent-light-theme text-accent-tint border-accent-border-theme"
                              : "text-main border-subtle-theme hover:bg-accent-light-theme hover:text-accent-tint hover:border-accent-border-theme"
                          }`}
                        >
                          <span>
                            AI Discussion ({aiMessages.length})
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3 text-accent-theme" />
                          ) : (
                            <ChevronDown className="w-3 h-3 text-muted-theme" />
                          )}
                        </button>
                      )}

                      {/* Delete button */}
                      <button
                        onClick={() => setConfirmDeleteId(entry.id)}
                        title="Delete note"
                        className="p-1.5 rounded-full text-muted-theme hover:text-red-500 hover:bg-red-500/10 transition-colors apple-press cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Confirmation banner if delete requested */}
                  {confirmDeleteId === entry.id && (
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>Delete this reflection note and AI thread?</span>
                      </div>
                      <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          disabled={isDeleting[entry.id]}
                          className="px-2.5 py-0.5 rounded-lg text-xs bg-surface border border-theme text-main hover:bg-surface-elevated apple-press cursor-pointer"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleDeleteEntry(entry.id)}
                          disabled={isDeleting[entry.id]}
                          className="px-3 py-0.5 rounded-lg text-xs bg-red-600 text-white font-medium hover:bg-red-700 apple-press cursor-pointer disabled:opacity-50"
                        >
                          {isDeleting[entry.id] ? "..." : "Delete"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Note Reflection Content */}
                  <div className="text-xs sm:text-sm text-main leading-relaxed font-sans whitespace-pre-wrap">
                    {entry.content}
                  </div>

                  {/* AI Discussion Thread (Apple iMessage style) */}
                  {aiMessages.length > 0 && isExpanded && (
                    <div className="mt-1 pt-3.5 border-t border-black/[0.06] dark:border-white/[0.08] flex flex-col gap-3 bg-black/[0.025] dark:bg-white/[0.03] -mx-4 -mb-4 p-4 rounded-b-2xl">
                      {/* Header with icon and clear title */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-md bg-accent-light-theme text-accent-theme flex items-center justify-center shrink-0">
                            <Bot className="w-3.5 h-3.5" />
                          </div>
                          <span className="text-xs sm:text-[13px] font-semibold text-main">
                            AI Sparring Discussion
                          </span>
                        </div>
                        <span className="text-[11px] font-medium text-muted-theme">
                          {aiMessages.length} {aiMessages.length === 1 ? "reflection" : "reflections"}
                        </span>
                      </div>

                      {/* Dialogue messages */}
                      <div className="flex flex-col gap-2.5">
                        {aiMessages.map((msg) => (
                          <div
                            key={msg.id}
                            className={`flex gap-3 leading-relaxed p-3.5 rounded-2xl border transition-all ${
                              msg.sender === "AI"
                                ? "bg-white/95 dark:bg-[#2c2c2e]/95 border-black/[0.08] dark:border-white/[0.1] text-main shadow-xs"
                                : "bg-accent-light-theme/80 border-accent-border-theme text-main ml-3 sm:ml-6 shadow-xs"
                            }`}
                          >
                            <div className="shrink-0 mt-0.5">
                              {msg.sender === "AI" ? (
                                <div className="w-7 h-7 rounded-full bg-accent-light-theme text-accent-theme flex items-center justify-center shadow-xs">
                                  <Bot className="w-4 h-4" />
                                </div>
                              ) : (
                                <div className="w-7 h-7 rounded-full bg-black/[0.06] dark:bg-white/[0.12] text-main flex items-center justify-center shadow-xs">
                                  <User className="w-4 h-4" />
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1.5 gap-2">
                                <span className="font-semibold text-xs text-main">
                                  {msg.sender === "AI" ? "AI Reading Buddy" : "You"}
                                </span>
                                <span className="text-[11px] font-medium text-muted-theme shrink-0">
                                  {new Date(msg.createdAt).toLocaleTimeString("en-US", {
                                    hour: "numeric",
                                    minute: "2-digit",
                                  })}
                                </span>
                              </div>
                              <p className="text-main leading-relaxed whitespace-pre-wrap text-[13px] sm:text-sm font-normal">
                                {msg.message}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Reply Box */}
                      <div className="mt-1 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex gap-2">
                        <input
                          type="text"
                          placeholder="Reply to AI reading buddy..."
                          value={replyText[entry.id] || ""}
                          onChange={(e) =>
                            setReplyText((prev) => ({
                              ...prev,
                              [entry.id]: e.target.value,
                            }))
                          }
                          onKeyDown={(e) => {
                            if (e.key === "Enter" && !e.shiftKey) {
                              e.preventDefault();
                              handleSendReply(entry.id);
                            }
                          }}
                          className="flex-1 px-3.5 py-2 rounded-xl bg-white dark:bg-white/[0.06] border border-black/[0.1] dark:border-white/[0.12] text-main text-xs sm:text-[13px] placeholder:text-muted-theme focus:outline-hidden focus:border-accent-theme transition-colors shadow-2xs"
                        />
                        <button
                          onClick={() => handleSendReply(entry.id)}
                          disabled={
                            isSendingReply[entry.id] ||
                            !replyText[entry.id] ||
                            !replyText[entry.id]?.trim()
                          }
                          className="px-4 py-2 rounded-xl bg-accent-theme hover:bg-accent-hover-theme text-white font-medium text-xs sm:text-[13px] shadow-xs transition-all apple-press disabled:opacity-40 cursor-pointer shrink-0"
                        >
                          {isSendingReply[entry.id] ? "Sending..." : "Reply"}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
