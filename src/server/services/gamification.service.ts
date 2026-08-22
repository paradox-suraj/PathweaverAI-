import { prisma } from "@/lib/prisma";

export const BADGES = [
  { id: "first_lesson", title: "First Steps", description: "Completed your first lesson" },
  { id: "master", title: "Master", description: "Complete 50 lessons" },
  { id: "three_streak", title: "Consistency is Key", description: "Achieved a 3-day learning streak" },
  { id: "seven_streak", title: "Unstoppable", description: "Achieved a 7-day learning streak" },
  { id: "thirty_streak", title: "Force of Nature", description: "Achieved a 30-day learning streak" },
  { id: "flawless_victory", title: "Flawless Victory", description: "Get a perfect score on 1 quiz" },
  { id: "quiz_master", title: "Quiz Master", description: "Get a perfect score on 5 quizzes" },
  { id: "goal_crusher", title: "Goal Crusher", description: "Complete 1 overarching learning goal" },
  { id: "polymath", title: "Polymath", description: "Complete 3 overarching learning goals" }
];

export class GamificationService {
  /**
   * Initializes or fetches user stats
   */
  async getUserStat(userId: string, tx: any = prisma) {
    let stat = await tx.userStat.findUnique({ where: { userId } });
    if (!stat) {
      stat = await tx.userStat.create({ data: { userId } });
    }
    return stat;
  }

  /**
   * Awards XP to a user and logs the event
   */
  async awardXp(userId: string, xpAmount: number, eventType: string, resourceId?: string, txClient?: any) {
    if (xpAmount <= 0) return;

    const execute = async (tx: any) => {
      // 1. Log event
      await tx.learningEvent.create({
        data: {
          userId,
          eventType,
          resourceId,
          xpEarned: xpAmount
        }
      });

      // 2. Update UserStat
      await tx.userStat.upsert({
        where: { userId },
        update: { xp: { increment: xpAmount } },
        create: { userId, xp: xpAmount }
      });

      // 3. Update streak & check badges
      await this.updateStreak(userId, tx);
      await this.checkBadges(userId, tx);
    };

    if (txClient) {
      await execute(txClient);
    } else {
      await prisma.$transaction(execute);
    }
  }

  /**
   * Evaluates the daily streak
   */
  async updateStreak(userId: string, tx: any = prisma) {
    const stat = await this.getUserStat(userId, tx);
    const now = new Date();
    // Normalize to midnight to compare days accurately
    const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));

    if (!stat.lastActiveDate) {
      await tx.userStat.update({
        where: { userId },
        data: { currentStreak: 1, longestStreak: 1, lastActiveDate: today }
      });
      return;
    }

    const lastActive = new Date(Date.UTC(stat.lastActiveDate.getUTCFullYear(), stat.lastActiveDate.getUTCMonth(), stat.lastActiveDate.getUTCDate()));
    const diffTime = today.getTime() - lastActive.getTime();
    const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      // Consecutive day
      const newStreak = stat.currentStreak + 1;
      await tx.userStat.update({
        where: { userId },
        data: {
          currentStreak: newStreak,
          longestStreak: Math.max(stat.longestStreak, newStreak),
          lastActiveDate: today
        }
      });
    } else if (diffDays > 1) {
      // Streak broken
      await tx.userStat.update({
        where: { userId },
        data: {
          currentStreak: 1,
          lastActiveDate: today
        }
      });
    }
  }

  /**
   * Checks for newly earned badges
   */
  async checkBadges(userId: string, tx: any = prisma) {
    const stat = await this.getUserStat(userId, tx);
    
    const masteriesCount = await tx.topicMastery.count({
      where: { userId, masteryLevel: { gt: 0 } }
    });

    const perfectQuizzesCount = await tx.quizAttempt.count({
      where: { userId, score: { gte: 100 } }
    });

    const learningGoals = await tx.learningGoal.findMany({
      where: { userId },
      include: { courses: true }
    });
    
    const completedLearningGoals = learningGoals.filter((goal: any) => 
      goal.courses.length > 0 && goal.courses.every((c: any) => c.status === "COMPLETED")
    ).length;

    const existingBadges = await tx.userBadge.findMany({ where: { userId } });
    const existingBadgeIds = new Set(existingBadges.map((b: any) => b.badgeId));

    const newlyEarned = [];

    for (const badge of BADGES) {
      if (existingBadgeIds.has(badge.id)) continue;

      let earned = false;
      if (badge.id === "first_lesson" && masteriesCount >= 1) earned = true;
      if (badge.id === "master" && masteriesCount >= 50) earned = true;
      if (badge.id === "three_streak" && stat.currentStreak >= 3) earned = true;
      if (badge.id === "seven_streak" && stat.currentStreak >= 7) earned = true;
      if (badge.id === "thirty_streak" && stat.currentStreak >= 30) earned = true;
      if (badge.id === "flawless_victory" && perfectQuizzesCount >= 1) earned = true;
      if (badge.id === "quiz_master" && perfectQuizzesCount >= 5) earned = true;
      if (badge.id === "goal_crusher" && completedLearningGoals >= 1) earned = true;
      if (badge.id === "polymath" && completedLearningGoals >= 3) earned = true;

      if (earned) {
        newlyEarned.push({ userId, badgeId: badge.id });
      }
    }

    if (newlyEarned.length > 0) {
      await tx.userBadge.createMany({ data: newlyEarned });
    }
  }
}

export const gamificationService = new GamificationService();
