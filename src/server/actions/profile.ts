"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function toggleFollow(targetUserId: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");
    if (session.user.id === targetUserId) throw new Error("Cannot follow yourself");

    const existingFollow = await prisma.follow.findUnique({
      where: {
        followerId_followingId: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      },
    });

    if (existingFollow) {
      await prisma.follow.delete({
        where: { id: existingFollow.id },
      });
    } else {
      await prisma.follow.create({
        data: {
          followerId: session.user.id,
          followingId: targetUserId,
        },
      });
    }

    revalidatePath(`/profile/${targetUserId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error toggling follow:", error);
    return { success: false, error: error.message };
  }
}

export async function updateProfileBio(bio: string) {
  try {
    const session = await auth();
    if (!session?.user?.id) throw new Error("Unauthorized");

    await prisma.userProfile.upsert({
      where: { userId: session.user.id },
      update: { bio },
      create: { userId: session.user.id, bio },
    });

    revalidatePath(`/profile/${session.user.id}`);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
