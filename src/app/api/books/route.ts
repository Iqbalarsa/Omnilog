import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { initCronJobs } from "@/lib/cron";

// Initialize cron on first request
initCronJobs();

export async function GET() {
  try {
    const books = await prisma.book.findMany({
      include: {
        _count: {
          select: { entries: true },
        },
        entries: {
          orderBy: { createdAt: "desc" },
          take: 1,
          select: { createdAt: true, pageNumber: true },
        },
      },
      orderBy: { updatedAt: "desc" },
    });

    const formatted = books.map((book: any) => ({
      ...book,
      entriesCount: book._count.entries,
      lastReadAt: book.entries[0]?.createdAt ?? null,
      lastPage: book.entries[0]?.pageNumber ?? null,
    }));

    return NextResponse.json(formatted);
  } catch (err: any) {
    console.error("Failed to fetch books:", err);
    return NextResponse.json({ error: "Failed to load books" }, { status: 500 });
  }
}

function getYouTubeThumbnail(url: string): string | null {
  try {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    if (match && match[2].length === 11) {
      return `https://img.youtube.com/vi/${match[2]}/hqdefault.jpg`;
    }
  } catch {
    // fallback
  }
  return null;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { title, author, coverUrl, totalPages, status, type, url } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const mediaType = (type && ["BOOK", "VIDEO", "PODCAST"].includes(type.toUpperCase()))
      ? type.toUpperCase()
      : "BOOK";

    let finalCoverUrl = coverUrl ? coverUrl.trim() : null;
    const finalUrl = url ? url.trim() : null;

    // Auto extract YouTube thumbnail if video and no custom cover provided
    if (mediaType === "VIDEO" && finalUrl && !finalCoverUrl) {
      const ytThumb = getYouTubeThumbnail(finalUrl);
      if (ytThumb) finalCoverUrl = ytThumb;
    }

    const newBook = await prisma.book.create({
      data: {
        title: title.trim(),
        author: author ? author.trim() : null,
        coverUrl: finalCoverUrl,
        totalPages: totalPages ? parseInt(String(totalPages), 10) || null : null,
        type: mediaType,
        url: finalUrl,
        status: status || "READING",
      },
    });

    return NextResponse.json(newBook, { status: 201 });
  } catch (err: any) {
    console.error("Failed to create book:", err);
    return NextResponse.json({ error: "Failed to add item" }, { status: 500 });
  }
}
