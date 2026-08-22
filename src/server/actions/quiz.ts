"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { aiService } from "../services/ai.service";
import { progressService } from "../services/progress.service";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { aiRateLimiter } from "@/lib/rate-limit";

/**
 * Verifies that a topic belongs to the authenticated user's course.
 * Returns the topic if ownership is confirmed, null otherwise.
 */
async function verifyTopicOwnership(topicId: string, userId: string) {
  const topic = await prisma.topic.findUnique({
    where: { id: topicId },
    include: {
      module: {
        include: { course: { select: { userId: true } } }
      }
    }
  });

  if (!topic || topic.module.course.userId !== userId) {
    return null;
  }
  return topic;
}

export async function getOrGenerateQuiz(topicId: string, forceRegenerate: boolean = false) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Verify ownership before accessing quiz data
    const topic = await verifyTopicOwnership(topicId, session.user.id);
    if (!topic) return { success: false, error: "Topic not found or access denied" };

    // Check if a quiz already exists for this topic
    const existingQuiz = await prisma.quiz.findFirst({
      where: { topicId },
      include: { questions: true }
    });

    if (existingQuiz && !forceRegenerate) {
      return { success: true, quiz: existingQuiz };
    }

    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || "unknown";
    const rateLimitResult = await aiRateLimiter.check(ip);

    if (!rateLimitResult.success) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }

    // Generate new quiz
    const quizData = await aiService.generateQuiz(topic.title, topic.description || "Core concepts.", forceRegenerate, session.user.id);

    let finalQuiz;

    if (existingQuiz && forceRegenerate) {
      // Overwrite existing questions
      finalQuiz = await prisma.quiz.update({
        where: { id: existingQuiz.id },
        data: {
          questions: {
            deleteMany: {},
            create: quizData.questions.map(q => ({
              text: q.text,
              options: JSON.stringify(q.options),
              correctAnswer: q.correctAnswerIndex,
              explanation: q.explanation
            }))
          }
        },
        include: { questions: true }
      });
    } else {
      // Save to DB
      finalQuiz = await prisma.quiz.create({
        data: {
          title: `Quiz: ${topic.title}`,
          topicId: topic.id,
          questions: {
            create: quizData.questions.map(q => ({
              text: q.text,
              options: JSON.stringify(q.options),
              correctAnswer: q.correctAnswerIndex,
              explanation: q.explanation
            }))
          }
        },
        include: { questions: true }
      });
    }

    return { success: true, quiz: finalQuiz };
  } catch (error: any) {
    console.error("Error generating quiz:", error);
    return { success: false, error: error.message };
  }
}

export async function submitQuizAttempt(quizId: string, score: number) {
  try {
    const session = await auth();
    if (!session?.user?.id) return { success: false, error: "Unauthorized" };

    // Verify quiz ownership via topic -> module -> course chain
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        topic: {
          include: {
            module: {
              include: { course: { select: { userId: true } } }
            }
          }
        }
      }
    });

    if (!quiz) return { success: false, error: "Quiz not found" };
    if (quiz.topic.module.course.userId !== session.user.id) {
      return { success: false, error: "Access denied" };
    }

    const attempt = await prisma.quizAttempt.create({
      data: {
        quizId,
        userId: session.user.id,
        score
      }
    });

    // Update mastery score and SRS review queue
    await progressService.upsertTopicMastery(session.user.id, quiz.topicId, score);

    // Gamification
    const { gamificationService } = await import("@/server/services/gamification.service");
    let xp = 20; // Base XP for completing a quiz
    if (score >= 100) {
      xp += 30; // Perfect score bonus
    }
    await gamificationService.awardXp(session.user.id, xp, "QUIZ_COMPLETED", quizId);

    revalidatePath(`/courses/${quiz.topic.module.courseId}/lesson/${quiz.topicId}`);
    return { success: true, attempt };
  } catch (error: any) {
    console.error("Error saving quiz attempt:", error);
    return { success: false, error: error.message };
  }
}
