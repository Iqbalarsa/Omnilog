import { NextResponse } from "next/server";
import { checkAndSendDailyReminder } from "@/lib/email";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => ({}));
    const recipient = body?.email ? String(body.email).trim() : undefined;
    const result = await checkAndSendDailyReminder(true, recipient);
    return NextResponse.json({
      success: result.status === "sent" || result.status === "simulated",
      isRealDelivery: Boolean(result.isRealDelivery),
      status: result.status,
      recipient: result.recipient,
      message: result.message || `Test reminder processed for ${result.recipient}`,
      result,
    });
  } catch (err: any) {
    console.error("Test reminder error:", err);
    return NextResponse.json(
      { success: false, message: err.message || "Failed to dispatch test reminder" },
      { status: 500 }
    );
  }
}
