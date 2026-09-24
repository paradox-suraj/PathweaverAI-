import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { courseService } from "@/server/services/course.service";
import { progressService } from "@/server/services/progress.service";
import { scheduleService } from "@/server/services/schedule.service";
import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpen } from "lucide-react";
import { CalendarExportDialog } from "@/components/calendar-export-dialog";
import { AnimatedContainer, AnimatedStatCard, ActivityChart, GsapTimelineList } from "@/components/dashboard-client";
import { DashboardGreeting } from "@/components/dashboard-greeting";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  // Check if user has completed onboarding (has a learning goal)
  const goal = await prisma.learningGoal.findFirst({
    where: { userId: session.user.id }
  });

  if (!goal) {
    redirect("/welcome");
  }

  // Fetch courses using the service
  const courses = await courseService.getAllCoursesForUser(session.user.id);
  const completedTopicIds = await progressService.getCompletedTopicIds(session.user.id);

  // Calculate Metrics
  let totalEstimatedMinsStudied = 0;
  let totalLessonsCompleted = 0;
  let coursesCompleted = 0;

  // Find the Active Course (first course that isn't fully completed, or just the first course)
  let activeCourse = null;
  let activeCourseProgress = 0;

  for (const course of courses) {
    let courseTotalLessons = 0;
    let courseCompletedLessons = 0;

    for (const module of course.modules) {
      for (const topic of module.topics) {
        courseTotalLessons++;
        const isCompleted = completedTopicIds.has(topic.id);
        if (isCompleted) {
          courseCompletedLessons++;
          totalLessonsCompleted++;
          totalEstimatedMinsStudied += topic.estimatedMins;
        }
      }
    }

    const isCourseComplete =
      courseTotalLessons > 0 && courseCompletedLessons === courseTotalLessons;
    
    if (isCourseComplete) {
      coursesCompleted++;
    }

    if (!activeCourse && !isCourseComplete) {
      activeCourse = course;
      activeCourseProgress = courseTotalLessons > 0 ? Math.round(
        (courseCompletedLessons / courseTotalLessons) * 100
      ) : 0;
    }
  }

  // Fallback if all courses are completed
  if (!activeCourse && courses.length > 0) {
    activeCourse = courses[0];
    activeCourseProgress = 100;
  }

  // Fetch upcoming tasks from scheduler
  const upNextTasks = activeCourse ? await scheduleService.getUpcomingTasks(session.user.id, activeCourse.id, 3) : [];


  const { gamificationService } = await import("@/server/services/gamification.service");
  const stat = await gamificationService.getUserStat(session.user.id);
  const totalXp = stat.xp;
  const level = Math.max(1, Math.floor(totalXp / 250) + 1);

  const hoursStudied = (totalEstimatedMinsStudied / 60).toFixed(1);

  // Calculate activity data for the last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
  sevenDaysAgo.setHours(0, 0, 0, 0);

  const recentEvents = await prisma.learningEvent.findMany({
    where: {
      userId: session.user.id,
      createdAt: {
        gte: sevenDaysAgo,
      },
      xpEarned: {
        gt: 0,
      }
    },
    select: {
      createdAt: true,
      xpEarned: true,
    }
  });

  const activityMap = new Map<string, number>();
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    const dayName = d.toLocaleDateString('en-US', { weekday: 'short' });
    // Initialize to 0, ensuring days without events still show up
    activityMap.set(dayName, 0);
  }

  recentEvents.forEach(event => {
    const dayName = event.createdAt.toLocaleDateString('en-US', { weekday: 'short' });
    if (activityMap.has(dayName)) {
      activityMap.set(dayName, (activityMap.get(dayName) || 0) + (event.xpEarned || 0));
    }
  });

  const activityData = Array.from(activityMap.entries()).map(([name, xp]) => ({ name, xp }));

  return (
    <div className="max-w-[1440px] mx-auto w-full">
      {/* Greeting Header */}
      <div className="mb-sp-8 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <DashboardGreeting 
          userName={session.user.name?.split(" ")[0] || "Learner"} 
          courseTitle={activeCourse?.title} 
        />
        <button className="flex items-center gap-2 px-sp-4 py-sp-2 rounded-lg bg-surface-2 border border-white/10 hover:border-primary/50 hover:bg-surface-bright transition-all font-label-mono text-label-mono text-text-primary">
          <span className="material-symbols-outlined text-sm">calendar_month</span>
          Today, {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
        </button>
      </div>

      {/* 12-Column Grid */}
      <AnimatedContainer className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
        {/* Stats Cards Row (Span 3 cols each on desktop) */}
        <AnimatedStatCard>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-gold-primary">auto_awesome</span>
            </div>
            <span className="flex items-center text-text-primary font-label-mono text-[10px] bg-bg-card border border-border-card px-2 py-1 rounded-full">
              Level {level}
            </span>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-text-primary mb-1">{totalXp}</div>
            <div className="font-label-mono text-label-mono text-text-muted uppercase tracking-wider">Total XP</div>
          </div>
        </AnimatedStatCard>

        <AnimatedStatCard>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-gold-primary">timer</span>
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-text-primary mb-1">{hoursStudied}<span className="text-lg text-text-muted ml-1">h</span></div>
            <div className="font-label-mono text-label-mono text-text-muted uppercase tracking-wider">Hours Studied</div>
          </div>
        </AnimatedStatCard>

        <AnimatedStatCard>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-gold-primary">workspace_premium</span>
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-text-primary mb-1">{coursesCompleted}</div>
            <div className="font-label-mono text-label-mono text-text-muted uppercase tracking-wider">Courses Completed</div>
          </div>
        </AnimatedStatCard>

        <AnimatedStatCard>
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center justify-center group-hover:scale-110 transition-transform">
              <span className="material-symbols-outlined text-orange-primary" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
            </div>
          </div>
          <div>
            <div className="font-headline-lg text-headline-lg text-text-primary mb-1">{totalLessonsCompleted}</div>
            <div className="font-label-mono text-label-mono text-text-muted uppercase tracking-wider">Lessons Finished</div>
          </div>
        </AnimatedStatCard>

        {/* Middle Row */}
        {/* Today's Plan Timeline (Span 8 cols) */}
        <div className="col-span-1 md:col-span-8 glass-panel rounded-xl p-sp-6 flex flex-col min-h-[500px]">
          <div className="flex justify-between items-center mb-sp-6">
            <h3 className="font-headline-md text-headline-md text-text-primary">Up Next</h3>
            <div className="flex gap-4 items-center">
              <CalendarExportDialog userId={session.user.id} />
              {activeCourse && (
                <Link href={`/courses/${activeCourse.id}`} className="text-primary hover:text-primary-container font-label-mono text-label-mono transition-colors">
                  View Full Curriculum
                </Link>
              )}
            </div>
          </div>
          
          <GsapTimelineList tasks={upNextTasks} />
        </div>

        {/* Active Course Card (Span 4 cols) */}
        <div className="col-span-1 md:col-span-4 glass-panel rounded-xl p-sp-6 flex flex-col min-h-[500px]">
          <h3 className="font-headline-md text-headline-md text-text-primary mb-sp-6">Active Course</h3>
          <div className="flex-1 flex flex-col items-center justify-center">
            {activeCourse ? (
              <>
                {/* Circular Progress Gauge */}
                <div className="relative w-48 h-48 flex items-center justify-center mb-6">
                  <svg className="w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                    <circle cx="50" cy="50" fill="none" r="45" stroke="#262832" strokeWidth="8"></circle>
                    <circle 
                      className="transition-all duration-1000 ease-out" 
                      cx="50" cy="50" fill="none" r="45" stroke="#2A2C36" 
                      strokeDasharray="282.7" 
                      strokeDashoffset={282.7 - (282.7 * activeCourseProgress) / 100} 
                      strokeLinecap="round" strokeWidth="8">
                    </circle>
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="font-display-xl text-display-xl text-gold-primary font-extrabold">{activeCourseProgress}%</span>
                    <span className="font-label-mono text-[10px] text-text-muted uppercase tracking-widest mt-1">Completed</span>
                  </div>
                </div>
                
                <div className="text-center w-full mt-4">
                  <h4 className="font-headline-md text-lg text-text-primary mb-2 line-clamp-2">{activeCourse.title}</h4>
                  <Link href={`/courses/${activeCourse.id}`}>
                    <button className="w-full mt-6 py-3 rounded-lg bg-primary-gradient text-white font-label-mono text-sm uppercase tracking-widest hover:scale-[1.02] hover:shadow-glow-primary transition-all active:scale-[0.97] flex items-center justify-center gap-2">
                      <span className="material-symbols-outlined">play_arrow</span>
                      Resume Course
                    </button>
                  </Link>
                </div>
              </>
            ) : (
              <div className="text-slate-500 py-12 flex flex-col items-center">
                <BookOpen className="w-12 h-12 mx-auto text-surface-bright mb-3" />
                <p className="font-body-base text-text-muted">No active courses found.</p>
              </div>
            )}
          </div>
        </div>

        <ActivityChart data={activityData} />
      </AnimatedContainer>
    </div>
  );
}
