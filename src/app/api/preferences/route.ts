import { NextResponse } from "next/server";

export async function GET() {
  const hasRealSmtp = Boolean(
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD &&
    process.env.EMAIL_SERVER_USER.trim() !== "" &&
    process.env.EMAIL_SERVER_PASSWORD.trim() !== ""
  );

  return NextResponse.json({
    id: 1,
    themeMode: "system",
    themeColor: "slate",
    customColor1: "#5865F2",
    customColor2: "#34A853",
    customColor3: "#8B5CF6",
    reminderEmail: "iqbalarsa99@gmail.com",
    reminderTime: "20:30",
    isReminderActive: true,
    hasRealSmtp,
    smtpUser: process.env.EMAIL_SERVER_USER || "",
  });
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    return NextResponse.json({
      success: true,
      ...body,
      hasRealSmtp: Boolean(process.env.EMAIL_SERVER_USER && process.env.EMAIL_SERVER_PASSWORD),
      smtpUser: process.env.EMAIL_SERVER_USER || "",
    });
  } catch {
    return NextResponse.json({ success: true });
  }
}
