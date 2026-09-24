import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { gamificationService } from "@/server/services/gamification.service";

export async function GET(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;
    const { searchParams } = new URL(req.url);
    const year = searchParams.get("year");
    const month = searchParams.get("month"); // 1-indexed

    let dateQuery = {};
    if (year && month) {
      const prefix = `${year}-${month.padStart(2, "0")}`;
      dateQuery = {
        date: {
          startsWith: prefix
        }
      };
    }

    // Fetch active dates
    const activeDates = await prisma.userActivityDate.findMany({
      where: {
        userId,
        ...dateQuery
      },
      select: {
        date: true
      }
    });

    // Fetch daily tasks
    const dailyTasks = await gamificationService.getDailyTasks(userId);
    
    // Fetch user stat for current streak
    const userStat = await gamificationService.getUserStat(userId);

    return NextResponse.json({
      activeDates: activeDates.map((d: { date: string }) => d.date),
      dailyTasks,
      streak: userStat.currentStreak
    });
  } catch (error) {
    console.error("[STREAK_GET_ERROR]", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
