import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSocraticSparring } from "@/lib/gemini";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: entryId } = await params;
    const body = await req.json();
    const { message } = body;

    if (!message || !message.trim()) {
      return NextResponse.json(
        { error: "Reply message cannot be empty" },
        { status: 400 }
      );
    }

    const entry = await prisma.entry.findUnique({
      where: { id: entryId },
      include: {
        book: true,
        aiThreads: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Persist user reply
    const userMsg = await prisma.aiMessage.create({
      data: {
        entryId,
        sender: "USER",
        message: message.trim(),
      },
    });

    // Generate AI Socratic sparring response
    const sparringReply = await generateSocraticSparring({
      bookTitle: entry.book.title,
      bookAuthor: entry.book.author,
      entryContent: entry.content,
      pageNumber: entry.pageNumber,
      previousMessages: entry.aiThreads.map((m: any) => ({
        sender: m.sender,
        message: m.message,
      })),
      newUserMessage: message.trim(),
    });

    const finalAiText =
      sparringReply && sparringReply.trim()
        ? sparringReply.trim()
        : "Refleksi yang sangat menarik. Bagaimana Anda memverifikasi asumsi tersebut dalam situasi nyata ketika dinamika lapangan berbalik melawan rencana Anda?";

    // Persist AI reply
    const aiMsg = await prisma.aiMessage.create({
      data: {
        entryId,
        sender: "AI",
        message: finalAiText,
      },
    });

    return NextResponse.json({
      userMessage: userMsg,
      aiMessage: aiMsg,
    });
  } catch (err: any) {
    console.error("Failed to generate sparring response:", err);
    return NextResponse.json(
      { error: "Failed to continue Socratic dialogue" },
      { status: 500 }
    );
  }
}
