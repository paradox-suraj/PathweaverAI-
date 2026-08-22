import { prisma } from "@/lib/prisma";

export class ProgressService {
  /**
   * Tracks a topic completion event
   */
  async markTopicCompleted(userId: string, topicId: string, courseId: string) {
    // 1. Validate ownership
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        module: {
          include: {
            course: true,
          },
        },
      },
    });

    if (!topic || topic.module.course.userId !== userId) {
      throw new Error("Unauthorized to modify this topic");
    }

    // 2. Wrap all modifications in a transaction
    const { gamificationService } = await import("./gamification.service");

    const event = await prisma.$transaction(async (tx) => {
      const newEvent = await tx.learningEvent.create({
        data: {
          userId,
          eventType: "TOPIC_COMPLETED",
          resourceId: topicId,
          metadata: JSON.stringify({ courseId, completedAt: new Date().toISOString() }),
        },
      });

      // Update StudyTask status to COMPLETED if it exists
      const studyPlan = await tx.studyPlan.findFirst({
        where: { userId, courseId }
      });

      if (studyPlan) {
        await tx.studyTask.updateMany({
          where: {
            planId: studyPlan.id,
            topicId: topicId,
          },
          data: {
            status: "COMPLETED"
          }
        });
      }

      // Gamification & Topic Mastery Updates
      await gamificationService.awardXp(userId, 50, "LESSON_COMPLETED", topicId, tx);

      return newEvent;
    });
    
    return event;
  }

  /**
   * Checks if a topic is completed by the user
   */
  async isTopicCompleted(userId: string, topicId: string) {
    const event = await prisma.learningEvent.findFirst({
      where: {
        userId,
        resourceId: topicId,
        eventType: "TOPIC_COMPLETED",
      },
    });
    return !!event;
  }

  /**
   * Gets a set of all completed topic IDs for a user
   */
  async getCompletedTopicIds(userId: string): Promise<Set<string>> {
    const events = await prisma.learningEvent.findMany({
      where: {
        userId,
        eventType: "TOPIC_COMPLETED",
        resourceId: { not: null }
      },
      select: { resourceId: true }
    });
    
    return new Set(events.map(e => e.resourceId as string));
  }

  /**
   * General purpose event logging
   */
  async logEvent(
    userId: string,
    eventType: string,
    sessionId?: string,
    resourceId?: string,
    metadata?: string
  ) {
    return prisma.learningEvent.create({
      data: {
        userId,
        eventType,
        sessionId,
        resourceId,
        metadata,
      }
    });
  }

  /**
   * Upserts the mastery level for a topic based on quiz score and schedules SRS review
   */
  async upsertTopicMastery(userId: string, topicId: string, score: number) {
    const masteryLevel = score / 100;
    
    return prisma.$transaction(async (tx) => {
      // Fetch existing mastery to increment review count
      const existingMastery = await tx.topicMastery.findUnique({
        where: { userId_topicId: { userId, topicId } }
      });

      const currentReviewCount = existingMastery?.reviewCount || 0;
      const newReviewCount = currentReviewCount + 1;

      // SRS Algorithm (Simplified SuperMemo-2)
      let nextReviewDays = 1;
      if (masteryLevel >= 0.8) {
        nextReviewDays = 3 * newReviewCount;
      } else if (masteryLevel >= 0.5) {
        nextReviewDays = 1 * newReviewCount;
      } else {
        nextReviewDays = 1;
      }

      const nextReviewDate = new Date();
      nextReviewDate.setDate(nextReviewDate.getDate() + nextReviewDays);
      
      const mastery = await tx.topicMastery.upsert({
        where: {
          userId_topicId: { userId, topicId }
        },
        create: {
          userId,
          topicId,
          masteryLevel,
          confidence: 1.0,
          nextReviewDate,
          reviewCount: newReviewCount
        },
        update: {
          masteryLevel,
          confidence: 1.0,
          nextReviewDate,
          reviewCount: newReviewCount
        }
      });

      // We must find the user's StudyPlan for this course to link the StudyTask
      const topic = await tx.topic.findUnique({
        where: { id: topicId },
        include: { module: true }
      });

      if (topic) {
        const studyPlan = await tx.studyPlan.findFirst({
          where: { userId, courseId: topic.module.courseId }
        });

        if (studyPlan) {
          // Find existing pending REVIEW task for this topic, if any
          const existingReviewTask = await tx.studyTask.findFirst({
            where: {
              planId: studyPlan.id,
              topicId: topicId,
              status: "PENDING",
              taskType: "REVIEW"
            }
          });

          if (existingReviewTask) {
            // Update the schedule
            await tx.studyTask.update({
              where: { id: existingReviewTask.id },
              data: { scheduledAt: nextReviewDate }
            });
          } else {
            // Create new REVIEW task
            await tx.studyTask.create({
              data: {
                planId: studyPlan.id,
                topicId: topicId,
                title: `Review: ${topic.title}`,
                status: "PENDING",
                taskType: "REVIEW",
                scheduledAt: nextReviewDate
              }
            });
          }
        }
      }

      return mastery;
    });
  }

  /**
   * Gets a map of topic masteries for a user in a specific course
   */
  async getTopicMasteries(userId: string, courseId: string): Promise<Record<string, number>> {
    const masteries = await prisma.topicMastery.findMany({
      where: {
        userId,
        topic: {
          module: {
            courseId
          }
        }
      },
      select: {
        topicId: true,
        masteryLevel: true
      }
    });

    const masteryMap: Record<string, number> = {};
    for (const m of masteries) {
      masteryMap[m.topicId] = m.masteryLevel;
    }
    return masteryMap;
  }

  /**
   * Calculates the user's current learning streak in days
   */
  async getUserStreak(userId: string): Promise<number> {
    const events = await prisma.learningEvent.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: { createdAt: true }
    });

    if (events.length === 0) return 0;

    let streak = 0;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    let currentDateToCheck = new Date(today);
    
    // We get distinct days where an event occurred
    const eventDays = new Set(
      events.map(e => {
        const d = new Date(e.createdAt);
        d.setHours(0, 0, 0, 0);
        return d.getTime();
      })
    );

    // If there's an event today, streak is at least 1
    if (eventDays.has(currentDateToCheck.getTime())) {
      streak++;
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
    } else {
      // If no event today, check yesterday. If there's one yesterday, streak continues
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
      if (!eventDays.has(currentDateToCheck.getTime())) {
        return 0; // No event today or yesterday, streak is broken
      }
    }

    // Now count backwards continuously
    while (eventDays.has(currentDateToCheck.getTime())) {
      streak++;
      currentDateToCheck.setDate(currentDateToCheck.getDate() - 1);
    }

    return streak;
  }
}

export const progressService = new ProgressService();
