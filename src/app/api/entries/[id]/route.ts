import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const entry = await prisma.entry.findUnique({
      where: { id },
      include: {
        aiThreads: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!entry) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    return NextResponse.json(entry);
  } catch (err: any) {
    console.error("Failed to fetch entry:", err);
    return NextResponse.json({ error: "Failed to fetch entry" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const existing = await prisma.entry.findUnique({
      where: { id },
    });

    if (!existing) {
      return NextResponse.json({ error: "Entry not found" }, { status: 404 });
    }

    // Delete entry (cascades to aiThreads in SQLite)
    await prisma.entry.delete({
      where: { id },
    });

    return NextResponse.json({ success: true, deletedId: id });
  } catch (err: any) {
    console.error("Failed to delete entry:", err);
    return NextResponse.json(
      { error: "Failed to delete journal entry" },
      { status: 500 }
    );
  }
}
