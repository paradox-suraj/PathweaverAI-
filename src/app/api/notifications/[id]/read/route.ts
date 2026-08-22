import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { notificationService } from "@/server/services/notification.service";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    await notificationService.markAsRead(id, session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Mark Read Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to mark as read" },
      { status: 500 }
    );
  }
}
