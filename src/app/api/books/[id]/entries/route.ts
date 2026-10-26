import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { generateSocraticSparring } from "@/lib/gemini";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: bookId } = await params;
    const body = await req.json();
    const { content, pageNumber, engageAi = true } = body;

    if (!content || !content.trim()) {
      return NextResponse.json(
        { error: "Journal reflection content cannot be empty" },
        { status: 400 }
      );
    }

    const book = await prisma.book.findUnique({
      where: { id: bookId },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    // Create journal entry
    const newEntry = await prisma.entry.create({
      data: {
        bookId,
        content: content.trim(),
        pageNumber: pageNumber ? pageNumber.trim() : null,
      },
    });

    // Touch book updated timestamp
    await prisma.book.update({
      where: { id: bookId },
      data: { updatedAt: new Date() },
    });

    let initialAiMessage = null;

    if (engageAi) {
      try {
        const sparringText = await generateSocraticSparring({
          bookTitle: book.title,
          bookAuthor: book.author,
          entryContent: content.trim(),
          pageNumber: pageNumber ? pageNumber.trim() : null,
        });

        if (sparringText && sparringText.trim()) {
          initialAiMessage = await prisma.aiMessage.create({
            data: {
              entryId: newEntry.id,
              sender: "AI",
              message: sparringText.trim(),
            },
          });
        }
      } catch (aiErr) {
        console.error("Failed to generate initial AI sparring response:", aiErr);
      }
    }

    const fullEntry = await prisma.entry.findUnique({
      where: { id: newEntry.id },
      include: {
        aiThreads: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    return NextResponse.json(fullEntry, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create entry:", err);
    return NextResponse.json({ error: "Failed to record journal entry" }, { status: 500 });
  }
}
