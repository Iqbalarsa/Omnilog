import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    message: "OmniLog operates client-first via localStorage for instant reactivity on Vercel.",
    status: "ok",
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({ success: true, item: body }, { status: 201 });
  } catch {
    return NextResponse.json({ success: true }, { status: 200 });
  }
}
