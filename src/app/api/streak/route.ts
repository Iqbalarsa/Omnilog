import { NextResponse } from "next/server";
import { calculateReadingStreak } from "@/lib/email";

export async function GET() {
  try {
    const stats = await calculateReadingStreak();
    return NextResponse.json(stats);
  } catch (err: any) {
    console.error("Streak calculation error:", err);
    return NextResponse.json(
      { streak: 0, hasLoggedToday: false, totalEntries: 0, activeBooksCount: 0, activeDates: [], dailyCounts: {}, dailyActivity: {} },
      { status: 500 }
    );
  }
}
