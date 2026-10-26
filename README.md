# OmniLog AI — Universal Knowledge & Reflection Workspace

OmniLog AI is an Apple-inspired digital sanctuary for capturing insights, active recall, and Socratic reflection across **Books**, **Videos (YouTube)**, and **Podcasts (Spotify)**.

---

## Features

- **Omni-Shelf**: Track books, videos, and podcasts in one minimalist command center.
- **Micro-Journaling**: Fast, frictionless reflection capture tied to pages, timestamps, or episodes.
- **Socratic AI Sparring Partner**: Powered by Google Gemini (`gemini-2.5-flash-lite`), challenging your reflections with open-ended Socratic inquiries.
- **Weekly Synthesis**: AI summaries highlighting core themes, cognitive growth, and actionable next steps.
- **30-Day Activity Tracker**: Minimalist habit visualization tracking your daily learning consistency.
- **Apple Aesthetics**: Glassmorphic headers, smooth transitions, Dark & Light modes, and customizable accent color palettes (Apple Blue, Warm Orange, Coral Red, and 3 custom user hex themes).

---

## Tech Stack

- **Framework**: Next.js 16 (App Router) + React 19 + TypeScript
- **Styling**: Tailwind CSS + Lucide Icons + Apple Design System
- **Database & ORM**: SQLite + Prisma ORM (easily migrated to PostgreSQL/Neon/Turso for production)
- **AI Engine**: Google GenAI SDK (`@google/genai`)

---

## Getting Started

### 1. Clone & Install Dependencies

```bash
git clone https://github.com/Iqbalarsa/Omnilog.git
cd Omnilog
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env`:

```bash
cp .env.example .env
```

Set your Google Gemini API key:
```env
GEMINI_API_KEY="your_google_gemini_api_key_here"
DATABASE_URL="file:./prisma/readlog.db"
```

> **Note**: Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey).

### 3. Initialize Database

```bash
npx prisma db push
```

### 4. Run Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser.

---

## Deploying to Vercel

1. Push this repository to GitHub.
2. Import the repository in [Vercel](https://vercel.com/new).
3. In **Project Settings → Environment Variables**, add:
   - `GEMINI_API_KEY`: Your Gemini API key.
   - `DATABASE_URL`: Your database connection string (e.g. Neon PostgreSQL, Turso, or Supabase).
4. Deploy!
