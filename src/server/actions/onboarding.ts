"use server";

import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function setPrimaryGoal(title: string) {
  const session = await auth();
  
  if (!session?.user?.id) {
    return { success: false, error: "Unauthorized" };
  }

  // Verify user exists in the database
  const user = await prisma.user.findUnique({
    where: { id: session.user.id }
  });

  if (!user) {
    return { success: false, error: "User record not found in the database. Your session may be stale due to a database reset. Please sign out and sign in again." };
  }

  // Create the learning goal
  try {
    await prisma.learningGoal.create({
      data: {
        userId: session.user.id,
        title,
      },
    });
    return { success: true };
  } catch (error: any) {
    console.error("Error setting primary goal:", error);
    if (error.code === 'P2003') {
       return { success: false, error: "Database relation error: Ensure your user account is active." };
    }
    return { success: false, error: "Failed to set primary goal" };
  }
}
