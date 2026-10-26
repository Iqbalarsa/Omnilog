import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const bookId = searchParams.get("bookId");
    const query = searchParams.get("query");

    const where: any = {};

    if (bookId && bookId !== "ALL") {
      where.bookId = bookId;
    }

    if (query && query.trim() !== "") {
      const q = query.trim();
      where.OR = [
        { content: { contains: q } },
        { pageNumber: { contains: q } },
        { book: { title: { contains: q } } },
        { book: { author: { contains: q } } },
        { aiThreads: { some: { message: { contains: q } } } },
      ];
    }

    const entries = await prisma.entry.findMany({
      where,
      include: {
        book: {
          select: {
            id: true,
            title: true,
            author: true,
            coverUrl: true,
            status: true,
            type: true,
            url: true,
          },
        },
        aiThreads: {
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(entries);
  } catch (err: any) {
    console.error("Failed to fetch entries:", err);
    return NextResponse.json(
      { error: "Failed to fetch reading entries" },
      { status: 500 }
    );
  }
}
