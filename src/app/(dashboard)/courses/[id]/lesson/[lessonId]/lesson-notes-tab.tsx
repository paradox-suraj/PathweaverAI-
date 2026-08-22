"use client";

import { useState, useEffect, useRef } from "react";
import { getNote, saveNote, logEvent } from "@/server/actions/progress";
import { Loader2 } from "lucide-react";

export function LessonNotesTab({ topicId }: { topicId: string }) {
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Load initial note
  useEffect(() => {
    let isMounted = true;
    
    getNote(topicId).then((res) => {
      if (isMounted) {
        if (res.success && res.note !== undefined) {
          setContent(res.note);
        }
        setIsLoading(false);
      }
    });
    
    return () => {
      isMounted = false;
    };
  }, [topicId]);

  // Handle typing with debounce
  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newContent = e.target.value;
    setContent(newContent);
    setIsSaving(true);
    
    if (timerRef.current) {
      clearTimeout(timerRef.current);
    }
    
    timerRef.current = setTimeout(() => {
      saveNote(topicId, newContent).then(() => {
        setIsSaving(false);
        logEvent("NOTES_UPDATED", topicId);
      });
    }, 1000);
  };

  return (
    <div className="flex-1 flex flex-col p-sp-4 gap-sp-4 h-full relative">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-body-lg text-body-lg text-text-primary">Your Notes</h2>
        <div className="flex items-center gap-2">
          {isSaving && <Loader2 className="w-4 h-4 animate-spin text-text-muted" />}
          <span className="text-[12px] text-text-muted font-label-mono">
            {isSaving ? "Saving..." : "Saved"}
          </span>
        </div>
      </div>
      
      {isLoading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <textarea
          value={content}
          onChange={handleChange}
          placeholder="Start typing your notes here. They will autosave..."
          className="flex-1 w-full bg-surface-2 border border-white/10 rounded-lg p-4 text-text-primary font-body-base resize-none focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/50 transition-all hide-scrollbar"
        />
      )}
    </div>
  );
}
