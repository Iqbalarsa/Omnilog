import { NextResponse } from "next/server";
import { checkAndSendDailyReminder } from "@/lib/email";

export async function GET() {
  try {
    const result = await checkAndSendDailyReminder(false);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("Cron route error:", err);
    return NextResponse.json(
      { error: err.message || "Cron execution failed" },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
