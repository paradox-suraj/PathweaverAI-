import Link from "next/link";
import { ArrowLeft, BookOpen, Mail } from "lucide-react";

export default function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto w-full">
      <Link
        href="/dashboard"
        className="inline-flex items-center text-sm text-text-muted hover:text-text-primary mb-6 transition-colors font-label-mono uppercase tracking-widest"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Link>

      <div className="mb-sp-8">
        <h1 className="font-display-xl text-display-xl text-text-primary mb-2">Help & Support</h1>
        <p className="font-body-lg text-text-muted">Need assistance? Find answers and get support here.</p>
      </div>

      <div className="grid gap-6">
        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-primary" />
            </div>
            <h2 className="text-xl font-bold text-text-primary">How PathWeaver AI Works</h2>
          </div>
          <p className="text-text-muted leading-relaxed">
            PathWeaver AI transforms standard YouTube playlists into comprehensive, structured courses. 
            When you paste a playlist URL into the Course Generator, our AI breaks it down into logical modules, 
            extracts key concepts, and generates supplementary reading materials (Deep Dives) and quizzes to test your knowledge.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-lg bg-info/10 flex items-center justify-center">
              <span className="material-symbols-outlined text-info">insights</span>
            </div>
            <h2 className="text-xl font-bold text-text-primary">Mastery System</h2>
          </div>
          <p className="text-text-muted leading-relaxed">
            Instead of simply marking a video as "watched", PathWeaver AI requires you to pass a quiz to prove you understand the topic.
            Your quiz scores directly impact your Mastery percentage. If you score poorly, you can review the Deep Dive notes and retake the quiz to improve your score.
          </p>
        </div>

        <div className="glass-panel p-6 rounded-xl border border-white/5 flex flex-col md:flex-row gap-6 justify-between items-center">
          <div>
            <h2 className="text-lg font-bold text-text-primary mb-1">Still need help?</h2>
            <p className="text-sm text-text-muted">Contact our support team directly.</p>
          </div>
          <a href="mailto:support@pathweaver.com" className="flex items-center gap-2 px-6 py-2.5 rounded-lg bg-surface-2 hover:bg-surface-bright border border-white/10 text-text-primary font-label-mono uppercase tracking-wider transition-colors">
            <Mail className="w-4 h-4" />
            Email Support
          </a>
        </div>
      </div>
    </div>
  );
}
