import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { reportService } from "@/server/services/report.service";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    const body = await request.json();
    const { reason } = body;

    if (!reason) {
      return NextResponse.json({ error: "Reason is required" }, { status: 400 });
    }

    // Check if course exists
    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return NextResponse.json({ error: "Course not found" }, { status: 404 });
    }

    // Prevent reporting your own course
    if (course.userId === session.user.id) {
      return NextResponse.json({ error: "You cannot report your own course" }, { status: 400 });
    }

    const report = await reportService.reportCourse(courseId, session.user.id, reason);

    return NextResponse.json({ success: true, report });
  } catch (error: any) {
    console.error("Report Course Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to report course" },
      { status: 500 }
    );
  }
}
