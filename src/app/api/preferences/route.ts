import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    let pref = await prisma.userPreference.findFirst({ where: { id: 1 } });
    if (!pref) {
      pref = await prisma.userPreference.create({
        data: {
          id: 1,
          themeMode: "system",
          themeColor: "slate",
          customColor1: "#5865F2",
          customColor2: "#34A853",
          customColor3: "#8B5CF6",
          reminderEmail: "iqbalarsa99@gmail.com",
          reminderTime: "20:30",
          isReminderActive: true,
        },
      });
    }

    const hasRealSmtp = Boolean(
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD &&
      process.env.EMAIL_SERVER_USER.trim() !== "" &&
      process.env.EMAIL_SERVER_PASSWORD.trim() !== ""
    );

    return NextResponse.json({
      ...pref,
      customColor1: (pref as any).customColor1 || "#5865F2",
      customColor2: (pref as any).customColor2 || "#34A853",
      customColor3: (pref as any).customColor3 || "#8B5CF6",
      hasRealSmtp,
      smtpUser: process.env.EMAIL_SERVER_USER || "",
    });
  } catch (err: any) {
    console.error("Preferences fetch error:", err);
    return NextResponse.json(
      {
        id: 1,
        themeMode: "system",
        themeColor: "slate",
        customColor1: "#5865F2",
        customColor2: "#34A853",
        customColor3: "#8B5CF6",
        reminderEmail: "iqbalarsa99@gmail.com",
        reminderTime: "20:30",
        isReminderActive: true,
        hasRealSmtp: false,
        smtpUser: "",
      },
      { status: 200 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const {
      themeMode,
      themeColor,
      customColor1,
      customColor2,
      customColor3,
      reminderEmail,
      reminderTime,
      isReminderActive,
      smtpUser,
      smtpPass,
    } = body;

    const dataToUpdate: any = {};
    if (themeMode !== undefined) dataToUpdate.themeMode = themeMode;
    if (themeColor !== undefined) dataToUpdate.themeColor = themeColor;
    if (customColor1 !== undefined) dataToUpdate.customColor1 = customColor1;
    if (customColor2 !== undefined) dataToUpdate.customColor2 = customColor2;
    if (customColor3 !== undefined) dataToUpdate.customColor3 = customColor3;
    if (reminderEmail !== undefined) dataToUpdate.reminderEmail = reminderEmail;
    if (reminderTime !== undefined) dataToUpdate.reminderTime = reminderTime;
    if (isReminderActive !== undefined) dataToUpdate.isReminderActive = Boolean(isReminderActive);

    const updated = await prisma.userPreference.upsert({
      where: { id: 1 },
      update: dataToUpdate,
      create: {
        id: 1,
        themeMode: themeMode || "system",
        themeColor: themeColor || "slate",
        customColor1: customColor1 || "#5865F2",
        customColor2: customColor2 || "#34A853",
        customColor3: customColor3 || "#8B5CF6",
        reminderEmail: reminderEmail || "iqbalarsa99@gmail.com",
        reminderTime: reminderTime || "20:30",
        isReminderActive: isReminderActive !== undefined ? isReminderActive : true,
      },
    });

    // Optionally update SMTP in .env and process.env
    if (smtpUser !== undefined || smtpPass !== undefined) {
      try {
        const envPath = path.join(process.cwd(), ".env");
        if (fs.existsSync(envPath)) {
          let envContent = fs.readFileSync(envPath, "utf8");
          if (smtpUser !== undefined) {
            process.env.EMAIL_SERVER_USER = smtpUser;
            if (envContent.includes("EMAIL_SERVER_USER=")) {
              envContent = envContent.replace(/EMAIL_SERVER_USER=.*/g, `EMAIL_SERVER_USER="${smtpUser}"`);
            } else {
              envContent += `\nEMAIL_SERVER_USER="${smtpUser}"`;
            }
          }
          if (smtpPass !== undefined) {
            process.env.EMAIL_SERVER_PASSWORD = smtpPass;
            if (envContent.includes("EMAIL_SERVER_PASSWORD=")) {
              envContent = envContent.replace(/EMAIL_SERVER_PASSWORD=.*/g, `EMAIL_SERVER_PASSWORD="${smtpPass}"`);
            } else {
              envContent += `\nEMAIL_SERVER_PASSWORD="${smtpPass}"`;
            }
          }
          fs.writeFileSync(envPath, envContent, "utf8");
        }
      } catch (envErr) {
        console.error("Failed to update .env for SMTP:", envErr);
      }
    }

    const hasRealSmtp = Boolean(
      process.env.EMAIL_SERVER_USER &&
      process.env.EMAIL_SERVER_PASSWORD &&
      process.env.EMAIL_SERVER_USER.trim() !== "" &&
      process.env.EMAIL_SERVER_PASSWORD.trim() !== ""
    );

    return NextResponse.json({
      ...updated,
      hasRealSmtp,
      smtpUser: process.env.EMAIL_SERVER_USER || "",
    });
  } catch (err: any) {
    console.error("Preferences update error:", err);
    return NextResponse.json({ error: "Failed to save preferences" }, { status: 500 });
  }
}
