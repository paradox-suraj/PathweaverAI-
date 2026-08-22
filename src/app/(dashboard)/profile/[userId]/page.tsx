import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import ProfileClientControls from "./profile-client-controls";
import { EditProfileButton } from "./EditProfileButton";

export default async function ProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const session = await auth();
  const isOwnProfile = session?.user?.id === userId;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      userProfile: true,
      userStat: true,
      followers: true,
      following: true,
      userBadges: {
        include: {
           // We might not have a full Badge model, let's assume we just store badge names in badgeId for now.
        }
      },
      courses: {
        where: { isPublished: true, isPublic: true },
        orderBy: { enrollmentCount: "desc" }
      }
    }
  });

  if (!user) return notFound();

  // If private and not owner, return limited view or 403
  if (!isOwnProfile && user.userProfile?.isPublicProfile === false) {
    return (
      <div className="flex-1 w-full max-w-4xl mx-auto p-sp-6 md:p-sp-8 text-center pt-24">
        <span className="material-symbols-outlined text-6xl text-text-muted mb-4">lock</span>
        <h1 className="font-headline-lg text-headline-lg text-text-primary mb-2">Private Profile</h1>
        <p className="text-text-secondary">This user has set their profile to private.</p>
      </div>
    );
  }

  const currentUserId = session?.user?.id;
  const isFollowing = currentUserId 
    ? user.followers.some(f => f.followerId === currentUserId)
    : false;

  return (
    <div className="flex-1 w-full max-w-4xl mx-auto p-sp-6 md:p-sp-8 flex flex-col gap-sp-8">
      
      {/* Profile Header */}
      <div className="bg-surface-glass border border-white/10 rounded-2xl p-sp-6 md:p-sp-8 flex flex-col md:flex-row items-center md:items-start gap-sp-6 relative overflow-hidden">
        <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="w-24 h-24 md:w-32 md:h-32 rounded-full border-4 border-surface-2 overflow-hidden bg-surface-variant shrink-0 relative">
          {user.image ? (
            <Image src={user.image} alt={user.name || "User"} fill className="object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-4xl text-text-muted">person</span>
            </div>
          )}
        </div>
        
        <div className="flex-1 text-center md:text-left z-10">
          <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
            <div>
              <h1 className="font-display-lg text-display-lg text-text-primary mb-1">{user.name}</h1>
              {user.username && (
                <p className="font-label-mono text-primary mb-2">@{user.username}</p>
              )}
            </div>
            {isOwnProfile && (
              <EditProfileButton user={{
                name: user.name,
                username: user.username,
                image: user.image,
                bio: user.userProfile?.bio || null,
              }} />
            )}
          </div>
          
          <p className="text-text-secondary mt-2 mb-4 flex items-center justify-center md:justify-start gap-4">
            <span>Joined {format(new Date(user.createdAt), "MMM yyyy")}</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>{user.followers.length} Followers</span>
            <span className="w-1 h-1 rounded-full bg-white/20"></span>
            <span>{user.following.length} Following</span>
          </p>

          <p className="text-text-primary max-w-xl">
            {user.userProfile?.bio || (isOwnProfile ? "Add a bio to tell others about yourself." : "No bio provided.")}
          </p>

          <div className="mt-6 flex flex-wrap gap-4 justify-center md:justify-start">
             {!isOwnProfile && session?.user?.id && (
               <ProfileClientControls 
                 targetUserId={userId} 
                 initialIsFollowing={isFollowing} 
               />
             )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-sp-6">
        
        {/* Learning Stats */}
        <div className="bg-surface-glass border border-white/10 rounded-xl p-sp-6">
          <h2 className="font-headline-sm text-headline-sm text-text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-primary">local_fire_department</span>
            Learning Stats
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Current Streak</span>
              <span className="font-label-mono text-primary font-bold">{user.userStat?.currentStreak || 0} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Longest Streak</span>
              <span className="font-label-mono text-text-primary">{user.userStat?.longestStreak || 0} days</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-text-secondary">Total XP</span>
              <span className="font-label-mono text-accent-amber font-bold">{user.userStat?.xp || 0}</span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="md:col-span-2 bg-surface-glass border border-white/10 rounded-xl p-sp-6">
          <h2 className="font-headline-sm text-headline-sm text-text-primary mb-4 flex items-center gap-2">
            <span className="material-symbols-outlined text-secondary">workspace_premium</span>
            Achievements
          </h2>
          {user.userBadges.length > 0 ? (
            <div className="flex flex-wrap gap-4">
              {user.userBadges.map(b => (
                <div key={b.id} className="flex flex-col items-center gap-2 p-3 bg-surface-2/50 rounded-lg border border-white/5 w-24 text-center">
                  <div className="w-10 h-10 rounded-full bg-secondary/20 flex items-center justify-center text-secondary">
                    <span className="material-symbols-outlined">emoji_events</span>
                  </div>
                  <span className="text-xs text-text-primary leading-tight">{b.badgeId}</span>
                </div>
              ))}
            </div>
          ) : (
             <p className="text-text-secondary text-sm">No achievements unlocked yet.</p>
          )}
        </div>
      </div>

      {/* Public Courses */}
      <section>
        <h2 className="font-headline-md text-headline-md text-text-primary mb-sp-4">Public Courses</h2>
        {user.courses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-sp-6">
             {user.courses.map(course => (
               <Link key={course.id} href={`/courses/${course.id}`} className="block">
                 <div className="bg-surface-glass border border-white/10 rounded-xl p-sp-5 hover:border-primary/50 transition-colors h-full flex flex-col">
                   <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2 line-clamp-2">{course.title}</h3>
                   <p className="text-sm text-text-secondary line-clamp-2 mb-4 flex-1">{course.description}</p>
                   <div className="flex justify-between items-center mt-auto pt-4 border-t border-white/10">
                     <span className="text-xs text-text-muted">{course.enrollmentCount} learners</span>
                     <span className="text-xs font-medium text-primary">View Course</span>
                   </div>
                 </div>
               </Link>
             ))}
          </div>
        ) : (
          <div className="text-center p-sp-8 border border-white/10 rounded-xl bg-surface-2/30">
            <p className="text-text-secondary">No public courses created yet.</p>
          </div>
        )}
      </section>
      
    </div>
  );
}
