'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { createGuildAction } from '@/server/actions/guild';
import { useRouter } from 'next/navigation';

export default function GuildsPage() {
  const [guilds, setGuilds] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function fetchGuilds() {
      try {
        const res = await fetch('/api/guilds');
        const data = await res.json();
        setGuilds(data.guilds || []);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    fetchGuilds();
  }, []);

  async function handleCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      slug: (formData.get('name') as string).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, ''),
      topic: formData.get('topic') as string,
      description: formData.get('description') as string,
    };
    
    const res = await createGuildAction(data);
    if (res.success) {
      router.push(`/guilds/${res.guildId}`);
    } else {
      alert(res.error);
    }
  }

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-fade-in-up">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="font-display-xl text-3xl font-extrabold text-primary">Guilds</h1>
          <p className="text-text-muted mt-1 font-body-lg">
            Join study groups, share knowledge, and learn together.
          </p>
        </div>
        <button
          onClick={() => setShowCreate(!showCreate)}
          className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-xl font-label-mono font-bold shadow-glow-primary transition-all scale-102"
        >
          <span className="material-symbols-outlined">add</span>
          Create Guild
        </button>
      </div>

      {showCreate && (
        <div className="surface-glass rounded-2xl p-6 border border-primary/30 shadow-glow-primary/20 animate-fade-in-up">
          <h2 className="text-xl font-headline-md font-bold text-text-base mb-4">Create a New Guild</h2>
          <form onSubmit={handleCreate} className="space-y-4 max-w-2xl">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-label-mono text-xs text-text-muted uppercase">Guild Name</label>
                <input required name="name" type="text" className="w-full bg-surface-2 border border-white/10 rounded-lg px-4 py-2.5 text-text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Advanced Rustaceans" />
              </div>
              <div className="space-y-1">
                <label className="font-label-mono text-xs text-text-muted uppercase">Primary Topic</label>
                <input required name="topic" type="text" className="w-full bg-surface-2 border border-white/10 rounded-lg px-4 py-2.5 text-text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all" placeholder="e.g. Rust, WebDev, AI" />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-label-mono text-xs text-text-muted uppercase">Description</label>
              <textarea name="description" rows={3} className="w-full bg-surface-2 border border-white/10 rounded-lg px-4 py-2.5 text-text-base focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all resize-none" placeholder="What is this guild about?"></textarea>
            </div>
            <div className="flex justify-end gap-3 pt-2">
              <button type="button" onClick={() => setShowCreate(false)} className="px-5 py-2 rounded-lg font-label-mono text-text-muted hover:bg-surface-3 transition-colors">Cancel</button>
              <button type="submit" className="px-5 py-2 rounded-lg font-label-mono bg-primary text-white hover:bg-primary/90 transition-colors shadow-glow-primary">Create</button>
            </div>
          </form>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full py-12 flex justify-center">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl">refresh</span>
          </div>
        ) : guilds.length === 0 ? (
          <div className="col-span-full py-12 text-center text-text-muted surface-glass rounded-2xl border border-white/5">
            <span className="material-symbols-outlined text-5xl mb-3 opacity-50">group_off</span>
            <p className="font-body-lg">No public guilds found. Be the first to create one!</p>
          </div>
        ) : (
          guilds.map(guild => (
            <Link key={guild.id} href={`/guilds/${guild.id}`} className="group surface-glass rounded-2xl border border-white/10 p-5 hover:border-primary/50 transition-all hover:-translate-y-1 hover:shadow-glow-primary/10 flex flex-col h-full">
              <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 rounded-xl bg-primary-gradient flex items-center justify-center shadow-inner">
                  <span className="material-symbols-outlined text-white font-bold">shield</span>
                </div>
                <div className="bg-surface-2 px-3 py-1 rounded-full border border-white/5 flex items-center gap-1.5">
                  <span className="material-symbols-outlined text-sm text-text-muted">group</span>
                  <span className="font-label-mono text-xs font-bold text-text-base">{guild._count.members}</span>
                </div>
              </div>
              
              <h3 className="font-headline-md font-bold text-xl text-text-base mb-1 group-hover:text-primary transition-colors line-clamp-1">{guild.name}</h3>
              <p className="text-xs font-label-mono text-primary/80 uppercase tracking-wider mb-3">{guild.topic}</p>
              
              <p className="text-text-muted font-body-md line-clamp-3 mb-6 flex-1">
                {guild.description || 'No description provided.'}
              </p>
              
              <div className="mt-auto pt-4 border-t border-white/5 flex items-center gap-2">
                <span className="text-xs text-text-muted font-label-mono">Founded by</span>
                <span className="text-sm text-text-base font-semibold">{guild.founder?.name || 'Unknown'}</span>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
}
