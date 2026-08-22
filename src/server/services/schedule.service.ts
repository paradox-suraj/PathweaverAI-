import { prisma } from "@/lib/prisma";
import { progressService } from "./progress.service";

export class ScheduleService {
  /**
   * Generates a StudyPlan and corresponding StudyTasks for a given course.
   */
  async generateStudyPlan(courseId: string, userId: string, hoursPerDay: number, deadlineDate?: string) {
    // 1. Fetch the course and all topics in order
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            topics: {
              orderBy: { order: "asc" }
            }
          }
        }
      }
    });

    if (!course) {
      throw new Error("Course not found");
    }

    // Verify ownership
    if (course.userId !== userId) {
      throw new Error("Access denied: course does not belong to this user");
    }

    // Extract all topics sequentially
    const topics: { id: string; title: string; estimatedMins: number }[] = [];
    for (const module of course.modules) {
      for (const topic of module.topics) {
        topics.push({
          id: topic.id,
          title: topic.title,
          estimatedMins: topic.estimatedMins,
        });
      }
    }

    if (topics.length === 0) return;

    // 2. Create StudyPlan
    const studyPlan = await prisma.studyPlan.create({
      data: {
        userId,
        courseId,
      }
    });

    // 3. Distribute topics over calendar days based on hoursPerDay
    const dailyMinutesGoal = hoursPerDay * 60;
    let currentDate = new Date();
    currentDate.setHours(9, 0, 0, 0); // Start studying at 9 AM
    let currentDayMinutes = 0;

    const tasksData = [];

    for (const topic of topics) {
      if (currentDayMinutes + topic.estimatedMins > dailyMinutesGoal && currentDayMinutes > 0) {
        // Move to the next day if adding this topic exceeds the daily goal
        // and we've already scheduled *something* today.
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
        currentDayMinutes = 0;
      }

      tasksData.push({
        planId: studyPlan.id,
        topicId: topic.id,
        title: topic.title,
        status: "PENDING",
        scheduledAt: new Date(currentDate),
        dueDate: deadlineDate ? new Date(deadlineDate) : null,
      });

      currentDayMinutes += topic.estimatedMins;
      // Increment hours in the current day for the next topic so they don't all stack at 9 AM exactly
      currentDate.setMinutes(currentDate.getMinutes() + topic.estimatedMins);
    }

    // 4. Create all StudyTasks
    await prisma.studyTask.createMany({
      data: tasksData
    });

    return studyPlan;
  }

  /**
   * Fetches the user's upcoming StudyTasks for the active course or all courses
   */
  async getUpcomingTasks(userId: string, courseId?: string, limit = 3) {
    return prisma.studyTask.findMany({
      where: {
        plan: {
          userId: userId,
          ...(courseId ? { courseId } : {})
        },
        status: "PENDING",
        OR: [
          { taskType: "LEARN" },
          { taskType: "REVIEW", scheduledAt: { lte: new Date() } }
        ]
      },
      include: {
        topic: {
          include: {
            module: true
          }
        }
      },
      orderBy: {
        scheduledAt: "asc"
      },
      take: limit
    });
  }

  /**
   * Adapts the study schedule dynamically.
   * Deletes all pending tasks for this plan and redistributes remaining uncompleted topics.
   */
  async adaptiveReplan(courseId: string, userId: string, hoursPerDay: number, deadlineDate?: string) {
    const studyPlan = await prisma.studyPlan.findFirst({
      where: { courseId, userId },
      include: {
        course: {
          include: {
            modules: {
              orderBy: { order: "asc" },
              include: {
                topics: { orderBy: { order: "asc" } }
              }
            }
          }
        }
      }
    });

    if (!studyPlan) throw new Error("Study plan not found for this course.");

    // 1. Delete all pending LEARN tasks for this plan
    // We preserve REVIEW tasks as their timing is based on spaced repetition
    await prisma.studyTask.deleteMany({
      where: {
        planId: studyPlan.id,
        status: "PENDING",
        taskType: "LEARN"
      }
    });

    // 2. Filter out completed topics
    const completedTopicIds = await progressService.getCompletedTopicIds(userId);
    const incompleteTopics: { id: string; title: string; estimatedMins: number }[] = [];

    for (const module of studyPlan.course.modules) {
      for (const topic of module.topics) {
        if (!completedTopicIds.has(topic.id)) {
          incompleteTopics.push({
            id: topic.id,
            title: topic.title,
            estimatedMins: topic.estimatedMins,
          });
        }
      }
    }

    if (incompleteTopics.length === 0) return studyPlan; // Nothing left to schedule

    // 3. Redistribute topics based on new hoursPerDay
    const dailyMinutesGoal = hoursPerDay * 60;
    let currentDate = new Date();
    currentDate.setHours(9, 0, 0, 0);
    let currentDayMinutes = 0;

    const tasksData = [];

    for (const topic of incompleteTopics) {
      if (currentDayMinutes + topic.estimatedMins > dailyMinutesGoal && currentDayMinutes > 0) {
        currentDate.setDate(currentDate.getDate() + 1);
        currentDate.setHours(9, 0, 0, 0);
        currentDayMinutes = 0;
      }

      tasksData.push({
        planId: studyPlan.id,
        topicId: topic.id,
        title: topic.title,
        status: "PENDING",
        scheduledAt: new Date(currentDate),
        dueDate: deadlineDate ? new Date(deadlineDate) : null,
      });

      currentDayMinutes += topic.estimatedMins;
      currentDate.setMinutes(currentDate.getMinutes() + topic.estimatedMins);
    }

    // 4. Create new StudyTasks
    await prisma.studyTask.createMany({
      data: tasksData
    });

    return studyPlan;
  }
}

export const scheduleService = new ScheduleService();
