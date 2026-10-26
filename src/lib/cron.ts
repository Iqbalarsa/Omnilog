import cron from "node-cron";
import { checkAndSendDailyReminder } from "./email";
import { prisma } from "./prisma";

let isCronInitialized = false;

export function initCronJobs() {
  if (isCronInitialized) return;
  isCronInitialized = true;

  console.log("[Scheduler] Initializing daily reading reminder cron worker...");

  // Runs every day at 20:30 (8:30 PM) local time as defined in PRD Section 3.D
  cron.schedule("30 20 * * *", async () => {
    console.log("[Scheduler] 20:30 Cron triggered: evaluating daily reading habit...");
    try {
      const result = await checkAndSendDailyReminder();
      console.log("[Scheduler] Cron execution result:", result);
    } catch (err) {
      console.error("[Scheduler] Error executing reminder cron:", err);
    }
  });

  console.log("[Scheduler] Daily reminder scheduled for 20:30.");
}
