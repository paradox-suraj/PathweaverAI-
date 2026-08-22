import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { courseService } from "@/server/services/course.service";
import { progressService } from "@/server/services/progress.service";
import { LessonWorkspace } from "./lesson-workspace";

function extractYouTubeId(url: string | null) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

export default async function LessonPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string; lessonId: string }>;
  searchParams: Promise<{ tab?: string }>;
}) {
  const { id, lessonId } = await params;
  const { tab } = await searchParams;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Fetch current lesson and course context
  const course = await courseService.getCourseWithTopics(id, session.user.id);

  if (!course) {
    redirect("/dashboard");
  }

  // Find the current lesson and the next lesson
  let currentLesson = null;
  let nextLessonId = null;
  let foundCurrent = false;

  for (const module of course.modules) {
    for (const topic of module.topics) {
      if (foundCurrent && !nextLessonId) {
        nextLessonId = topic.id;
        break;
      }
      if (topic.id === lessonId) {
        currentLesson = topic;
        foundCurrent = true;
      }
    }
  }

  if (!currentLesson) {
    redirect(`/courses/${course.id}`);
  }

  const youtubeId = currentLesson.resources[0]?.videoResource?.youtubeVideoId || null;
  const isCompleted = await progressService.isTopicCompleted(session.user.id, currentLesson.id);

  return (
    <LessonWorkspace
      course={course}
      currentLesson={currentLesson}
      nextLessonId={nextLessonId}
      isCompleted={isCompleted}
      youtubeId={youtubeId}
      initialTab={tab as "read" | "notes" | "chat" | "quiz" | undefined}
    />
  );
}
