"use server";

import { z } from "zod";
import { CourseGenerationSchema } from "../schema/course";
import { auth } from "@/auth";
import { courseService } from "../services/course.service";
import { enqueueCourseGeneration } from "../queues/course.queue";
import { prisma } from "@/lib/prisma";
import { differenceInMinutes } from "date-fns";
import { headers } from "next/headers";
import { aiRateLimiter } from "@/lib/rate-limit";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function generateCourse(data: z.infer<typeof CourseGenerationSchema>) {
  try {
    const parsed = CourseGenerationSchema.parse(data);

    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized. Please log in.");
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await aiRateLimiter.check(ip);

    if (!rateLimitResult.success) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const course = await courseService.createInitialCourse(session.user.id, parsed.topic, parsed.isPublic);

    // Kicks off background generation via BullMQ
    enqueueCourseGeneration({
      courseId: course.id, 
      userId: session.user.id, 
      topic: parsed.topic, 
      level: parsed.level, 
      hoursPerDay: parsed.hoursPerDay,
      deadlineDate: parsed.deadlineDate,
      sourceType: parsed.sourceType,
      sourceContent: parsed.sourceContent
    }).catch(console.error);

    return { success: true, courseId: course.id };
  } catch (error: any) {
    console.error("Error generating course:", error);
    return { success: false, error: error.message };
  }
}

export async function checkCourseStatus(courseId: string) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized");
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId, userId: session.user.id },
      select: { status: true, statusMessage: true, createdAt: true },
    });

    if (!course) {
      return { success: false, error: "Course not found" };
    }

    // Auto-Fail Stale Generations
    // If the course has been GENERATING for more than 3 minutes, assume the background 
    // task was killed by a serverless timeout and manually force a FAILED state.
    if (course.status === "GENERATING") {
      const minsSinceCreation = differenceInMinutes(new Date(), new Date(course.createdAt));
      if (minsSinceCreation >= 3) {
        await prisma.course.update({
          where: { id: courseId },
          data: { 
            status: "FAILED", 
            statusMessage: "Generation timed out. Please try again." 
          },
        }).catch(console.error);
        
        return { success: true, status: "FAILED", statusMessage: "Generation timed out. Please try again." };
      }
    }

    return { success: true, status: course.status, statusMessage: course.statusMessage };
  } catch (error: any) {
    console.error("Error checking course status:", error);
    return { success: false, error: error.message };
  }
}

export async function deleteCourse(courseId: string) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized");
    }

    // Prisma's cascade delete handles all nested records
    await prisma.course.delete({
      where: { id: courseId, userId: session.user.id },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error deleting course:", error);
    return { success: false, error: error.message };
  }
}

export async function toggleCoursePrivacy(courseId: string, isPublic: boolean) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized");
    }

    const course = await prisma.course.findUnique({
      where: { id: courseId, userId: session.user.id },
    });

    if (!course) {
      throw new Error("Course not found or unauthorized");
    }

    await prisma.course.update({
      where: { id: courseId },
      data: { isPublic },
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error toggling course privacy:", error);
    return { success: false, error: error.message };
  }
}

export async function generateMissingArticleAction(topicId: string) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized");
    }

    await courseService.regenerateArticleForTopic(topicId, session.user.id);
    return { success: true };
  } catch (error: any) {
    console.error("Error generating missing article:", error);
    return { success: false, error: error.message };
  }
}

export async function updateArticleAction(topicId: string, content: string) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized");
    }

    // Verify ownership
    const topic = await prisma.topic.findUnique({
      where: { id: topicId },
      include: {
        module: {
          include: { course: true }
        }
      }
    });

    if (!topic || topic.module.course.userId !== session.user.id) {
      throw new Error("Topic not found or unauthorized");
    }

    const learningResource = await prisma.learningResource.findFirst({
      where: { topicId, type: "ARTICLE" },
      include: { articleResource: true }
    });

    if (!learningResource || !learningResource.articleResource) {
      throw new Error("Article resource not found");
    }

    await prisma.articleResource.update({
      where: { learningResourceId: learningResource.id },
      data: { content }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error updating article:", error);
    return { success: false, error: error.message };
  }
}

export async function regenerateTextAction(selectedText: string, context: string) {
  try {
    const session = await auth();
    if (!session || !session.user || !session.user.id) {
      throw new Error("Unauthorized");
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await aiRateLimiter.check(ip);

    if (!rateLimitResult.success) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    const prompt = `
You are an expert educational course creator. The user has selected a specific piece of text from a lesson article and wants you to rewrite it.

Original Text:
"${selectedText}"

Broader Context (for your reference):
"${context}"

Please provide a polished, clear, and highly educational rewrite of the Original Text. Do not wrap your response in markdown code blocks unless the text itself contains code. Just output the raw rewritten text in Markdown format. Keep the length and tone appropriate for a deep dive educational article. Fix any hallucinations or factual errors if present.
`;

    const response = await generateText({
      model: google("gemini-3.6-flash"),
      system: `You are an expert educational author. You have been asked to rewrite a specific excerpt from a lesson's Deep Dive article.`,
      prompt,
      temperature: 0.5,
    });

    return { success: true, newText: response.text };
  } catch (error: any) {
    console.error("Error regenerating text:", error);
    return { success: false, error: error.message };
  }
}
