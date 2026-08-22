import { Queue } from "bullmq";
import { redis } from "@/lib/redis";
import "@/server/workers/course.worker";

// Define the payload structure for the background job
export interface CourseGenerationJobData {
  courseId: string;
  userId: string;
  topic: string;
  level: string;
  hoursPerDay: number;
  deadlineDate?: string;
  sourceType?: string;
  sourceContent?: string;
}

const globalForQueue = global as unknown as { courseQueue: Queue };

export const courseQueue =
  globalForQueue.courseQueue ||
  new Queue("course-generation", { connection: redis });

if (process.env.NODE_ENV !== "production") {
  globalForQueue.courseQueue = courseQueue;
}

export async function enqueueCourseGeneration(data: CourseGenerationJobData) {
  return courseQueue.add("generate", data, {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 10000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  });
}
