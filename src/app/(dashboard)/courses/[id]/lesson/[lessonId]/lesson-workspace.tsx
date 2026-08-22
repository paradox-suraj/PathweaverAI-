"use client";

import { useState, useTransition, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { completeLesson, logEvent } from "@/server/actions/progress";
import { Loader2 } from "lucide-react";
import YouTube from "react-youtube";
import { LessonNotesTab } from "./lesson-notes-tab";
import { LessonQuizTab } from "./lesson-quiz-tab";
import { LessonChatTab } from "./lesson-chat-tab";
import { LessonArticleTab } from "./lesson-article-tab";

type LessonWorkspaceProps = {
  course: any;
  currentLesson: any;
  nextLessonId: string | null;
  isCompleted: boolean;
  youtubeId: string | null;
  initialTab?: "read" | "notes" | "chat" | "quiz";
};

export function LessonWorkspace({
  course,
  currentLesson,
  nextLessonId,
  isCompleted,
  youtubeId,
  initialTab,
}: LessonWorkspaceProps) {
  const [activeTab, setActiveTab] = useState<"read" | "notes" | "chat" | "quiz">(initialTab || "read");
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPending, startTransition] = useTransition();
  const [player, setPlayer] = useState<any>(null);
  const router = useRouter();

  const handleComplete = () => {
    startTransition(async () => {
      const result = await completeLesson(currentLesson.id, course.id);
      if (result.success && nextLessonId) {
        router.push(`/courses/${course.id}/lesson/${nextLessonId}`);
      } else if (result.success && !nextLessonId) {
        router.push(`/courses/${course.id}`);
      }
    });
  };

  // Find lesson index
  let lessonIndex = 1;
  let totalLessons = 0;
  let found = false;
  for (const module of course.modules) {
    for (const topic of module.topics) {
      totalLessons++;
      if (!found) {
        if (topic.id === currentLesson.id) {
          found = true;
        } else {
          lessonIndex++;
        }
      }
    }
  }

  // Handle Escape key to exit focus mode
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isFocusMode) {
        setIsFocusMode(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isFocusMode]);

  return (
    <div className={
      isFocusMode 
        ? "fixed inset-0 z-[100] bg-background overflow-y-auto p-4 md:p-8 flex flex-col items-center animate-in fade-in zoom-in-95 duration-300"
        : "flex flex-col gap-sp-6 items-start pb-16 w-full max-w-6xl mx-auto"
    }>
      <div className={isFocusMode ? "w-full max-w-6xl flex flex-col gap-sp-6" : "w-full flex flex-col gap-sp-6"}>
        {/* Top Panel: Video & Details */}
        <div className="flex flex-col gap-sp-4 min-w-0 w-full relative">
          
          {/* Focus Mode Toggle */}
          <button
            onClick={() => setIsFocusMode(!isFocusMode)}
            className="absolute -top-4 right-0 z-10 md:top-0 px-3 py-1.5 rounded-full bg-surface-2 border border-white/10 text-text-secondary hover:text-primary transition-colors flex items-center gap-2 text-sm font-label-mono shadow-sm"
            aria-label={isFocusMode ? "Exit Focus Mode" : "Enter Focus Mode"}
          >
            <span className="material-symbols-outlined text-[18px]">
              {isFocusMode ? 'fullscreen_exit' : 'fullscreen'}
            </span>
            <span className="hidden sm:inline">
              {isFocusMode ? 'Exit Focus Mode' : 'Focus Mode'}
            </span>
          </button>

          {/* Breadcrumb */}
          <div className="flex items-center text-text-secondary font-label-mono text-label-mono gap-2 shrink-0 overflow-x-auto whitespace-nowrap hide-scrollbar pr-32">
            <Link href="/courses" className="hover:text-primary transition-colors">Curriculum</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <Link href={`/courses/${course.id}`} className="hover:text-primary transition-colors">{course.title}</Link>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="text-primary truncate max-w-[300px]">{currentLesson.title}</span>
          </div>

        {/* Video Player Container */}
        <div className="w-full aspect-video bg-surface-1 rounded-xl overflow-hidden relative shadow-lg border border-white/10 shrink-0">
          {youtubeId ? (
            <YouTube
              videoId={youtubeId}
              className="w-full h-full absolute inset-0"
              opts={{
                width: "100%",
                height: "100%",
                playerVars: { rel: 0, autoplay: 0 },
              }}
              onReady={(e) => setPlayer(e.target)}
              onPlay={() => logEvent("VIDEO_PLAYED", currentLesson.id)}
              onPause={() => logEvent("VIDEO_PAUSED", currentLesson.id)}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-text-muted">
              <span className="material-symbols-outlined text-4xl opacity-50 mb-4">play_circle</span>
              <p>No video available for this lesson.</p>
            </div>
          )}
        </div>

        {/* Lesson Details */}
        <div className="glass-panel rounded-xl p-sp-6 flex flex-col gap-sp-4 shrink-0">
          <div className="flex flex-col md:flex-row justify-between items-start gap-4">
            <div className="flex-1 min-w-0">
              <span className="inline-block px-2 py-1 bg-primary-900/30 text-primary border border-primary/20 rounded font-label-mono text-label-mono mb-2">
                Lesson {lessonIndex} of {totalLessons}
              </span>
              <h1 className="font-headline-md text-headline-md text-text-primary mb-2 truncate">
                {currentLesson.title}
              </h1>
              <p className="font-body-base text-body-base text-text-secondary max-w-4xl">
                {currentLesson.description}
              </p>
            </div>
            
            {isCompleted ? (
              <button 
                disabled
                className="shrink-0 px-4 py-2 bg-secondary/10 border border-secondary/30 rounded-lg text-secondary font-body-base flex items-center gap-2"
              >
                <span className="material-symbols-outlined text-[18px]">check_circle</span>
                Completed
              </button>
            ) : (
              <button 
                onClick={handleComplete}
                disabled={isPending}
                className="shrink-0 px-4 py-2 bg-primary-gradient border border-white/10 hover:shadow-glow-primary rounded-lg text-white font-body-base flex items-center gap-2 transition-all hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isPending ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <span className="material-symbols-outlined text-[18px]">check_circle</span>
                )}
                Mark as Complete
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Panel: Tabs */}
      <div className="w-full min-w-0 flex flex-col glass-panel rounded-xl overflow-hidden shrink-0 min-h-[600px]">
        {/* Tab Headers */}
        <div className="flex border-b border-white/10 shrink-0 overflow-x-auto hide-scrollbar">
          <button 
            className={`flex-1 py-3 px-4 font-body-sm text-center transition-colors focus:outline-none whitespace-nowrap ${activeTab === 'read' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-text-secondary border-b-2 border-transparent hover:text-text-primary hover:bg-white/5'}`}
            onClick={() => setActiveTab('read')}
          >
            Deep Dive
          </button>
          <button 
            className={`flex-1 py-3 px-4 font-body-sm text-center transition-colors focus:outline-none whitespace-nowrap ${activeTab === 'notes' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-text-secondary border-b-2 border-transparent hover:text-text-primary hover:bg-white/5'}`}
            onClick={() => setActiveTab('notes')}
          >
            Notes
          </button>
          <button 
            className={`flex-1 py-3 px-4 font-body-sm text-center transition-colors focus:outline-none ${activeTab === 'chat' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-text-secondary border-b-2 border-transparent hover:text-text-primary hover:bg-white/5'}`}
            onClick={() => setActiveTab('chat')}
          >
            AI Chat
          </button>
          <button 
            className={`flex-1 py-3 px-4 font-body-sm text-center transition-colors focus:outline-none ${activeTab === 'quiz' ? 'text-primary border-b-2 border-primary bg-primary/5' : 'text-text-secondary border-b-2 border-transparent hover:text-text-primary hover:bg-white/5'}`}
            onClick={() => setActiveTab('quiz')}
          >
            Quiz
          </button>
        </div>

        {/* Tab Content: Read */}
        {activeTab === 'read' && (
          <LessonArticleTab 
            topicId={currentLesson.id}
            content={currentLesson.resources?.find((r: any) => r.type === 'ARTICLE')?.articleResource?.content} 
            onSeekTo={(seconds: number) => {
              if (player && typeof player.seekTo === 'function') {
                player.seekTo(seconds, true);
                window.scrollTo({ top: 0, behavior: 'smooth' }); // Scroll up to video
              }
            }}
          />
        )}

        {/* Tab Content: Notes */}
        {activeTab === 'notes' && (
          <LessonNotesTab topicId={currentLesson.id} />
        )}

        {/* Tab Content: Chat */}
        {activeTab === 'chat' && (
          <LessonChatTab 
            topicId={currentLesson.id} 
            getCurrentTimestamp={() => player ? player.getCurrentTime() : null}
          />
        )}

        {/* Tab Content: Quiz */}
        {activeTab === 'quiz' && (
          <LessonQuizTab topicId={currentLesson.id} />
        )}
      </div>
      </div>
    </div>
  );
}
