import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { courseService } from "@/server/services/course.service";
import { CourseGenerationJobData } from "../queues/course.queue";
import { prisma } from "@/lib/prisma";

const globalForWorker = global as unknown as { courseWorker: Worker | undefined };

if (!globalForWorker.courseWorker) {
  globalForWorker.courseWorker = new Worker(
    "course-generation",
    async (job) => {
      const data = job.data as CourseGenerationJobData;
      console.log(`[BullMQ] Starting course generation for courseId: ${data.courseId}`);
      
      try {
        await courseService.populateCourseFromAI(
          data.courseId,
          data.userId,
          data.topic,
          data.level,
          data.hoursPerDay,
          data.deadlineDate,
          data.sourceType,
          data.sourceContent
        );
        console.log(`[BullMQ] Successfully completed course generation for courseId: ${data.courseId}`);
      } catch (error) {
        console.error(`[BullMQ] Job failed for courseId: ${data.courseId}`, error);
        
        // Update database to mark as failed so UI stops spinning
        await prisma.course.update({
          where: { id: data.courseId },
          data: {
            status: "FAILED",
            statusMessage: "Generation failed. Please try again."
          }
        }).catch(() => {});
        
        throw error;
      }
    },
    { connection: redis }
  );

  globalForWorker.courseWorker.on('failed', (job, err) => {
    console.error(`[BullMQ] Job ${job?.id} failed with error: ${err.message}`);
  });
}

export const courseWorker = globalForWorker.courseWorker;
