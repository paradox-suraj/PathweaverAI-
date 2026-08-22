import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { courseService } from "@/server/services/course.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: courseId } = await params;
    const result = await courseService.publishCourse(courseId, session.user.id);

    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Publish Course Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to publish course" },
      { status: 500 }
    );
  }
}
