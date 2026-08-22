import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { notificationService } from "@/server/services/notification.service";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const notifications = await notificationService.getUserNotifications(session.user.id);

    return NextResponse.json({ notifications }, {
      headers: {
        "Cache-Control": "private, max-age=30"
      }
    });
  } catch (error: any) {
    console.error("Get Notifications Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch notifications" },
      { status: 500 }
    );
  }
}

export async function POST() {
  // Mark all as read
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await notificationService.markAllAsRead(session.user.id);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Mark All Read Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update notifications" },
      { status: 500 }
    );
  }
}
