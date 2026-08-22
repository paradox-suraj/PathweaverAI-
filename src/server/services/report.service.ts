import { prisma } from "@/lib/prisma";
import { aiService } from "./ai.service";
import { notificationService } from "./notification.service";

export const reportService = {
  /**
   * Submit a report and trigger background auto-moderation
   */
  async reportCourse(courseId: string, reporterId: string, reason: string) {
    const report = await prisma.courseReport.create({
      data: {
        courseId,
        reporterId,
        reason,
        status: "PENDING",
      },
    });

    // Fire-and-forget auto-moderation
    this.autoModerateCourse(courseId, report.id).catch(console.error);

    return report;
  },

  /**
   * Auto-moderate a reported course using AI
   */
  async autoModerateCourse(courseId: string, reportId: string) {
    const report = await prisma.courseReport.findUnique({
      where: { id: reportId },
      include: { reporter: true, course: { include: { user: true } } },
    });

    if (!report || !report.course) return;

    const evalResult = await aiService.evaluateCourseViolation(
      report.course.title,
      report.course.description,
      report.reason
    );

    if (evalResult.isViolating && evalResult.confidence > 0.7) {
      // 1. Un-publish course
      await prisma.course.update({
        where: { id: courseId },
        data: { isPublished: false, statusMessage: "Removed due to policy violation" },
      });

      // 2. Mark report resolved
      await prisma.courseReport.update({
        where: { id: reportId },
        data: { status: "RESOLVED_REMOVED" },
      });

      // 3. Notify Publisher
      await notificationService.createNotification({
        userId: report.course.userId,
        title: "Course Removed",
        message: `Your course "${report.course.title}" was removed for violating community policies. Reason: ${evalResult.reasoning}`,
        type: "COURSE_REMOVED",
      });

      // 4. Notify Reporter
      await notificationService.createNotification({
        userId: report.reporterId,
        title: "Report Resolved",
        message: `Thank you for your report. The course "${report.course.title}" has been reviewed and removed.`,
        type: "REPORT_RESOLVED",
      });
    } else {
      // Mark report resolved (kept)
      await prisma.courseReport.update({
        where: { id: reportId },
        data: { status: "RESOLVED_KEPT" },
      });

      // Optionally notify reporter
      await notificationService.createNotification({
        userId: report.reporterId,
        title: "Report Reviewed",
        message: `We reviewed your report for "${report.course.title}", but it did not meet the criteria for removal.`,
        type: "REPORT_RESOLVED",
      });
    }
  },
};
