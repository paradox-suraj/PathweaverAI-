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
    const body = await req.json();
    const { rating, reviewText } = body;

    if (!rating || typeof rating !== "number" || rating < 1 || rating > 5) {
      return NextResponse.json({ error: "Invalid rating" }, { status: 400 });
    }

    const result = await courseService.rateCourse(courseId, session.user.id, rating, reviewText);

    return NextResponse.json({ success: true, rating: result.rating, ratingCount: result.ratingCount });
  } catch (error: any) {
    console.error("Rate Course Error:", error);
    return NextResponse.json(
      { error: error.message || "Failed to rate course" },
      { status: 500 }
    );
  }
}
