"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLiveParty } from "@/server/actions/live-party";
import { format } from "date-fns";

export default function HostPartyPage() {
  const router = useRouter();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Form State
  const [courseId, setCourseId] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [isImmediate, setIsImmediate] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // Fetch courses user can host
    fetch("/api/courses")
      .then(r => r.json())
      .then(data => {
        setCourses(data.courses || []);
        if (data.courses?.length > 0) {
          setCourseId(data.courses[0].id);
        }
        setLoading(false);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!courseId || !title) return;
    setIsSubmitting(true);

    const res = await createLiveParty({
      courseId,
      title,
      description,
      maxParticipants: 50,
      scheduledAt: isImmediate ? undefined : new Date(scheduledAt).toISOString(),
    });

    if (res.success && res.partyId) {
      if (isImmediate) {
        router.push(`/watch-party/${res.partyId}`);
      } else {
        router.push("/live-parties");
      }
    } else {
      console.error(res.error);
      setIsSubmitting(false);
    }
  };

  if (loading) return <div className="p-8 text-center text-text-secondary">Loading courses...</div>;

  return (
    <div className="flex-1 w-full max-w-3xl mx-auto p-sp-6 md:p-sp-8">
      <div className="mb-sp-8">
        <button onClick={() => router.back()} className="text-text-muted hover:text-text-primary flex items-center gap-1 mb-4 text-sm font-medium transition-colors">
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Back to Live Parties
        </button>
        <h1 className="font-display-xl text-display-xl text-text-primary">Host a Live Party</h1>
        <p className="text-text-secondary mt-2">Create a public or private session to learn together.</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-surface-glass border border-white/10 rounded-xl p-sp-6 md:p-sp-8 flex flex-col gap-sp-6">
        
        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Select Course</label>
          <select 
            value={courseId}
            onChange={(e) => setCourseId(e.target.value)}
            className="w-full bg-surface-2 border border-white/10 rounded-lg p-3 text-text-primary focus:border-primary outline-none"
            required
          >
            {courses.length === 0 && <option value="">You haven't created any courses yet</option>}
            {courses.map(c => (
              <option key={c.id} value={c.id}>{c.title}</option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Party Title</label>
          <input 
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Let's learn React together!"
            className="w-full bg-surface-2 border border-white/10 rounded-lg p-3 text-text-primary focus:border-primary outline-none"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-text-primary mb-2">Description (Optional)</label>
          <textarea 
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What will we focus on? Who should join?"
            className="w-full bg-surface-2 border border-white/10 rounded-lg p-3 text-text-primary focus:border-primary outline-none h-24 resize-none"
          />
        </div>

        <div className="bg-surface-2/50 border border-white/5 p-4 rounded-lg">
          <label className="flex items-center gap-3 cursor-pointer mb-4">
            <input 
              type="checkbox" 
              checked={isImmediate}
              onChange={(e) => setIsImmediate(e.target.checked)}
              className="w-5 h-5 accent-primary rounded bg-surface-variant border-white/20"
            />
            <span className="text-text-primary font-medium">Start immediately</span>
          </label>
          
          {!isImmediate && (
            <div className="pl-8">
              <label className="block text-sm font-medium text-text-secondary mb-2">Schedule For</label>
              <input 
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                min={format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                className="bg-surface-3 border border-white/10 rounded-lg p-2 text-text-primary outline-none"
                required={!isImmediate}
              />
            </div>
          )}
        </div>

        <div className="mt-4 pt-6 border-t border-white/10 flex justify-end">
          <button 
            type="submit" 
            disabled={isSubmitting || courses.length === 0}
            className="px-8 py-3 bg-primary-gradient text-white font-medium rounded-lg shadow-glow-primary hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {isSubmitting ? "Creating..." : isImmediate ? "Start Party Now" : "Schedule Party"}
          </button>
        </div>

      </form>
    </div>
  );
}
