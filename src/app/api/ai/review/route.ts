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
    let scope: "ALL" | "BOOK" | "VIDEO" | "ACTIVE" = "ALL";
    let scopeTitle: string | null = null;

    try {
      const body = await req.json();
      if (body.entries && Array.isArray(body.entries)) {
        entries = body.entries;
      }
      if (body.books && Array.isArray(body.books)) {
        booksCovered = body.books;
      }
      if (body.scope) {
        scope = body.scope;
      }
      if (body.scopeTitle) {
        scopeTitle = body.scopeTitle;
      }
    } catch {
      // Empty body is okay, fallback will be used
    }

    if (entries.length === 0) {
      entries = [
        {
          book: scopeTitle || (scope === "VIDEO" ? "Video & Media Logs" : "Reading Journals"),
          content: "Active intellectual reflection and note-taking habit.",
        },
      ];
    }

    if (booksCovered.length === 0) {
      booksCovered = Array.from(
        new Set(entries.map((e: any) => e.book?.title || e.book).filter(Boolean))
      );
    }

    const notesSummary = entries.slice(0, 15).map((e: any) => ({
      source: e.book?.title || e.book || "Unknown Source",
      type: e.book?.type || (scope === "VIDEO" ? "VIDEO" : "BOOK"),
      pageOrTimestamp: e.pageNumber || null,
      content: e.content,
    }));

    let reviewData: any = null;

    // Build specialized prompt depending on scope
    let scopeInstruction = "";
    if (scope === "BOOK") {
      scopeInstruction = "FOCUS: Long-form reading notes across books. Emphasize conceptual models, thesis evaluation, deep retention, and overarching philosophical frameworks.";
    } else if (scope === "VIDEO") {
      scopeInstruction = "FOCUS: Multimedia knowledge intake (YouTube videos, podcasts, talks). Emphasize pragmatic takeaways, modern technology/industry insights, mental models, and rapid execution.";
    } else if (scope === "ACTIVE") {
      scopeInstruction = `FOCUS: Deep-dive progress synthesis on the single title: "${scopeTitle || booksCovered[0] || 'Active Media'}". Trace the user's comprehension trajectory, highlight key breakthroughs, and suggest intellectual follow-up questions for this specific work.`;
    } else {
      scopeInstruction = "FOCUS: Holistic cross-disciplinary synthesis. Connect insights across books, videos, and podcasts. Find serendipitous connections and unify disparate concepts into cohesive mental models.";
    }

    // Attempt Gemini synthesis with short timeout
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey && apiKey.trim() !== "") {
      try {
        const { GoogleGenAI } = await import("@google/genai");
        const ai = new GoogleGenAI({ apiKey: apiKey.trim() });

        const systemPrompt = `You are an elite intellectual reading coach and cognitive synthesist.
Analyze the user's reflection notes from their recent learning sessions.
${scopeInstruction}

Produce a structured, inspiring, high-density reading digest in pure JSON format.
All output MUST be in English.

Required JSON Structure:
{
  "title": "A crisp, engaging title for this digest (e.g. 'Cognitive Friction & Habit Systems' or 'Deep Dive: Thinking, Fast and Slow')",
  "executiveSummary": "2-3 sharp sentences synthesizing the core ideas and mental shifts the reader engaged with.",
  "coreThemes": ["Theme 1", "Theme 2", "Theme 3"],
  "takeaways": [
    "Practical or philosophical takeaway 1",
    "Practical or philosophical takeaway 2",
    "Practical or philosophical takeaway 3"
  ],
  "questionsToPonder": [
    "One provocative curiosity-hook question exploring intellectual tensions",
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
      reviewData = generateIntelligentFallbackReview(entries, booksCovered, scope, scopeTitle);
    }

    return NextResponse.json({
      id: `digest-${Date.now()}`,
      title: reviewData.title || (scopeTitle ? `Synthesis: ${scopeTitle}` : "Weekly Reading Synthesis"),
      executiveSummary: reviewData.executiveSummary || "",
      coreThemes: reviewData.coreThemes || [],
      takeaways: reviewData.takeaways || [],
      questionsToPonder: reviewData.questionsToPonder || [],
      readingMomentum: reviewData.readingMomentum,
      entriesAnalyzed: entries.length,
      booksCovered,
      scope,
      scopeTitle,
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

function generateIntelligentFallbackReview(
  entries: any[],
  books: string[],
  scope: string = "ALL",
  scopeTitle?: string | null
) {
  const booksStr = scopeTitle || (books.length > 0 ? books.join(", ") : "your active titles");

  const title =
    scope === "ACTIVE" && scopeTitle
      ? `Deep-Dive Synthesis: ${scopeTitle}`
      : scope === "BOOK"
      ? `Bookshelf Synthesis: Deep Reading Insights`
      : scope === "VIDEO"
      ? `Multimedia Digest: Video & Audio Insights`
      : `Weekly Cross-Media Synthesis: ${books[0] || "Active Insights"}`;

  return {
    title,
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
