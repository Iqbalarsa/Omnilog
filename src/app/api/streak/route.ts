import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    streak: 0,
    hasLoggedToday: false,
    totalEntries: 0,
    activeBooksCount: 0,
    activeDates: [],
    dailyCounts: {},
    dailyActivity: {},
  });
}
