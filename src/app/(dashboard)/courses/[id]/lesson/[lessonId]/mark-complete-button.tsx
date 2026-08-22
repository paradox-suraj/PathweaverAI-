"use client";

import { Button } from "@/components/ui/button";
import { completeLesson } from "@/server/actions/progress";
import { CheckCircle2, Loader2, PlayCircle } from "lucide-react";
import { useTransition } from "react";
import { useRouter } from "next/navigation";

export function MarkCompleteButton({
  lessonId,
  isCompleted,
  nextLessonId,
  courseId,
}: {
  lessonId: string;
  isCompleted: boolean;
  nextLessonId: string | null;
  courseId: string;
}) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeLesson(lessonId, courseId);
      if (result.success && nextLessonId) {
        router.push(`/courses/${courseId}/lesson/${nextLessonId}`);
      } else if (result.success && !nextLessonId) {
        router.push(`/courses/${courseId}`);
      }
    });
  };

  if (isCompleted) {
    return (
      <Button
        size="lg"
        variant="outline"
        className="w-full sm:w-auto font-medium text-emerald-600 border-emerald-200 bg-emerald-50 hover:bg-emerald-100"
        disabled
      >
        <CheckCircle2 className="w-5 h-5 mr-2" />
        Completed
      </Button>
    );
  }

  return (
    <Button
      size="lg"
      className="w-full sm:w-auto font-medium bg-indigo-600 hover:bg-indigo-700 text-white"
      onClick={handleComplete}
      disabled={isPending}
    >
      {isPending ? (
        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
      ) : (
        <CheckCircle2 className="w-5 h-5 mr-2" />
      )}
      Mark as Complete
    </Button>
  );
}
