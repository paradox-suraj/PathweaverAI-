"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";
import { createWatchParty, deleteWatchParty } from "@/lib/watchParty";

export async function createLiveParty({
  courseId,
  title,
  description,
  maxParticipants,
  scheduledAt,
}: {
  courseId: string;
  title: string;
  description?: string;
  maxParticipants: number;
  scheduledAt?: string; // ISO date string
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    // Verify course exists and belongs to user
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });
    if (!course || course.userId !== session.user.id) {
      throw new Error("Course not found or unauthorized");
    }

    const partyId = crypto.randomUUID();

    const dbParty = await prisma.liveParty.create({
      data: {
        id: partyId,
        hostId: session.user.id,
        courseId,
        title,
        description,
        maxParticipants,
        status: scheduledAt ? "SCHEDULED" : "LIVE",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
      },
    });

    if (!scheduledAt) {
      // If it's live immediately, also create the Redis state
      await createWatchParty(partyId, courseId, session.user.id);
    }

    revalidatePath("/community");
    revalidatePath("/live-parties");
    
    return { success: true, partyId: dbParty.id };
  } catch (error: any) {
    console.error("Error creating live party:", error);
    return { success: false, error: error.message };
  }
}

export async function endLiveParty(partyId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const party = await prisma.liveParty.findUnique({ where: { id: partyId } });
    if (!party || party.hostId !== session.user.id) {
      throw new Error("Unauthorized");
    }

    await prisma.liveParty.update({
      where: { id: partyId },
      data: { status: "ENDED" },
    });

    await deleteWatchParty(partyId);

    revalidatePath("/community");
    revalidatePath("/live-parties");

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

export async function getCourseLessonsForParty(courseId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        modules: {
          orderBy: { order: "asc" },
          include: {
            topics: {
              orderBy: { order: "asc" },
              include: {
                resources: {
                  where: { type: "VIDEO" },
                  include: { videoResource: true }
                }
              }
            }
          }
        }
      }
    });

    if (!course) throw new Error("Course not found");

    const formattedModules = course.modules.map(m => ({
      id: m.id,
      title: m.title,
      lessons: m.topics.map(t => ({
        id: t.id,
        title: t.title,
        videoId: t.resources[0]?.videoResource?.youtubeVideoId
      })).filter(l => l.videoId)
    }));

    return { success: true, modules: formattedModules };
  } catch (error: any) {
    console.error("Error fetching course lessons:", error);
    return { success: false, error: error.message };
  }
}
