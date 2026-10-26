import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const book = await prisma.book.findUnique({
      where: { id },
      include: {
        entries: {
          orderBy: { createdAt: "desc" },
          include: {
            aiThreads: {
              orderBy: { createdAt: "asc" },
            },
          },
        },
      },
    });

    if (!book) {
      return NextResponse.json({ error: "Book not found" }, { status: 404 });
    }

    return NextResponse.json(book);
  } catch (err: any) {
    console.error("Failed to load book:", err);
    return NextResponse.json({ error: "Failed to load book" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { status, title, author, coverUrl, totalPages, type, url } = body;

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (author !== undefined) dataToUpdate.author = author.trim();
    if (coverUrl !== undefined) dataToUpdate.coverUrl = coverUrl.trim();
    if (url !== undefined) dataToUpdate.url = url ? url.trim() : null;
    if (type !== undefined) dataToUpdate.type = type;
    if (totalPages !== undefined) {
      dataToUpdate.totalPages = totalPages ? parseInt(String(totalPages), 10) || null : null;
    }

    const updated = await prisma.book.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updated);
  } catch (err: any) {
    console.error("Failed to update item:", err);
    return NextResponse.json({ error: "Failed to update item" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await prisma.book.delete({
      where: { id },
    });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Failed to delete book:", err);
    return NextResponse.json({ error: "Failed to delete book" }, { status: 500 });
  }
}
