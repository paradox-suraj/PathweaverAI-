import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { gamificationService } from "@/server/services/gamification.service";

export async function POST(req: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { taskId } = body;

    if (!taskId) {
      return NextResponse.json({ error: "Task ID is required" }, { status: 400 });
    }

    const result = await gamificationService.claimDailyTask(session.user.id, taskId);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("[STREAK_TASK_POST_ERROR]", error);
    return NextResponse.json({ error: error.message || "Internal Server Error" }, { status: 500 });
  }
}
