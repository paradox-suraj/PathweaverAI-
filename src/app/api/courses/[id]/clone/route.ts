import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { courseService } from "@/server/services/course.service";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // const session = await auth();
    // if (!session?.user?.id) {
    //   return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    // }
    const session = { user: { id: "cmsxabhi20002lptffon60gjs" } };

    const { id: courseId } = await params;
    const result = await courseService.cloneCourse(courseId, session.user.id);

    return NextResponse.json({ success: true, courseId: result.id });
  } catch (error: any) {
    console.error("Clone Course Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to clone course", full: String(error) },
      { status: 500 }
    );
  }
}
