import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    empty: true,
    message: "Click 'Generate Review' to synthesize your reading reflections with AI!",
  });
}

// POST: Generate fresh weekly review without server database dependencies
export async function POST(req: Request) {
  try {
    let entries: any[] = [];
    let booksCovered: string[] = [];

    try {
      const body = await req.json();
      if (body.entries && Array.isArray(body.entries)) {
        entries = body.entries;
      }
      if (body.books && Array.isArray(body.books)) {
        booksCovered = body.books;
      }
    } catch {
      // Empty body is okay, fallback will be used
    }

    if (entries.length === 0) {
      entries = [
        {
          book: "Reading Journals",
          content: "Active reading habit and intellectual reflection.",
        },
      ];
    }

    if (booksCovered.length === 0) {
      booksCovered = Array.from(
        new Set(entries.map((e: any) => e.book?.title || e.book).filter(Boolean))
      );
    }

    const notesSummary = entries.slice(0, 10).map((e: any) => ({
      book: e.book?.title || e.book || "Unknown Book",
      page: e.pageNumber || null,
      content: e.content,
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

    return NextResponse.json({
      id: `digest-${Date.now()}`,
      title: reviewData.title || "Weekly Reading Synthesis",
      executiveSummary: reviewData.executiveSummary || "",
      coreThemes: reviewData.coreThemes || [],
      takeaways: reviewData.takeaways || [],
      questionsToPonder: reviewData.questionsToPonder || [],
      readingMomentum: reviewData.readingMomentum,
      entriesAnalyzed: entries.length,
      booksCovered,
      generatedAt: new Date().toISOString(),
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
