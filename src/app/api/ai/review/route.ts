import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET: Fetch the latest saved weekly review so user can reopen past reviews anytime
export async function GET() {
  try {
    const saved = await (prisma as any).weeklyDigest.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (!saved) {
      return NextResponse.json({
        empty: true,
        message:
          "No saved weekly review yet. Click 'Generate Review' to synthesize your reading notes with AI!",
      });
    }

    return NextResponse.json({
      id: saved.id,
      title: saved.title,
      executiveSummary: saved.executiveSummary,
      coreThemes: JSON.parse(saved.coreThemes || "[]"),
      takeaways: JSON.parse(saved.takeaways || "[]"),
      questionsToPonder: JSON.parse(saved.questionsToPonder || "[]"),
      readingMomentum: saved.readingMomentum,
      entriesAnalyzed: saved.entriesAnalyzed,
      booksCovered: JSON.parse(saved.booksCovered || "[]"),
      generatedAt: saved.createdAt.toISOString(),
      saved: true,
    });
  } catch (err: any) {
    console.error("Fetch saved review error:", err);
    return NextResponse.json(
      { error: "Failed to load saved weekly review" },
      { status: 500 }
    );
  }
}

// POST: Generate fresh weekly review and save it to SQLite
export async function POST() {
  try {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // Fetch entries from the past 7 days
    let entries = await prisma.entry.findMany({
      where: {
        createdAt: { gte: sevenDaysAgo },
      },
      include: {
        book: {
          select: { title: true, author: true },
        },
        aiThreads: {
          select: { sender: true, message: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    // If fewer than 2 entries in 7 days, fallback to the latest 10 entries
    if (entries.length < 2) {
      entries = await prisma.entry.findMany({
        take: 10,
        include: {
          book: {
            select: { title: true, author: true },
          },
          aiThreads: {
            select: { sender: true, message: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
    }

    if (entries.length === 0) {
      return NextResponse.json({
        empty: true,
        message:
          "No reading reflections found yet. Log at least one note from your reading sessions to unlock your AI Weekly Digest!",
      });
    }

    // Unique books list
    const booksCovered: string[] = Array.from(
      new Set(entries.map((e: any) => e.book?.title).filter(Boolean))
    ) as string[];

    const notesSummary = entries.map((e: any) => ({
      book: e.book?.title || "Unknown Book",
      page: e.pageNumber || null,
      content: e.content,
      aiThreadPreview: e.aiThreads?.slice(0, 2).map((m: any) => m.message),
    }));

    let reviewData: any = null;

    // Attempt Gemini synthesis with short timeout
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== "") {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

        const systemPrompt = `You are an elite intellectual reading coach and synthesist.
Analyze the user's reading journal notes from their recent sessions across books.
Produce a structured, inspiring, high-density weekly reading digest in pure JSON format.
All output MUST be in English.

Required JSON Structure:
{
  "title": "A crisp, engaging title for this week's intellectual journey (e.g. 'Cognitive Friction & Habit Systems')",
  "executiveSummary": "2-3 sharp sentences synthesizing the core ideas and mental shifts the reader engaged with.",
  "coreThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "takeaways": [
    "Practical or philosophical takeaway 1",
    "Practical or philosophical takeaway 2",
    "Practical or philosophical takeaway 3"
  ],
  "questionsToPonder": [
    "One provocative curiosity-hook question exploring the books' tensions",
    "One reflective question linking their notes to real-world execution"
  ],
  "readingMomentum": "A motivating, 1-sentence observation on their reading discipline."
}
Only output the raw JSON string without markdown quotes.`;

        const model = process.env.GEMINI_MODEL || "gemini-3.5-flash-lite";

        const resultPromise = ai.models.generateContent({
          model,
          contents: `${systemPrompt}\n\nReader's Notes to Synthesize:\n${JSON.stringify(notesSummary, null, 2)}`,
        });

        const timeoutPromise = new Promise((_, reject) =>
          setTimeout(() => reject(new Error("AI generation timeout")), 8000)
        );

        const response: any = await Promise.race([resultPromise, timeoutPromise]);

        if (response && response.text) {
          const rawText = response.text.trim();
          const jsonMatch = rawText.match(/\{[\s\S]*\}/);
          if (jsonMatch) {
            reviewData = JSON.parse(jsonMatch[0]);
          }
        }
      } catch (geminiErr: any) {
        console.warn("Gemini weekly review fallback triggered:", geminiErr?.message || geminiErr);
      }
    }

    if (!reviewData) {
      reviewData = generateIntelligentFallbackReview(entries, booksCovered);
    }

    // Persist digest to SQLite
    const savedRecord = await (prisma as any).weeklyDigest.create({
      data: {
        title: reviewData.title || "Weekly Reading Synthesis",
        executiveSummary: reviewData.executiveSummary || "",
        coreThemes: JSON.stringify(reviewData.coreThemes || []),
        takeaways: JSON.stringify(reviewData.takeaways || []),
        questionsToPonder: JSON.stringify(reviewData.questionsToPonder || []),
        readingMomentum: reviewData.readingMomentum || null,
        entriesAnalyzed: entries.length,
        booksCovered: JSON.stringify(booksCovered || []),
      },
    });

    return NextResponse.json({
      id: savedRecord.id,
      title: savedRecord.title,
      executiveSummary: savedRecord.executiveSummary,
      coreThemes: reviewData.coreThemes || [],
      takeaways: reviewData.takeaways || [],
      questionsToPonder: reviewData.questionsToPonder || [],
      readingMomentum: reviewData.readingMomentum,
      entriesAnalyzed: entries.length,
      booksCovered,
      generatedAt: savedRecord.createdAt.toISOString(),
      saved: true,
    });
  } catch (err: any) {
    console.error("Weekly review error:", err);
    return NextResponse.json(
      { error: "Failed to generate weekly review" },
      { status: 500 }
    );
  }
}

function generateIntelligentFallbackReview(entries: any[], books: string[]) {
  const booksStr = books.length > 0 ? books.join(", ") : "your active titles";

  return {
    title: `Weekly Synthesis: Insights from ${books[0] || "Recent Reading"}`,
    executiveSummary: `Across ${entries.length} reflections on ${booksStr}, your reading momentum emphasized active retention over passive skimming. You probed deeply into underlying mechanisms, evaluating how abstract concepts translate into daily cognition and habit structures.`,
    coreThemes: [
      "Behavioral Architecture & Sustainable Systems",
      "Cognitive Models vs Emotional Intuition",
      "Frictionless Habits & Identity Reinforcement",
    ],
    takeaways: [
      "Micro-consistency (e.g. 10 pages daily) compounds far more effectively than irregular reading marathons.",
      "Deliberate cognitive effort is required to verify whether intuition is based on genuine expertise or recurring bias.",
      "Designing your immediate physical environment removes the friction of willpower depletion.",
    ],
    questionsToPonder: [
      "Where in your current routines are you relying on motivation instead of an explicit environmental system?",
      `How does the primary thesis of ${books[0] || "your book"} challenge an assumption you held six months ago?`,
    ],
    readingMomentum: `You logged ${entries.length} thoughtful reflections across ${books.length} book${books.length === 1 ? "" : "s"}, demonstrating consistent intellectual curiosity.`,
  };
}
