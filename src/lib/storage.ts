/**
 * OmniLog Client-Side Storage Engine (localStorage)
 * Modeled after mindscribe-writing for 100% serverless compatibility on Vercel.
 * Provides instant reactivity, offline support, and zero database setup required.
 */

export interface Book {
  id: string;
  title: string;
  author: string | null;
  coverUrl: string | null;
  totalPages: number | null;
  type: "BOOK" | "VIDEO" | "PODCAST";
  url: string | null;
  status: "READING" | "COMPLETED" | "ON_HOLD";
  createdAt: string;
  updatedAt: string;
  entriesCount?: number;
  lastReadAt?: string | null;
  lastPage?: string | null;
  entries?: Entry[];
}

export interface AiMessage {
  id: string;
  entryId: string;
  sender: "USER" | "AI";
  message: string;
  createdAt: string;
}

export interface Entry {
  id: string;
  bookId: string;
  content: string;
  pageNumber: string | null;
  createdAt: string;
  book?: {
    id: string;
    title: string;
    author: string | null;
    coverUrl: string | null;
    type: string;
  };
  aiThreads?: AiMessage[];
}

export interface UserPreferences {
  themeMode: "light" | "dark" | "system";
  themeColor: "slate" | "amber" | "rose" | "custom1" | "custom2" | "custom3";
  customColor1: string;
  customColor2: string;
  customColor3: string;
  reminderEmail: string;
  reminderTime: string;
  isReminderActive: boolean;
  smtpUser?: string;
  smtpPass?: string;
}

export interface StreakStats {
  streak: number;
  hasLoggedToday: boolean;
  totalEntries: number;
  activeBooksCount: number;
  activeDates: string[];
  dailyCounts: Record<string, number>;
  dailyActivity: Record<string, { count: number; types: string[] }>;
}

export interface WeeklyDigest {
  id: string;
  title: string;
  executiveSummary: string;
  coreThemes: string[];
  takeaways: string[];
  questionsToPonder: string[];
  readingMomentum: string | null;
  entriesAnalyzed: number;
  booksCovered: string[];
  createdAt: string;
}

const STORAGE_KEYS = {
  INITIALIZED: "omnilog_initialized_v1",
  BOOKS: "omnilog_books",
  ENTRIES: "omnilog_entries",
  PREFERENCES: "omnilog_preferences",
  WEEKLY_DIGESTS: "omnilog_digests",
};

// Initial Seed Data (Identical to prisma/seed.js)
function getInitialSeedData() {
  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);
  const threeDaysAgo = new Date(Date.now() - 72 * 60 * 60 * 1000);

  const book1Id = "book-thinking-fast-and-slow";
  const book2Id = "book-atomic-habits";
  const book3Id = "book-klara-and-the-sun";

  const books: Book[] = [
    {
      id: book1Id,
      title: "Thinking, Fast and Slow",
      author: "Daniel Kahneman",
      coverUrl: "https://books.google.com/books/content?id=ZuODsbCRqRQC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
      totalPages: 499,
      type: "BOOK",
      url: null,
      status: "READING",
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: now.toISOString(),
    },
    {
      id: book2Id,
      title: "Atomic Habits",
      author: "James Clear",
      coverUrl: "https://books.google.com/books/content?id=fFCjDQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
      totalPages: 320,
      type: "BOOK",
      url: null,
      status: "COMPLETED",
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: twoDaysAgo.toISOString(),
    },
    {
      id: book3Id,
      title: "Klara and the Sun",
      author: "Kazuo Ishiguro",
      coverUrl: "https://books.google.com/books/content?id=B5j2DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
      totalPages: 303,
      type: "BOOK",
      url: null,
      status: "ON_HOLD",
      createdAt: threeDaysAgo.toISOString(),
      updatedAt: threeDaysAgo.toISOString(),
    },
  ];

  const entries: Entry[] = [
    {
      id: "entry-1",
      bookId: book1Id,
      content:
        "Kahneman introduces the two agents of the mind: System 1 (fast, intuitive, emotional, automatic) and System 2 (slow, deliberate, analytical). What struck me most is that System 1 cannot be turned off at will. Even when we believe we are acting purely on logic, our System 2 is often merely rationalizing an instinctual snapshot already framed by System 1.",
      pageNumber: "pp. 19-48",
      createdAt: now.toISOString(),
      aiThreads: [
        {
          id: "msg-1-1",
          entryId: "entry-1",
          sender: "AI",
          message:
            "Pemahaman Anda terhadap konsep Sistem 1 dan Sistem 2 Kahneman sudah sangat tajam dan tepat sasaran! Sistem 2 memang sering kali hanya bertindak sebagai 'juru bicara pembela' daripada hakim yang sepenuhnya objektif.\n\nKira-kira menurutmu, dalam situasi darurat seperti dokter IGD yang harus mengambil keputusan dalam 2 detik, apakah keputusan kilat itu murni bias Sistem 1, atau intuisi terlatih yang sebenarnya valid?",
          createdAt: new Date(now.getTime() + 10000).toISOString(),
        },
        {
          id: "msg-1-2",
          entryId: "entry-1",
          sender: "USER",
          message:
            "Saya rasa latihan mendalam menginternalisasikan aturan Sistem 2 ke refleks Sistem 1, mengubah kalkulasi menjadi pengenalan pola terlatih.",
          createdAt: new Date(now.getTime() + 60000).toISOString(),
        },
        {
          id: "msg-1-3",
          entryId: "entry-1",
          sender: "AI",
          message:
            "Tepat sekali! Itu sejalan dengan teori Naturalistic Decision-Making dari Gary Klein. Namun ada catatan krusial dari Kahneman: pengenalan pola hanya bisa dipercaya jika lingkungannya stabil dengan umpan balik cepat dan objektif.",
          createdAt: new Date(now.getTime() + 75000).toISOString(),
        },
      ],
    },
    {
      id: "entry-2",
      bookId: book1Id,
      content:
        "Explored Prospect Theory and loss aversion. The psychological pain of losing $100 is roughly twice as intense as the joy of winning $100. This explains why people cling to failing investments and avoid calculated risks that possess positive expected value.",
      pageNumber: "pp. 280-310",
      createdAt: yesterday.toISOString(),
      aiThreads: [
        {
          id: "msg-2-1",
          entryId: "entry-2",
          sender: "AI",
          message:
            "Sintesis yang sangat akurat tentang loss aversion. Jika secara evolusioner ketakutan akan kehilangan ini berguna untuk bertahan hidup di alam liar, mekanisme apa yang bisa kita pasang hari ini agar bias ini tidak menghambat kita mengambil peluang strategis jangka panjang?",
          createdAt: new Date(yesterday.getTime() + 15000).toISOString(),
        },
      ],
    },
    {
      id: "entry-3",
      bookId: book2Id,
      content:
        "You do not rise to the level of your goals; you fall to the level of your systems. Clear argues that outcome-based habits fail because identity shift is what produces sustained behavior. Environment design matters far more than willpower.",
      pageNumber: "pp. 55-82",
      createdAt: twoDaysAgo.toISOString(),
      aiThreads: [
        {
          id: "msg-3-1",
          entryId: "entry-3",
          sender: "AI",
          message:
            "Kutipan yang sangat fundamental dari James Clear. Mengubah arsitektur lingkungan jauh lebih hemat energi daripada menguras willpower setiap hari.",
          createdAt: new Date(twoDaysAgo.getTime() + 20000).toISOString(),
        },
      ],
    },
    {
      id: "entry-4",
      bookId: book3Id,
      content:
        "Ishiguro explores loneliness and what it means to love through Klara, an Artificial Friend who perceives human emotions with profound innocence and acute observation.",
      pageNumber: "Ch. 2-3",
      createdAt: threeDaysAgo.toISOString(),
      aiThreads: [],
    },
  ];

  return { books, entries };
}

export function initializeStorageIfNeeded(): void {
  if (typeof window === "undefined") return;

  const isInitialized = localStorage.getItem(STORAGE_KEYS.INITIALIZED);
  if (!isInitialized) {
    const { books, entries } = getInitialSeedData();
    localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
    localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
    localStorage.setItem(STORAGE_KEYS.INITIALIZED, "true");
  }
}

// Helper: dispatch custom event to notify components across the app
function notifyUpdate() {
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("omnilog-storage-updated"));
    window.dispatchEvent(new CustomEvent("entry-saved"));
  }
}

// -------------------------------------------------------------
// BOOKS CRUD
// -------------------------------------------------------------

export function getStoredBooks(): Book[] {
  if (typeof window === "undefined") return [];
  initializeStorageIfNeeded();

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.BOOKS);
    const books: Book[] = raw ? JSON.parse(raw) : [];
    const entries = getStoredEntries();

    // Enrich with computed fields
    const enriched = books.map((b) => {
      const bookEntries = entries.filter((e) => e.bookId === b.id);
      const sortedEntries = [...bookEntries].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
      return {
        ...b,
        entriesCount: bookEntries.length,
        lastReadAt: sortedEntries[0]?.createdAt ?? null,
        lastPage: sortedEntries[0]?.pageNumber ?? null,
        entries: sortedEntries,
      };
    });

    // Sort by latest updated
    return enriched.sort(
      (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
  } catch (err) {
    console.error("Error loading books from localStorage:", err);
    return [];
  }
}

export function getStoredBookById(id: string): Book | null {
  const books = getStoredBooks();
  return books.find((b) => b.id === id) || null;
}

export function saveNewBook(data: {
  title: string;
  author?: string | null;
  coverUrl?: string | null;
  totalPages?: number | null;
  type?: "BOOK" | "VIDEO" | "PODCAST";
  url?: string | null;
  status?: "READING" | "COMPLETED" | "ON_HOLD";
}): Book {
  if (typeof window === "undefined") {
    throw new Error("Cannot save book on server");
  }

  const books = getStoredBooks();
  const now = new Date().toISOString();
  const id = `book-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const newBook: Book = {
    id,
    title: data.title.trim(),
    author: data.author ? data.author.trim() : null,
    coverUrl: data.coverUrl ? data.coverUrl.trim() : null,
    totalPages: data.totalPages || null,
    type: data.type || "BOOK",
    url: data.url ? data.url.trim() : null,
    status: data.status || "READING",
    createdAt: now,
    updatedAt: now,
    entriesCount: 0,
    lastReadAt: null,
    lastPage: null,
    entries: [],
  };

  const updatedBooks = [newBook, ...books];
  localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(updatedBooks));
  notifyUpdate();
  return newBook;
}

export function updateStoredBook(id: string, updates: Partial<Book>): Book | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEYS.BOOKS);
  const books: Book[] = raw ? JSON.parse(raw) : [];
  const idx = books.findIndex((b) => b.id === id);
  if (idx === -1) return null;

  const updatedBook = {
    ...books[idx],
    ...updates,
    updatedAt: new Date().toISOString(),
  };

  books[idx] = updatedBook;
  localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(books));
  notifyUpdate();
  return updatedBook;
}

export function deleteStoredBook(id: string): boolean {
  if (typeof window === "undefined") return false;

  const rawBooks = localStorage.getItem(STORAGE_KEYS.BOOKS);
  const books: Book[] = rawBooks ? JSON.parse(rawBooks) : [];
  const filteredBooks = books.filter((b) => b.id !== id);
  localStorage.setItem(STORAGE_KEYS.BOOKS, JSON.stringify(filteredBooks));

  // Cascade delete entries
  const rawEntries = localStorage.getItem(STORAGE_KEYS.ENTRIES);
  const entries: Entry[] = rawEntries ? JSON.parse(rawEntries) : [];
  const filteredEntries = entries.filter((e) => e.bookId !== id);
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(filteredEntries));

  notifyUpdate();
  return true;
}

// -------------------------------------------------------------
// ENTRIES CRUD
// -------------------------------------------------------------

export function getStoredEntries(bookId?: string | null): Entry[] {
  if (typeof window === "undefined") return [];
  initializeStorageIfNeeded();

  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
    let entries: Entry[] = raw ? JSON.parse(raw) : [];

    if (bookId && bookId !== "ALL") {
      entries = entries.filter((e) => e.bookId === bookId);
    }

    // Attach book snippet to each entry
    const books = getStoredBooks();
    const booksMap = new Map(books.map((b) => [b.id, b]));

    const enriched = entries.map((entry) => {
      const b = booksMap.get(entry.bookId);
      return {
        ...entry,
        book: b
          ? {
              id: b.id,
              title: b.title,
              author: b.author,
              coverUrl: b.coverUrl,
              type: b.type,
            }
          : undefined,
        aiThreads: entry.aiThreads || [],
      };
    });

    return enriched.sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  } catch (err) {
    console.error("Error loading entries from localStorage:", err);
    return [];
  }
}

export function saveNewEntry(
  bookId: string,
  content: string,
  pageNumber?: string | null,
  initialAiMessage?: string | null
): Entry {
  if (typeof window === "undefined") {
    throw new Error("Cannot save entry on server");
  }

  const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
  const entries: Entry[] = raw ? JSON.parse(raw) : [];
  const now = new Date();
  const entryId = `entry-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;

  const aiThreads: AiMessage[] = [];
  if (initialAiMessage && initialAiMessage.trim()) {
    aiThreads.push({
      id: `msg-${Date.now()}`,
      entryId,
      sender: "AI",
      message: initialAiMessage.trim(),
      createdAt: new Date(now.getTime() + 1000).toISOString(),
    });
  }

  const newEntry: Entry = {
    id: entryId,
    bookId,
    content: content.trim(),
    pageNumber: pageNumber ? pageNumber.trim() : null,
    createdAt: now.toISOString(),
    aiThreads,
  };

  const updatedEntries = [newEntry, ...entries];
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(updatedEntries));

  // Touch book's updatedAt
  updateStoredBook(bookId, {});

  notifyUpdate();
  return newEntry;
}

export function deleteStoredEntry(id: string): boolean {
  if (typeof window === "undefined") return false;

  const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
  const entries: Entry[] = raw ? JSON.parse(raw) : [];
  const filtered = entries.filter((e) => e.id !== id);
  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(filtered));

  notifyUpdate();
  return true;
}

export function addAiMessageToEntry(
  entryId: string,
  sender: "USER" | "AI",
  message: string
): AiMessage | null {
  if (typeof window === "undefined") return null;

  const raw = localStorage.getItem(STORAGE_KEYS.ENTRIES);
  const entries: Entry[] = raw ? JSON.parse(raw) : [];
  const idx = entries.findIndex((e) => e.id === entryId);
  if (idx === -1) return null;

  const newMsg: AiMessage = {
    id: `msg-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    entryId,
    sender,
    message: message.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!entries[idx].aiThreads) {
    entries[idx].aiThreads = [];
  }
  entries[idx].aiThreads.push(newMsg);

  localStorage.setItem(STORAGE_KEYS.ENTRIES, JSON.stringify(entries));
  notifyUpdate();
  return newMsg;
}

// -------------------------------------------------------------
// STREAK & HABIT METRICS
// -------------------------------------------------------------

export function calculateReadingStreak(): StreakStats {
  if (typeof window === "undefined") {
    return {
      streak: 0,
      hasLoggedToday: false,
      totalEntries: 0,
      activeBooksCount: 0,
      activeDates: [],
      dailyCounts: {},
      dailyActivity: {},
    };
  }

  const entries = getStoredEntries();
  const books = getStoredBooks();
  const activeBooksCount = books.filter((b) => b.status === "READING").length;

  if (entries.length === 0) {
    return {
      streak: 0,
      hasLoggedToday: false,
      totalEntries: 0,
      activeBooksCount,
      activeDates: [],
      dailyCounts: {},
      dailyActivity: {},
    };
  }

  const dailyCounts: Record<string, number> = {};
  const dailyActivity: Record<string, { count: number; types: string[] }> = {};

  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
      d.getDate()
    ).padStart(2, "0")}`;
    const mType = entry.book?.type ? entry.book.type.toUpperCase() : "BOOK";

    dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;

    if (!dailyActivity[dateStr]) {
      dailyActivity[dateStr] = { count: 0, types: [] };
    }
    dailyActivity[dateStr].count += 1;
    if (!dailyActivity[dateStr].types.includes(mType)) {
      dailyActivity[dateStr].types.push(mType);
    }
  }

  const activeDates = Object.keys(dailyCounts);
  const dateSet = new Set<string>(activeDates);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(
    now.getDate()
  ).padStart(2, "0")}`;
  const hasLoggedToday = dateSet.has(todayStr);

  let streak = 0;
  const checkDate = new Date(now);

  if (!hasLoggedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(
      checkDate.getDate()
    ).padStart(2, "0")}`;
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    streak,
    hasLoggedToday,
    totalEntries: entries.length,
    activeBooksCount,
    activeDates,
    dailyCounts,
    dailyActivity,
  };
}

// -------------------------------------------------------------
// USER PREFERENCES
// -------------------------------------------------------------

const DEFAULT_PREFERENCES: UserPreferences = {
  themeMode: "system",
  themeColor: "slate",
  customColor1: "#5865F2",
  customColor2: "#34A853",
  customColor3: "#8B5CF6",
  reminderEmail: "reader@example.com",
  reminderTime: "20:30",
  isReminderActive: true,
};

export function getStoredPreferences(): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.PREFERENCES);
    return raw ? { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) } : DEFAULT_PREFERENCES;
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function saveStoredPreferences(updates: Partial<UserPreferences>): UserPreferences {
  if (typeof window === "undefined") return DEFAULT_PREFERENCES;
  const current = getStoredPreferences();
  const merged = { ...current, ...updates };
  localStorage.setItem(STORAGE_KEYS.PREFERENCES, JSON.stringify(merged));
  notifyUpdate();
  return merged;
}

// -------------------------------------------------------------
// WEEKLY DIGEST / REVIEWS
// -------------------------------------------------------------

export function getStoredLatestReview(): WeeklyDigest | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_DIGESTS);
    const digests: WeeklyDigest[] = raw ? JSON.parse(raw) : [];
    return digests[0] || null;
  } catch {
    return null;
  }
}

export function saveStoredReview(digest: Omit<WeeklyDigest, "id" | "createdAt">): WeeklyDigest {
  if (typeof window === "undefined") throw new Error("Cannot save review on server");
  const raw = localStorage.getItem(STORAGE_KEYS.WEEKLY_DIGESTS);
  const digests: WeeklyDigest[] = raw ? JSON.parse(raw) : [];

  const newDigest: WeeklyDigest = {
    ...digest,
    id: `digest-${Date.now()}`,
    createdAt: new Date().toISOString(),
  };

  const updated = [newDigest, ...digests];
  localStorage.setItem(STORAGE_KEYS.WEEKLY_DIGESTS, JSON.stringify(updated));
  notifyUpdate();
  return newDigest;
}
