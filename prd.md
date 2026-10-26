# Product Requirement Document (PRD): ReadLog AI

## 1. Overview & Objective
* **Project Name:** ReadLog AI (Personal Micro-journaling & Reading Companion)
* **Target Audience:** Single-user (Personal Use)
* **Language:** English (UI, System Prompts, and Notifications)
* **Core Value Proposition:** Build and sustain a daily reading habit through frictionless micro-journaling, active recall using Socratic AI sparring, and automated email accountability reminders.

---

## 2. Tech Stack & Architecture
* **Framework:** Next.js (App Router, TypeScript)
* **Database & ORM:** SQLite (local file `readlog.db`) via Prisma ORM
* **Styling & Theming:** Tailwind CSS + `next-themes` (Light/Dark mode + dynamic accent palettes)
* **AI Engine:** Google Gemini API (`@google/genai` SDK)
* **External APIs & Services:**
  * **Google Books API (Public):** Automatic metadata and book cover fetching
  * **Email Service:** Nodemailer (via Gmail SMTP) or Resend API for notification delivery
* **Scheduler:** `node-cron` running server-side for daily automated checks

---

## 3. Key Features & Functional Requirements

### A. Theming & Personalization
* **Base Mode:** Light and Dark mode toggle with persistent local state.
* **Accent Color Palettes:**
  * **Warm Amber / Sepia:** Reading-friendly, warm paper aesthetic.
  * **Forest Sage:** Calming, muted green tones.
  * **Nordic Slate:** Clean, minimalist cool-gray and slate blue.
  * **Deep Rose:** Elegant muted terracotta/rose.

### B. Dashboard: Bookshelf & Habit Tracker (Home View)
* **Habit Streak Tracker:**
  * Daily streak counter badge (e.g., `🔥 5-Day Reading Streak`).
  * Today's status check indicator: Green checkmark if at least one entry was logged today; muted outline if pending.
* **Book Grid (Bookshelf):**
  * Responsive card grid displaying: Front cover thumbnail, Title, Author, Total entries logged, and Status badge (`Reading`, `Completed`, `On Hold`).
  * Clicking a card navigates to the **Book Detail & Journal View** (`/books/[id]`).
* **Add Book Modal:**
  * Search bar connected to Google Books API: typing a book title auto-populates title, author, total pages, and book cover thumbnail.
  * Fallback manual input: allows custom title, author, and cover image URL if not found via API.

### C. Book Detail & Journal Workspace
* **Book Header:** Book cover, title, author, reading progress, and a "Mark as Finished" toggle button.
* **Quick Log Form (Frictionless Entry):**
  * Freeform Markdown textarea for reflections, thoughts, or raw notes.
  * Optional field: Page/Chapter reference (e.g., "Pages 45–62" or "Chapter 3").
  * Action buttons: "Save Entry" and toggle checkbox "Engage Socratic AI Partner" (default: checked).
* **Entries Timeline (Feed):**
  * Chronological order (newest to oldest) grouped by date.
  * Each entry card contains: Timestamp, page progress tag, user reflection body, and an expandable interactive AI conversation thread.
* **Interactive Socratic AI Sparring Partner:**
  * Runs on top of each specific journal entry.
  * Supports multi-turn dialogue (user can reply directly in the thread below the AI response).
  * System Persona (English): Acts as an intellectual reading companion using the Socratic method to test comprehension and challenge assumptions without verbose filler or hollow praise.

### D. Daily Email Reminder Engine
* **Cron Schedule:** Runs daily at `20:30` (8:30 PM) local time.
* **Business Logic:**
  1. Query SQLite `Entry` table for records created between `00:00:00` and `20:29:59` today.
  2. If count > 0: Exit silently (habit completed).
  3. If count == 0: Send a friendly nudge email to the user's configured email address.
* **Email Template:**
  * Subject: *"Keep your streak alive! 5 minutes of reading today? 🔥"*
  * Body: Displays current streak count and the title of the book currently marked as `Reading`.

---

## 4. Database Schema (Prisma / SQLite)

```prisma
datasource db {
  provider = "sqlite"
  url      = "file:./readlog.db"
}

generator client {
  provider = "prisma-client-js"
}

model Book {
  id          String   @id @default(uuid())
  title       String
  author      String?
  coverUrl    String?
  totalPages  Int?
  status      String   @default("READING") // READING, COMPLETED, ON_HOLD
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  entries     Entry[]
}

model Entry {
  id          String        @id @default(uuid())
  bookId      String
  book        Book          @relation(fields: [bookId], references: [id], onDelete: Cascade)
  content     String        // Freeform reading reflection
  pageNumber  String?       // e.g., "pp. 45-60"
  createdAt   DateTime      @default(now())
  aiThreads   AiMessage[]
}

model AiMessage {
  id        String   @id @default(uuid())
  entryId   String
  entry     Entry    @relation(fields: [entryId], references: [id], onDelete: Cascade)
  sender    String   // "USER" or "AI"
  message   String
  createdAt DateTime @default(now())
}

model UserPreference {
  id               Int      @id @default(1)
  themeMode        String   @default("system") // light, dark, system
  themeColor       String   @default("amber")  // amber, sage, slate, rose
  reminderEmail    String?
  reminderTime     String   @default("20:30")
  isReminderActive Boolean  @default(true)
}
```

---

## 5. AI System Prompt (Socratic Partner Persona)

When triggering the AI discussion endpoint, use the following system prompt:

```text
You are a Socratic reading partner and intellectual sparring companion for a book reader.
The user just logged a raw reflection from their reading session.

Your objectives:
1. Synthesize and validate their core takeaway in 1–2 crisp sentences.
2. Apply the Socratic method: challenge their understanding by asking 1 sharp, provocative question or providing a real-world edge-case scenario where the author's argument might fall apart.
3. Keep the tone conversational, intellectually rigorous, and concise. Avoid flattering pleasantries ("Great summary!", "Excellent point!"). Dive straight into the substance.
```

---

## 6. Implementation Milestones for AI Agent

* **Phase 1: Project Scaffolding & Database Setup**
  * Initialize Next.js project with Tailwind CSS, TypeScript, and Prisma with SQLite.
  * Run initial Prisma migrations and seed a sample book record.
* **Phase 2: UI Theming & Dashboard**
  * Configure theme provider (Light/Dark + Amber, Sage, Slate, Rose palettes).
  * Build the Bookshelf Grid and the Google Books search modal.
* **Phase 3: Journal Workspace & Gemini API Integration**
  * Build the Book Detail page with entry form and timeline view.
  * Integrate `@google/genai` for Socratic sparring multi-turn threads.
* **Phase 4: Email Notification Worker & Settings**
  * Implement `node-cron` routine and email dispatch logic via Nodemailer/Resend.
  * Create `/settings` page for managing email preferences and theme colors.