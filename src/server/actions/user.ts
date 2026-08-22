"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function updateProfile({
  name,
  username,
  bio,
  imageBase64,
}: {
  name: string;
  username: string;
  bio: string;
  imageBase64?: string;
}) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      throw new Error("Unauthorized");
    }

    const userId = session.user.id;

    // Clean username (e.g., remove leading @, lowercase, no spaces)
    const cleanedUsername = username.replace(/^@/, "").trim().toLowerCase().replace(/\s+/g, "_");

    if (cleanedUsername.length > 0) {
      // Check if username is already taken by someone else
      const existingUser = await prisma.user.findFirst({
        where: {
          username: cleanedUsername,
          id: { not: userId },
        },
      });

      if (existingUser) {
        return { success: false, error: "Username is already taken." };
      }
    }

    // Update User model (name, username, and optionally image)
    const userUpdateData: any = {
      name,
      username: cleanedUsername.length > 0 ? cleanedUsername : null,
    };

    if (imageBase64) {
      userUpdateData.image = imageBase64;
    }

    await prisma.user.update({
      where: { id: userId },
      data: userUpdateData,
    });

    // Update or create UserProfile for bio
    await prisma.userProfile.upsert({
      where: { userId },
      create: {
        userId,
        bio,
      },
      update: {
        bio,
      },
    });

    revalidatePath(`/profile/${userId}`);
    return { success: true };
  } catch (error: any) {
    console.error("Error updating profile:", error);
    return { success: false, error: error.message || "Failed to update profile." };
  }
}
