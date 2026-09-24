'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface LeaderboardEntry {
  userId: string;
  xp: number;
  user: {
    name: string | null;
    image: string | null;
    username: string | null;
  };
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [type, setType] = useState<'weekly' | 'alltime'>('weekly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchLeaderboard() {
      setLoading(true);
      try {
        const res = await fetch(`/api/leaderboard/weekly${type === 'alltime' ? '?type=alltime' : ''}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        setLeaderboard(data.leaderboard || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchLeaderboard();
  }, [type]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in-up">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display-xl text-3xl font-extrabold text-primary">Global Leaderboard</h1>
          <p className="text-text-muted mt-1 font-body-lg">
            Compete with the community and climb the ranks.
          </p>
        </div>
        
        <div className="flex bg-surface-2 p-1 rounded-xl shadow-sm self-start">
          <button
            onClick={() => setType('weekly')}
            className={`px-6 py-2 rounded-lg font-label-mono text-sm transition-all ${
              type === 'weekly' 
                ? 'bg-primary text-white shadow-glow-primary scale-105' 
                : 'text-text-muted hover:text-text-base hover:bg-surface-3'
            }`}
          >
            Weekly
          </button>
          <button
            onClick={() => setType('alltime')}
            className={`px-6 py-2 rounded-lg font-label-mono text-sm transition-all ${
              type === 'alltime' 
                ? 'bg-primary text-white shadow-glow-primary scale-105' 
                : 'text-text-muted hover:text-text-base hover:bg-surface-3'
            }`}
          >
            All Time
          </button>
        </div>
      </div>

      <div className="surface-glass rounded-2xl border border-white/10 overflow-hidden shadow-2xl">
        {loading ? (
          <div className="p-12 flex justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-12 text-center text-text-muted">
            <span className="material-symbols-outlined text-4xl mb-2 opacity-50">leaderboard</span>
            <p>No leaderboard data yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {leaderboard.map((entry, i) => (
              <div 
                key={entry.userId} 
                className={`p-4 flex items-center gap-4 transition-colors hover:bg-surface-variant/30 ${
                  i < 3 ? 'bg-gradient-to-r from-primary/5 to-transparent' : ''
                }`}
              >
                <div className={`w-8 h-8 flex items-center justify-center font-bold font-display-xl rounded-full ${
                  i === 0 ? 'bg-accent-amber text-bg-base shadow-[0_0_15px_rgba(245,158,11,0.5)]' :
                  i === 1 ? 'bg-slate-300 text-bg-base shadow-[0_0_15px_rgba(203,213,225,0.5)]' :
                  i === 2 ? 'bg-amber-700 text-bg-base shadow-[0_0_15px_rgba(180,83,9,0.5)]' :
                  'text-text-muted bg-surface-2'
                }`}>
                  {i + 1}
                </div>
                
                <div className="w-12 h-12 rounded-full overflow-hidden relative border-2 border-surface-2">
                  {entry.user.image ? (
                    <Image src={entry.user.image} alt={entry.user.name || 'User'} fill sizes="48px" className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-surface-variant flex items-center justify-center text-text-muted">
                      <span className="material-symbols-outlined">person</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <h3 className="font-headline-md font-bold text-text-base truncate">
                    {entry.user.name || 'Anonymous User'}
                  </h3>
                  <p className="font-label-mono text-xs text-primary/80 truncate">
                    {entry.user.username ? `@${entry.user.username}` : ''}
                  </p>
                </div>
                
                <div className="text-right">
                  <div className="font-display-xl font-bold text-primary text-xl flex items-center justify-end gap-1">
                    {entry.xp.toLocaleString()} <span className="text-[10px] uppercase font-label-mono text-text-muted">XP</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
