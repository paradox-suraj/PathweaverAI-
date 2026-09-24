"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { progressService } from "../services/progress.service";
import { prisma } from "@/lib/prisma";

export async function completeLesson(lessonId: string, courseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    await progressService.markTopicCompleted(session.user.id, lessonId, courseId);

    // Revalidate the course overview and lesson pages
    revalidatePath(`/courses/${courseId}`);
    revalidatePath(`/courses/${courseId}/lesson/${lessonId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error completing lesson:", error);
    return { success: false, error: error.message || "Failed to mark lesson as complete" };
  }
}

export async function logEvent(
  eventType: string,
  resourceId?: string,
  metadata?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await progressService.logEvent(
      session.user.id,
      eventType,
      undefined, // sessionId
      resourceId,
      metadata
    );

    return { success: true };
  } catch (error: any) {
    console.error("Error logging event:", error);
    return { success: false, error: error.message };
  }
}

export async function getNote(topicId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    const note = await prisma.lessonNote.findUnique({
      where: {
        userId_topicId: {
          userId: session.user.id,
          topicId
        }
      }
    });

    return { success: true, note: note?.content || "" };
  } catch (error: any) {
    console.error("Error fetching note:", error);
    return { success: false, error: error.message };
  }
}

export async function saveNote(topicId: string, content: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    await prisma.lessonNote.upsert({
      where: {
        userId_topicId: {
          userId: session.user.id,
          topicId
        }
      },
      update: { content },
      create: {
        userId: session.user.id,
        topicId,
        content
      }
    });

    return { success: true };
  } catch (error: any) {
    console.error("Error saving note:", error);
    return { success: false, error: error.message };
  }
}
