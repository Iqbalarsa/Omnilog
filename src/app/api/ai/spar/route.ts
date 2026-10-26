import { NextResponse } from "next/server";
import { generateSocraticSparring } from "@/lib/gemini";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      bookTitle = "General Knowledge",
      bookAuthor = null,
      entryContent = "",
      pageNumber = null,
      previousMessages = [],
      userMessage = null,
    } = body;

    const sparringReply = await generateSocraticSparring({
      bookTitle,
      bookAuthor,
      entryContent,
      pageNumber,
      previousMessages,
      newUserMessage: userMessage,
    });

    return NextResponse.json({
      reply: sparringReply,
    });
  } catch (err: any) {
    console.error("AI spar error:", err);
    return NextResponse.json({
      reply:
        "Refleksi yang sangat menarik! Apa satu implikasi paling signifikan dari gagasan ini dalam pengambilan keputusan Anda sehari-hari?",
    });
  }
}
