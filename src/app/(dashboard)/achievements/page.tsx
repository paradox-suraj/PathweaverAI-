import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { progressService } from "@/server/services/progress.service";
import Link from "next/link";
import { ArrowLeft, Trophy, Star, Zap, Target, CheckCircle2, Award, Shield, Crown } from "lucide-react";

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/api/auth/signin");
  }

  const userId = session.user.id;

  // 1. Fetch UserStat
  const { gamificationService } = await import("@/server/services/gamification.service");
  const stat = await gamificationService.getUserStat(userId);
  
  const totalXp = stat.xp;
  const level = Math.max(1, Math.floor(totalXp / 250) + 1); // e.g., 0-249 = Lvl 1, 250-499 = Lvl 2
  const nextLevelXp = level * 250;
  const prevLevelXp = (level - 1) * 250;
  const progressPercent = Math.max(0, Math.min(100, ((totalXp - prevLevelXp) / (nextLevelXp - prevLevelXp)) * 100));

  // 2. Fetch UserBadges
  const userBadges = await prisma.userBadge.findMany({ where: { userId } });
  const earnedBadgeIds = new Set(userBadges.map(b => b.badgeId));

  const BADGE_DEFINITIONS = [
    // Lesson Milestones
    {
      id: "first_lesson",
      title: "First Steps",
      description: "Completed your first lesson",
      icon: <Star className="w-8 h-8 text-yellow-500" />,
    },
    {
      id: "master",
      title: "Master",
      description: "Complete 50 lessons",
      icon: <Target className="w-8 h-8 text-emerald-500" />,
    },
    // Streaks
    {
      id: "three_streak",
      title: "Consistency is Key",
      description: "Achieved a 3-day learning streak",
      icon: <Zap className="w-8 h-8 text-amber-400" />,
    },
    {
      id: "seven_streak",
      title: "Unstoppable",
      description: "Achieved a 7-day learning streak",
      icon: <Zap className="w-8 h-8 text-amber-500" />,
    },
    {
      id: "thirty_streak",
      title: "Force of Nature",
      description: "Achieved a 30-day learning streak",
      icon: <Zap className="w-8 h-8 text-orange-500" />,
    },
    // Quiz Mastery
    {
      id: "flawless_victory",
      title: "Flawless Victory",
      description: "Get a perfect score on 1 quiz",
      icon: <CheckCircle2 className="w-8 h-8 text-blue-400" />,
    },
    {
      id: "quiz_master",
      title: "Quiz Master",
      description: "Get a perfect score on 5 quizzes",
      icon: <Award className="w-8 h-8 text-blue-500" />,
    },
    // Learning Goals
    {
      id: "goal_crusher",
      title: "Goal Crusher",
      description: "Complete 1 overarching learning goal",
      icon: <Shield className="w-8 h-8 text-purple-400" />,
    },
    {
      id: "polymath",
      title: "Polymath",
      description: "Complete 3 overarching learning goals",
      icon: <Crown className="w-8 h-8 text-purple-500" />,
    }
  ];

  const badges = BADGE_DEFINITIONS.map(badge => ({
    ...badge,
    earned: earnedBadgeIds.has(badge.id)
  }));

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
        <h1 className="font-display-xl text-display-xl text-text-primary mb-2">Achievements</h1>
        <p className="font-body-lg text-text-muted">Your learning milestones and earned badges.</p>
      </div>

      <div className="glass-panel rounded-xl p-8 mb-12 text-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-primary-gradient"></div>
        <div className="w-24 h-24 mx-auto bg-primary/10 rounded-full flex items-center justify-center mb-4 border border-primary/20 shadow-glow-primary">
          <Trophy className="w-12 h-12 text-primary" />
        </div>
        <h2 className="text-3xl font-bold text-text-primary mb-1">Level {level}</h2>
        <p className="text-primary font-label-mono text-lg mb-6">{totalXp} XP</p>
        
        <div className="max-w-md mx-auto bg-surface-1/50 p-4 rounded-xl border border-white/5">
          <div className="flex justify-between text-xs text-text-muted mb-3 font-label-mono uppercase tracking-wider">
            <span>Level {level}</span>
            <span>Level {level + 1}</span>
          </div>
          <div className="h-3 bg-surface-2 rounded-full overflow-hidden mb-3">
            <div 
              className="h-full bg-primary-gradient rounded-full transition-all duration-500" 
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-sm text-text-muted">{nextLevelXp - totalXp} XP until next level</p>
        </div>
      </div>

      <h3 className="font-headline-md text-2xl mb-6 text-text-primary">Badges Gallery</h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        {badges.map(badge => (
          <div 
            key={badge.id} 
            className={`glass-panel p-6 rounded-xl flex flex-col items-center text-center transition-all duration-300 ${
              badge.earned 
                ? "border-primary/30 shadow-[0_0_15px_rgba(240,86,46,0.1)] bg-gradient-to-b from-primary/10 to-transparent translate-y-[-2px]" 
                : "opacity-50 grayscale hover:grayscale-0 hover:opacity-80"
            }`}
          >
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mb-5 border-2 ${
              badge.earned ? "bg-surface-1 border-primary/20 shadow-glow-primary" : "bg-surface-2 border-transparent"
            }`}>
              {badge.icon}
            </div>
            <h4 className={`font-bold mb-2 text-lg ${badge.earned ? 'text-text-primary' : 'text-text-muted'}`}>{badge.title}</h4>
            <p className="text-sm text-text-muted leading-relaxed">{badge.description}</p>
            {badge.earned && (
              <div className="mt-4 inline-flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-widest text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse"></span>
                Unlocked
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
