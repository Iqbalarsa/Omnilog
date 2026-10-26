import nodemailer from "nodemailer";
import { prisma } from "./prisma";

export async function createTransporter() {
  const host = process.env.EMAIL_SERVER_HOST;
  const port = Number(process.env.EMAIL_SERVER_PORT) || 587;
  const user = process.env.EMAIL_SERVER_USER;
  const pass = process.env.EMAIL_SERVER_PASSWORD;

  if (user && pass && host) {
    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: {
        user,
        pass,
      },
    });
  }

  // Fallback to test/ethereal account or mock simulation
  return nodemailer.createTransport({
    streamTransport: true,
    newline: "windows",
    buffer: true,
  });
}

export async function checkAndSendDailyReminder(force = false, recipientOverride?: string) {
  // Fetch user preference
  const pref = await prisma.userPreference.findFirst({ where: { id: 1 } });
  if (!pref && !force) {
    return { status: "skipped", reason: "Preferences not found." };
  }
  if (pref && !pref.isReminderActive && !force) {
    return { status: "skipped", reason: "Reminders are deactivated." };
  }

  const recipientEmail = recipientOverride || pref?.reminderEmail || "iqbalarsa99@gmail.com";

  // Persist recipient email if overridden
  if (recipientOverride) {
    await prisma.userPreference.upsert({
      where: { id: 1 },
      update: { reminderEmail: recipientOverride },
      create: { id: 1, reminderEmail: recipientOverride },
    }).catch(() => {});
  }

  // Calculate start of today (00:00:00)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  // Check if an entry was logged today
  const todayEntriesCount = await prisma.entry.count({
    where: {
      createdAt: {
        gte: todayStart,
      },
    },
  });

  if (todayEntriesCount > 0 && !force) {
    return {
      status: "completed",
      message: "User has already logged reading today. Streak is secure!",
    };
  }

  // Calculate current streak
  const streakInfo = await calculateReadingStreak();

  // Find book currently marked as READING
  const currentBook = await prisma.book.findFirst({
    where: { status: "READING" },
    orderBy: { updatedAt: "desc" },
  });

  const bookTitle = currentBook ? `"${currentBook.title}"` : "your current book";

  const subject = `Keep your streak alive! 5 minutes of reading today? 🔥`;
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Display', 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8f9fa; margin: 0; padding: 24px; color: #1d1d1f; }
        .card { max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 20px; padding: 32px; border: 1px solid rgba(0,0,0,0.08); box-shadow: 0 4px 20px rgba(0,0,0,0.06); }
        .badge { display: inline-block; background-color: rgba(0, 122, 255, 0.12); color: #007aff; font-weight: 700; font-size: 13px; padding: 6px 14px; border-radius: 9999px; margin-bottom: 20px; border: 1px solid rgba(0, 122, 255, 0.25); }
        h1 { font-size: 22px; line-height: 1.3; margin: 0 0 14px 0; color: #1d1d1f; font-weight: 600; letter-spacing: -0.02em; }
        p { font-size: 15px; line-height: 1.6; color: #6e6e73; margin: 0 0 20px 0; }
        .book-box { background: #f4f5f8; border-left: 4px solid #007aff; padding: 14px 18px; border-radius: 12px; margin-bottom: 24px; }
        .btn { display: inline-block; background-color: #007aff; color: #ffffff !important; font-weight: 600; text-decoration: none; padding: 12px 28px; border-radius: 12px; font-size: 14px; box-shadow: 0 2px 8px rgba(0, 122, 255, 0.3); }
        .footer { margin-top: 32px; font-size: 12px; color: #86868b; text-align: center; }
      </style>
    </head>
    <body>
      <div class="card">
        <div class="badge">🔥 Current Streak: ${streakInfo.streak} ${streakInfo.streak === 1 ? "Day" : "Days"}</div>
        <h1>Time for your daily micro-journal?</h1>
        <p>You haven't logged any reading reflections yet today. Just 5 minutes of mindful active recall keeps your momentum rolling.</p>
        <div class="book-box">
          <strong style="color:#007aff; font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em;">Currently Reading:</strong>
          <div style="font-size: 17px; font-weight: 600; margin-top: 4px; color: #1d1d1f;">${bookTitle}</div>
        </div>
        <p>Open OmniLog AI to record a key insight and spar with your Socratic AI companion.</p>
        <a href="http://localhost:3000" class="btn">Open OmniLog AI &rarr;</a>
        <div class="footer">
          OmniLog AI • Universal Knowledge & Reflection Workspace
        </div>
      </div>
    </body>
    </html>
  `;

  const hasRealSmtp = Boolean(
    process.env.EMAIL_SERVER_USER &&
    process.env.EMAIL_SERVER_PASSWORD &&
    process.env.EMAIL_SERVER_USER.trim() !== "" &&
    process.env.EMAIL_SERVER_PASSWORD.trim() !== ""
  );

  if (!hasRealSmtp) {
    console.log(`[Reminder Email (Simulation)] Prepared for ${recipientEmail}. Real SMTP credentials not configured.`);
    return {
      status: "simulated",
      isRealDelivery: false,
      recipient: recipientEmail,
      streak: streakInfo.streak,
      bookTitle,
      message: `Simulated Mode: Email prepared for ${recipientEmail}. Live delivery to your Gmail inbox requires sender credentials (EMAIL_SERVER_USER and Google App Password) in .env or Settings.`,
    };
  }

  try {
    const transporter = await createTransporter();
    const mailOptions = {
      from: process.env.EMAIL_FROM || `OmniLog AI <${process.env.EMAIL_SERVER_USER}>`,
      to: recipientEmail,
      subject,
      html: htmlContent,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`[Reminder Email] Sent to ${recipientEmail}. MessageId:`, info.messageId);

    return {
      status: "sent",
      isRealDelivery: true,
      recipient: recipientEmail,
      streak: streakInfo.streak,
      bookTitle,
      messageId: info.messageId,
      message: `Live email successfully delivered to ${recipientEmail}! Check your inbox.`,
    };
  } catch (sendError: any) {
    console.error("[Reminder Email Error]:", sendError);
    return {
      status: "error",
      isRealDelivery: false,
      recipient: recipientEmail,
      streak: streakInfo.streak,
      bookTitle,
      message: `Failed to deliver email via SMTP: ${sendError.message}`,
    };
  }
}

export async function calculateReadingStreak(): Promise<{
  streak: number;
  hasLoggedToday: boolean;
  totalEntries: number;
  activeBooksCount: number;
  activeDates: string[];
  dailyCounts: Record<string, number>;
  dailyActivity: Record<string, { count: number; types: string[] }>;
}> {
  const entries = await prisma.entry.findMany({
    select: {
      createdAt: true,
      book: {
        select: { type: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalEntries = entries.length;
  const activeBooksCount = await prisma.book.count({
    where: { status: "READING" },
  });

  if (entries.length === 0) {
    return {
      streak: 0,
      hasLoggedToday: false,
      totalEntries: 0,
      activeBooksCount,
      activeDates: [],
      dailyCounts: {},
      dailyActivity: {},
    };
  }

  // Count entries per day and track media types
  const dailyCounts: Record<string, number> = {};
  const dailyActivity: Record<string, { count: number; types: string[] }> = {};

  for (const entry of entries) {
    const d = new Date(entry.createdAt);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const mType = entry.book?.type ? entry.book.type.toUpperCase() : "BOOK";

    dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;

    if (!dailyActivity[dateStr]) {
      dailyActivity[dateStr] = { count: 0, types: [] };
    }
    dailyActivity[dateStr].count += 1;
    if (!dailyActivity[dateStr].types.includes(mType)) {
      dailyActivity[dateStr].types.push(mType);
    }
  }

  const activeDates = Object.keys(dailyCounts);
  const dateSet = new Set<string>(activeDates);

  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const hasLoggedToday = dateSet.has(todayStr);

  let streak = 0;
  let checkDate = new Date(now);

  // If haven't logged today, check if yesterday was logged to keep the streak alive
  if (!hasLoggedToday) {
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (true) {
    const dateStr = `${checkDate.getFullYear()}-${String(checkDate.getMonth() + 1).padStart(2, "0")}-${String(checkDate.getDate()).padStart(2, "0")}`;
    if (dateSet.has(dateStr)) {
      streak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    streak,
    hasLoggedToday,
    totalEntries,
    activeBooksCount,
    activeDates,
    dailyCounts,
    dailyActivity,
  };
}
