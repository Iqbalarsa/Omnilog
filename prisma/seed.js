const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Upsert user preferences
  await prisma.userPreference.upsert({
    where: { id: 1 },
    update: {},
    create: {
      id: 1,
      themeMode: "system",
      themeColor: "amber",
      reminderEmail: "reader@example.com",
      reminderTime: "20:30",
      isReminderActive: true,
    },
  });

  // Check if books already exist
  const count = await prisma.book.count();
  if (count > 0) {
    console.log("Database already seeded with books.");
    return;
  }

  // Today's date and yesterday's date
  const now = new Date();
  const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const twoDaysAgo = new Date(Date.now() - 48 * 60 * 60 * 1000);

  // Book 1: Thinking, Fast and Slow
  const book1 = await prisma.book.create({
    data: {
      title: "Thinking, Fast and Slow",
      author: "Daniel Kahneman",
      coverUrl: "https://books.google.com/books/content?id=ZuODsbCRqRQC&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
      totalPages: 499,
      status: "READING",
      entries: {
        create: [
          {
            content: "Kahneman introduces the two agents of the mind: System 1 (fast, intuitive, emotional, automatic) and System 2 (slow, deliberate, analytical). What struck me most is that System 1 cannot be turned off at will. Even when we believe we are acting purely on logic, our System 2 is often merely rationalizing an instinctual snapshot already framed by System 1.",
            pageNumber: "pp. 19-48",
            createdAt: now,
            aiThreads: {
              create: [
                {
                  sender: "AI",
                  message: "You've pinpointed Kahneman's core tension: System 2 as an apologist rather than an objective judge. But consider an emergency trauma surgeon making split-second decisions: is that rapid choice merely an irrational heuristic prone to bias, or can domain-conditioned intuition bypass System 2 without sacrificing epistemic rigor?",
                  createdAt: new Date(now.getTime() + 10000),
                },
                {
                  sender: "USER",
                  message: "I think deep practice internalizes System 2 rules into System 1 reflexes, transforming deliberate calculation into trained recognition.",
                  createdAt: new Date(now.getTime() + 60000),
                },
                {
                  sender: "AI",
                  message: "That aligns with Gary Klein's naturalistic decision-making. However, Kahneman's caveat is crucial: this trained recognition only functions reliably in high-validity environments with immediate feedback. How would you determine whether your own professional arena provides the objective feedback loop required to trust that intuition?",
                  createdAt: new Date(now.getTime() + 75000),
                },
              ],
            },
          },
          {
            content: "Explored Prospect Theory and loss aversion. The psychological pain of losing $100 is roughly twice as intense as the joy of winning $100. This explains why people cling to failing investments and avoid calculated risks that possess positive expected value.",
            pageNumber: "pp. 280-310",
            createdAt: yesterday,
            aiThreads: {
              create: [
                {
                  sender: "AI",
                  message: "You synthesize the asymmetric valuation curve cleanly. If evolutionary pressures selected for loss aversion to keep our ancestors cautious in mortal environments, what systemic mechanism could an individual engineer today to counteract this built-in asymmetry when evaluating long-term asymmetrical opportunities?",
                  createdAt: new Date(yesterday.getTime() + 15000),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Book 2: Atomic Habits
  await prisma.book.create({
    data: {
      title: "Atomic Habits",
      author: "James Clear",
      coverUrl: "https://books.google.com/books/content?id=fFCjDQAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
      totalPages: 320,
      status: "COMPLETED",
      entries: {
        create: [
          {
            content: "You do not rise to the level of your goals; you fall to the level of your systems. Clear argues that outcome-based habits fail because identity shift is what produces sustained behavior. Environment design matters far more than willpower.",
            pageNumber: "pp. 55-82",
            createdAt: twoDaysAgo,
            aiThreads: {
              create: [
                {
                  sender: "AI",
                  message: "Clear prioritizes frictionless environments over grit. Yet in scenarios where the environment is inherently hostile or unpredictable—such as high-pressure startups or field research—does relying on environmental architecture become a fragile crutch compared to cultivating raw cognitive discipline?",
                  createdAt: new Date(twoDaysAgo.getTime() + 20000),
                },
              ],
            },
          },
        ],
      },
    },
  });

  // Book 3: Klara and the Sun
  await prisma.book.create({
    data: {
      title: "Klara and the Sun",
      author: "Kazuo Ishiguro",
      coverUrl: "https://books.google.com/books/content?id=B5j2DwAAQBAJ&printsec=frontcover&img=1&zoom=1&edge=curl&source=gbs_api",
      totalPages: 303,
      status: "ON_HOLD",
      entries: {
        create: [
          {
            content: "Ishiguro explores loneliness and what it means to love through Klara, an Artificial Friend who perceives human emotions with profound innocence and acute observation.",
            pageNumber: "Ch. 2-3",
            createdAt: new Date(Date.now() - 72 * 60 * 60 * 1000),
          },
        ],
      },
    },
  });

  console.log("Seeding complete! Added initial books and journals.");
}

main()
  .catch((e) => {
    console.error("Seeding error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
