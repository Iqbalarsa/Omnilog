import { NextResponse } from "next/server";
import { generateSocraticSparring } from "@/lib/gemini";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await params;
    const body = await req.json();
    const {
      message,
      bookTitle = "General Knowledge",
      bookAuthor = null,
      entryContent = "",
      pageNumber = null,
      previousMessages = [],
    } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Reply message cannot be empty" },
        { status: 400 }
      );
    }

    // Generate AI Socratic sparring response
    const sparringReply = await generateSocraticSparring({
      bookTitle,
      bookAuthor,
      entryContent,
      pageNumber,
      previousMessages,
      newUserMessage: message.trim(),
    });

    const finalAiText =
      sparringReply && sparringReply.trim()
        ? sparringReply.trim()
        : "Refleksi yang sangat menarik. Bagaimana Anda memverifikasi asumsi tersebut dalam situasi nyata ketika dinamika lapangan berbalik melawan rencana Anda?";

    return NextResponse.json({
      userMessage: {
        id: `msg-${Date.now()}-user`,
        entryId,
        sender: "USER",
        message: message.trim(),
        createdAt: new Date().toISOString(),
      },
      aiMessage: {
        id: `msg-${Date.now()}-ai`,
        entryId,
        sender: "AI",
        message: finalAiText,
        createdAt: new Date().toISOString(),
      },
      reply: finalAiText,
    });
  } catch (err: any) {
    console.error("Failed to generate sparring response:", err);
    return NextResponse.json({
      reply:
        "Refleksi yang menarik. Bagaimana konsep ini bisa diterapkan secara nyata dalam konteks tantangan Anda saat ini?",
      userMessage: { sender: "USER", message: "Catatan refleksi" },
      aiMessage: {
        sender: "AI",
        message:
          "Refleksi yang menarik. Bagaimana konsep ini bisa diterapkan secara nyata dalam konteks tantangan Anda saat ini?",
      },
    });
  }
}
