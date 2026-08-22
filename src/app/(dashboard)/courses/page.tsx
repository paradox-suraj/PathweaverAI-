import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { courseService } from "@/server/services/course.service";
import { progressService } from "@/server/services/progress.service";
import Link from "next/link";
import { PlayCircle, Plus } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default async function CoursesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const courses = await courseService.getAllCoursesForUser(session.user.id);
  const completedTopicIds = await progressService.getCompletedTopicIds(session.user.id);

  return (
    <div className="max-w-[1440px] mx-auto w-full">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-sp-8">
        <div>
          <h1 className="font-display-xl text-display-xl text-text-primary mb-2">My Courses</h1>
          <p className="font-body-lg text-text-muted">Pick up where you left off or start something new.</p>
        </div>
        <Link href="/courses/create">
          <button className="flex items-center gap-2 px-sp-6 py-sp-3 rounded-lg bg-primary-gradient text-white font-label-mono uppercase tracking-widest shadow-glow-primary hover:scale-[1.02] transition-transform">
            <Plus className="w-5 h-5" />
            New Course
          </button>
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center glass-panel rounded-xl">
          <span className="material-symbols-outlined text-6xl text-primary mb-4">library_books</span>
          <h2 className="text-xl font-bold text-text-primary mb-2">Your library is empty</h2>
          <p className="text-text-muted mb-6">Create your first course to start learning!</p>
          <Link href="/courses/create">
            <button className="px-6 py-3 rounded-lg bg-surface-2 border border-white/10 hover:border-primary/50 text-text-primary font-label-mono uppercase tracking-wider transition-colors">
              Create Course
            </button>
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map(course => {
            let totalLessons = 0;
            let completedLessons = 0;

            course.modules.forEach(module => {
              module.topics.forEach(topic => {
                totalLessons++;
                if (completedTopicIds.has(topic.id)) {
                  completedLessons++;
                }
              });
            });

            const progress = totalLessons === 0 ? 0 : Math.round((completedLessons / totalLessons) * 100);

            return (
              <div key={course.id} className="glass-panel rounded-xl p-6 flex flex-col group hover:border-primary/30 transition-colors">
                <div className="flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                      <span className="material-symbols-outlined text-primary">school</span>
                    </div>
                    {progress === 100 && (
                      <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-full">
                        Completed
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-bold text-text-primary mb-2 line-clamp-2">{course.title}</h3>
                  <p className="text-sm text-text-muted mb-6 line-clamp-2">{course.description}</p>
                </div>
                
                <div className="mt-auto space-y-4">
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs text-text-muted font-label-mono">
                      <span>{completedLessons} / {totalLessons} Lessons</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} className="h-2 bg-surface-2" />
                  </div>
                  
                  <Link href={`/courses/${course.id}`} className="block">
                    <button className="w-full py-2.5 rounded-lg bg-surface-2 border border-white/5 hover:bg-surface-bright hover:border-primary/30 text-text-primary font-label-mono text-xs uppercase tracking-widest transition-all flex items-center justify-center gap-2">
                      <PlayCircle className="w-4 h-4" />
                      {progress === 0 ? "Start Course" : progress === 100 ? "Review Course" : "Continue"}
                    </button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
