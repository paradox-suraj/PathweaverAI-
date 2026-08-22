"use server";

import { auth } from "@/auth";
import { revalidatePath } from "next/cache";
import { scheduleService } from "../services/schedule.service";

export async function replanScheduleAction(
  courseId: string,
  hoursPerDay: number,
  deadlineDate?: string
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return { success: false, error: "Unauthorized" };
    }

    if (hoursPerDay < 1) {
      return { success: false, error: "Hours per day must be at least 1." };
    }

    await scheduleService.adaptiveReplan(
      courseId,
      session.user.id,
      hoursPerDay,
      deadlineDate
    );

    revalidatePath("/dashboard");
    revalidatePath(`/courses/${courseId}`);

    return { success: true };
  } catch (error: any) {
    console.error("Error replanning schedule:", error);
    return { success: false, error: error.message || "Failed to replan schedule" };
  }
}
