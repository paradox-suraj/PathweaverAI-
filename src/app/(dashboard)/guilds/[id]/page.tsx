'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { joinGuildAction, leaveGuildAction } from '@/server/actions/guild';

export default function GuildDashboardPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    async function fetchGuild() {
      try {
        const res = await fetch(`/api/guilds/${id}`);
        if (!res.ok) throw new Error('Failed to fetch guild');
        const json = await res.json();
        setData(json);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchGuild();
  }, [id]);

  async function handleJoin() {
    setActionLoading(true);
    const res = await joinGuildAction(id);
    if (res.success) {
      window.location.reload();
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  }

  async function handleLeave() {
    if (!confirm('Are you sure you want to leave this guild?')) return;
    setActionLoading(true);
    const res = await leaveGuildAction(id);
    if (res.success) {
      if (res.deleted) {
        router.push('/guilds');
      } else {
        window.location.reload();
      }
    } else {
      alert(res.error);
    }
    setActionLoading(false);
  }

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
      </div>
    );
  }

  if (!data?.guild) {
    return (
      <div className="text-center py-20 animate-fade-in-up">
        <span className="material-symbols-outlined text-6xl text-text-muted mb-4">error</span>
        <h2 className="text-2xl font-bold text-text-base">Guild not found</h2>
        <Link href="/guilds" className="text-primary hover:underline mt-2 inline-block">Return to Guilds</Link>
      </div>
    );
  }

  const { guild, isMember, leaderboard } = data;

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-fade-in-up">
      {/* Header */}
      <div className="surface-glass rounded-3xl p-8 border border-white/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-primary-gradient"></div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div className="flex items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center border border-primary/30 shadow-glow-primary/20">
              <span className="material-symbols-outlined text-primary text-3xl">shield</span>
            </div>
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="font-display-xl text-3xl font-extrabold text-text-base">{guild.name}</h1>
                <span className="bg-surface-3 px-2 py-0.5 rounded text-xs font-label-mono font-bold uppercase tracking-wider text-text-muted">
                  {guild.topic}
                </span>
              </div>
              <p className="text-text-muted font-body-lg max-w-2xl">{guild.description}</p>
            </div>
          </div>
          
          <div>
            {!isMember ? (
              <button
                onClick={handleJoin}
                disabled={actionLoading}
                className="bg-primary hover:bg-primary/90 text-white px-8 py-3 rounded-xl font-label-mono font-bold shadow-glow-primary transition-all scale-102 flex items-center gap-2 disabled:opacity-50"
              >
                <span className="material-symbols-outlined">login</span>
                Join Guild
              </button>
            ) : (
              <button
                onClick={handleLeave}
                disabled={actionLoading}
                className="bg-surface-3 hover:bg-surface-variant text-text-muted hover:text-accent-red px-6 py-2.5 rounded-xl font-label-mono font-bold transition-all flex items-center gap-2 disabled:opacity-50 border border-white/5"
              >
                <span className="material-symbols-outlined">logout</span>
                Leave Guild
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Internal Leaderboard */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center justify-between">
            <h2 className="font-headline-md font-bold text-2xl flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">leaderboard</span>
              Guild Leaderboard
            </h2>
          </div>
          
          <div className="surface-glass rounded-2xl border border-white/10 overflow-hidden shadow-xl">
            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-text-muted">
                No members on the leaderboard yet.
              </div>
            ) : (
              <div className="divide-y divide-white/5">
                {leaderboard.map((member: any, i: number) => (
                  <div key={member.id} className="p-4 flex items-center gap-4 hover:bg-surface-variant/30 transition-colors">
                    <div className="w-6 font-label-mono text-text-muted text-center font-bold">{i + 1}</div>
                    <Link href={`/profile/${member.userId}`} className="w-10 h-10 rounded-full overflow-hidden relative border border-surface-3 hover:border-primary transition-colors block">
                      {member.user.image ? (
                        <Image src={member.user.image} alt={member.user.name || ''} fill sizes="40px" className="object-cover" />
                      ) : (
                        <div className="w-full h-full bg-surface-3 flex items-center justify-center">
                          <span className="material-symbols-outlined text-sm">person</span>
                        </div>
                      )}
                    </Link>
                    <div className="flex-1">
                      <Link href={`/profile/${member.userId}`} className="font-headline-md font-semibold text-text-base hover:text-primary transition-colors block">
                        {member.user.name || 'Anonymous'} {member.role === 'FOUNDER' && <span className="material-symbols-outlined text-[14px] text-accent-amber ml-1 align-text-bottom" title="Founder">stars</span>}
                      </Link>
                      <div className="text-xs font-label-mono text-text-muted">
                        @{member.user.username || member.userId.slice(-6)}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-display-xl font-bold text-primary">{member.user.userStat?.xp || 0}</div>
                      <div className="text-[10px] font-label-mono text-text-muted uppercase">XP</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column - Guild Info */}
        <div className="space-y-6">
          <div className="surface-glass rounded-2xl border border-white/10 p-6">
            <h3 className="font-headline-md font-bold text-lg mb-4 flex items-center gap-2 text-text-base border-b border-white/5 pb-3">
              <span className="material-symbols-outlined text-primary">info</span>
              Guild Info
            </h3>
            
            <div className="space-y-4">
              <div>
                <div className="text-xs font-label-mono text-text-muted uppercase mb-1">Founder</div>
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full overflow-hidden relative">
                    {guild.founder?.image ? (
                       <Image src={guild.founder.image} alt="Founder" fill sizes="24px" className="object-cover" />
                    ) : (
                      <div className="w-full h-full bg-surface-3 flex items-center justify-center">
                        <span className="material-symbols-outlined text-[10px]">person</span>
                      </div>
                    )}
                  </div>
                  <span className="font-semibold text-sm">{guild.founder?.name || 'Unknown'}</span>
                </div>
              </div>
              
              <div>
                <div className="text-xs font-label-mono text-text-muted uppercase mb-1">Created At</div>
                <div className="text-sm">{new Date(guild.createdAt).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })}</div>
              </div>
              
              <div>
                <div className="text-xs font-label-mono text-text-muted uppercase mb-1">Members</div>
                <div className="text-sm font-bold text-primary">{guild.members.length} / {guild.maxMembers}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
