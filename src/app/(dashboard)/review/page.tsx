import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Brain, ArrowRight, CalendarClock, Trophy } from "lucide-react";

export const metadata = {
  title: "Review Queue | PathWeaver AI",
};

export default async function ReviewQueuePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const now = new Date();

  // Fetch topics that are due for review
  const dueReviews = await prisma.topicMastery.findMany({
    where: {
      userId: session.user.id,
      nextReviewDate: {
        lte: now,
      },
    },
    include: {
      topic: {
        include: {
          module: {
            include: {
              course: true,
            },
          },
        },
      },
    },
    orderBy: {
      nextReviewDate: "asc",
    },
  });

  return (
    <div className="flex flex-col gap-sp-6 items-start pb-16 w-full max-w-6xl mx-auto p-sp-6">
      <div className="flex flex-col gap-2">
        <h1 className="font-headline-lg text-headline-lg text-text-primary flex items-center gap-3">
          <Brain className="w-8 h-8 text-primary" />
          Review Queue
        </h1>
        <p className="font-body-base text-text-secondary">
          Topics scheduled for review based on the Spaced Repetition System (SRS).
        </p>
      </div>

      {dueReviews.length === 0 ? (
        <div className="w-full flex flex-col items-center justify-center p-12 glass-panel rounded-2xl border border-white/5 text-center gap-4 mt-8">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
            <Trophy className="w-10 h-10 text-primary" />
          </div>
          <h2 className="font-headline-sm text-text-primary">You're all caught up!</h2>
          <p className="text-text-secondary max-w-md mx-auto">
            There are no topics due for review right now. Taking quizzes and completing lessons will automatically schedule reviews to help you retain information.
          </p>
          <Link
            href="/courses"
            className="mt-4 px-6 py-3 bg-primary-gradient text-white rounded-lg font-label-lg transition-all hover:scale-105 active:scale-95 hover:shadow-glow-primary inline-flex items-center gap-2"
          >
            Continue Learning
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      ) : (
        <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-sp-4 mt-4">
          {dueReviews.map((review) => {
            const courseTitle = review.topic.module.course.title;
            const topicTitle = review.topic.title;
            const courseId = review.topic.module.courseId;
            const topicId = review.topic.id;

            return (
              <div key={review.id} className="glass-card rounded-xl p-6 flex flex-col h-full border border-white/5 hover:border-primary/30 transition-colors group">
                <div className="flex items-start justify-between mb-4">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-medium border border-secondary/20">
                    <CalendarClock className="w-3.5 h-3.5" />
                    Due for review
                  </div>
                  <div className="text-xs font-mono text-text-muted">
                    Score: {Math.round(review.masteryLevel * 100)}%
                  </div>
                </div>

                <div className="text-xs text-primary/80 uppercase tracking-wider mb-2 font-semibold">
                  {courseTitle}
                </div>
                <h3 className="font-headline-sm text-text-primary mb-4 line-clamp-2 flex-1">
                  {topicTitle}
                </h3>

                <Link
                  href={`/courses/${courseId}/lesson/${topicId}?tab=quiz`}
                  className="w-full mt-auto py-2.5 flex items-center justify-center gap-2 bg-white/5 hover:bg-primary/20 text-text-primary hover:text-primary rounded-lg transition-all border border-transparent hover:border-primary/30 group-hover:bg-primary/10"
                >
                  <Brain className="w-4 h-4" />
                  Review Now
                </Link>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
