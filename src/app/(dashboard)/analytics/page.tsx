import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { ArrowLeft, Clock, TrendingUp, Target } from "lucide-react";
import { format, subDays, startOfDay, isSameDay, differenceInMinutes, getHours } from "date-fns";
import { VelocityChart, FocusTimeChart } from "@/components/analytics-charts";

export default async function AnalyticsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const userId = session.user.id;
  
  // 1. Fetch LearningEvents for the last 14 days
  const fourteenDaysAgo = subDays(startOfDay(new Date()), 13);
  
  const recentEvents = await prisma.learningEvent.findMany({
    where: { 
      userId,
      createdAt: { gte: fourteenDaysAgo }
    },
    orderBy: { createdAt: 'asc' }
  });

  // Calculate Daily Focus Time & Velocity (Events count)
  const velocityData: { date: string; tasksCompleted: number }[] = [];
  const focusTimeData: { date: string; focusMinutes: number }[] = [];
  
  let totalFocusMinutes = 0;
  let totalRecentEvents = recentEvents.length;

  for (let i = 0; i < 14; i++) {
    const day = subDays(startOfDay(new Date()), 13 - i);
    const dateStr = format(day, 'MMM dd');
    
    // Get events for this specific day
    const dayEvents = recentEvents.filter(e => isSameDay(new Date(e.createdAt), day));
    
    // Velocity is simply the number of learning events for the day
    velocityData.push({ date: dateStr, tasksCompleted: dayEvents.length });
    
    // Focus time: approximate by grouping events within 30 min of each other
    let dailyFocusMins = 0;
    if (dayEvents.length > 0) {
      let currentSessionStart = new Date(dayEvents[0].createdAt);
      let lastEventTime = new Date(dayEvents[0].createdAt);
      
      for (let j = 1; j < dayEvents.length; j++) {
        const eventTime = new Date(dayEvents[j].createdAt);
        const diffMins = differenceInMinutes(eventTime, lastEventTime);
        
        if (diffMins > 30) {
          // Session gap > 30m, close out the previous session
          const sessionMins = Math.max(5, differenceInMinutes(lastEventTime, currentSessionStart));
          dailyFocusMins += sessionMins;
          currentSessionStart = eventTime;
        }
        lastEventTime = eventTime;
      }
      // Add the final session of the day
      dailyFocusMins += Math.max(5, differenceInMinutes(lastEventTime, currentSessionStart));
    }
    
    focusTimeData.push({ date: dateStr, focusMinutes: dailyFocusMins });
    totalFocusMinutes += dailyFocusMins;
  }

  const averageVelocity = Math.round(totalRecentEvents / 14);

  // 2. Calculate Drop-off Rate
  // Find all unique topics the user has ANY event for
  const allEvents = await prisma.learningEvent.findMany({
    where: { userId, resourceId: { not: null } },
    select: { resourceId: true }
  });
  
  // We assume resourceId contains the topicId or we can approximate "Started" vs "Mastered"
  // Let's use TopicMastery to see how many topics they successfully completed vs total topics in their plan
  const masteries = await prisma.topicMastery.findMany({
    where: { userId },
    include: {
      topic: { include: { module: { include: { course: true } } } }
    },
    orderBy: { masteryLevel: 'desc' }
  });
  
  const studyTasks = await prisma.studyTask.findMany({
    where: { plan: { userId } }
  });
  
  const topicsStarted = new Set(studyTasks.map(t => t.topicId)).size;
  const topicsMastered = masteries.length;
  
  const completionRate = topicsStarted > 0 
    ? Math.round((topicsMastered / topicsStarted) * 100) 
    : 0;

  const averageMastery = masteries.length > 0 
    ? Math.round((masteries.reduce((acc, m) => acc + m.masteryLevel, 0) / masteries.length) * 100)
    : 0;

  // Calculate Best Learning Time
  const timeBuckets = { Morning: 0, Afternoon: 0, Evening: 0, Night: 0 };
  recentEvents.forEach(event => {
    const hour = getHours(new Date(event.createdAt));
    if (hour >= 6 && hour < 12) timeBuckets.Morning++;
    else if (hour >= 12 && hour < 18) timeBuckets.Afternoon++;
    else if (hour >= 18 && hour < 24) timeBuckets.Evening++;
    else timeBuckets.Night++;
  });
  
  const bestTime = Object.entries(timeBuckets).reduce((a, b) => a[1] > b[1] ? a : b)[0];

  // Topics to Review (struggling topics)
  const strugglingTopics = [...masteries].sort((a, b) => a.masteryLevel - b.masteryLevel).slice(0, 3).filter(m => m.masteryLevel < 0.6);

  return (
    <div className="max-w-6xl mx-auto w-full pb-16">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-text-muted hover:text-text-primary mb-6 transition-colors font-label-mono uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="mb-sp-8">
        <h1 className="font-display-xl text-display-xl text-text-primary mb-2">Advanced Analytics</h1>
        <p className="font-body-lg text-text-muted">Analyze your focus times, learning velocity, and drop-off rates.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-text-muted font-label-mono uppercase tracking-wider mb-1">Total Focus Time</p>
            <h2 className="text-4xl font-bold text-info">{Math.round(totalFocusMinutes / 60)}h {totalFocusMinutes % 60}m</h2>
          </div>
          <Clock className="w-10 h-10 text-info/30" />
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-text-muted font-label-mono uppercase tracking-wider mb-1">Avg Velocity (14d)</p>
            <h2 className="text-4xl font-bold text-primary">{averageVelocity} <span className="text-lg text-text-muted font-normal">events/day</span></h2>
          </div>
          <TrendingUp className="w-10 h-10 text-primary/30" />
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between">
          <div>
            <p className="text-text-muted font-label-mono uppercase tracking-wider mb-1">Completion Rate</p>
            <h2 className="text-4xl font-bold text-emerald-400">{completionRate}%</h2>
          </div>
          <Target className="w-10 h-10 text-emerald-400/30" />
        </div>
        <div className="glass-panel p-6 rounded-xl flex items-center justify-between bg-primary/5">
          <div>
            <p className="text-text-muted font-label-mono uppercase tracking-wider mb-1">Best Focus Time</p>
            <h2 className="text-4xl font-bold text-primary">{totalRecentEvents > 0 ? bestTime : "N/A"}</h2>
          </div>
          <Clock className="w-10 h-10 text-primary/30" />
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="font-headline-md text-xl mb-6 text-text-primary">Learning Velocity</h3>
          <VelocityChart data={velocityData} />
        </div>
        <div className="glass-panel p-6 rounded-xl">
          <h3 className="font-headline-md text-xl mb-6 text-text-primary">Daily Focus Time</h3>
          <FocusTimeChart data={focusTimeData} />
        </div>
      </div>

      {/* Mastery List */}
      <h3 className="font-headline-md text-xl mb-4 text-text-primary">Mastery by Topic</h3>
      <div className="flex items-center justify-between mb-4 glass-panel p-4 rounded-lg bg-surface-1/50 border-none">
        <span className="text-text-muted font-label-mono uppercase">Overall Average Mastery</span>
        <span className="font-bold text-primary text-xl">{averageMastery}%</span>
      </div>
      
      {masteries.length === 0 ? (
        <div className="glass-panel p-8 text-center rounded-xl">
          <p className="text-text-muted">You haven't mastered any topics yet. Complete lessons to track your progress!</p>
        </div>
      ) : (
        <div className="space-y-4">
          {masteries.map(m => (
            <div key={m.topicId} className="glass-panel p-4 rounded-xl flex items-center justify-between hover:border-white/20 transition-colors">
              <div>
                <h4 className="font-bold text-text-primary">{m.topic.title}</h4>
                <p className="text-sm text-text-muted">{m.topic.module.course.title}</p>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-32 h-2 bg-surface-2 rounded-full overflow-hidden hidden md:block">
                  <div 
                    className="h-full bg-primary-gradient" 
                    style={{ width: `${Math.round(m.masteryLevel * 100)}%` }}
                  />
                </div>
                <span className="font-label-mono text-emerald-400 font-bold bg-emerald-400/10 px-3 py-1 rounded-full">
                  {Math.round(m.masteryLevel * 100)}%
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Struggling Topics */}
      {strugglingTopics.length > 0 && (
        <div className="mt-12">
          <h3 className="font-headline-md text-xl mb-4 text-error">Topics to Review (Needs Attention)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {strugglingTopics.map(m => (
              <div key={m.topicId} className="glass-panel p-6 rounded-xl border-error/20 bg-error/5 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-16 h-16 bg-error/10 blur-2xl rounded-full translate-x-1/2 -translate-y-1/2 group-hover:bg-error/20 transition-all"></div>
                <h4 className="font-bold text-text-primary mb-1">{m.topic.title}</h4>
                <p className="text-sm text-text-muted mb-4 truncate">{m.topic.module.course.title}</p>
                <div className="flex items-center justify-between">
                  <span className="font-label-mono text-sm uppercase tracking-wider text-error">Mastery</span>
                  <span className="font-bold text-error">{Math.round(m.masteryLevel * 100)}%</span>
                </div>
                <div className="w-full h-2 bg-surface-2 mt-2 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-error" 
                    style={{ width: `${Math.round(m.masteryLevel * 100)}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
