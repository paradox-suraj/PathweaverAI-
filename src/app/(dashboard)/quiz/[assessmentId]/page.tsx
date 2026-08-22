'use client';

import React from 'react';
import Link from 'next/link';

export default function QuizSessionPage() {
  return (
    <>
      {/* Ambient background effect */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-primary/5 blur-[120px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[50vw] h-[50vw] rounded-full bg-inverse-primary/5 blur-[120px]"></div>
      </div>

      <main className="relative z-10 w-full max-w-[800px] mx-auto mt-8 bg-surface-glass backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header Actions */}
        <header className="flex items-center justify-between p-sp-6 pb-sp-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-text-secondary hover:text-text-primary transition-colors font-body-sm text-body-sm group">
            <span className="material-symbols-outlined text-[20px] group-hover:-translate-x-1 transition-transform">close</span>
            Exit Session
          </Link>
          <div className="flex items-center gap-2 text-primary font-label-mono text-label-mono uppercase tracking-wider">
            <span className="material-symbols-outlined text-[16px]">timer</span>
            <span>12:45</span>
          </div>
        </header>

        {/* Progress Section */}
        <div className="px-sp-6 pb-sp-6 space-y-sp-3">
          <div className="flex justify-between items-end font-label-mono text-label-mono">
            <span className="text-text-secondary">Question 4 of 10</span>
            <span className="text-primary">40%</span>
          </div>
          <div className="w-full h-2 bg-surface-2 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500 ease-out"
              style={{ width: "40%", background: "linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)" }}
            ></div>
          </div>
        </div>

        {/* Content Canvas */}
        <div className="px-sp-6 pb-sp-8 flex-1 flex flex-col">
          {/* Question */}
          <div className="mb-sp-8">
            <h1 className="font-headline-md text-headline-md text-text-primary leading-tight">
              Which of the following best describes the primary advantage of Stochastic Gradient Descent (SGD) over Batch Gradient Descent?
            </h1>
          </div>

          {/* Answer Options Stack */}
          <div className="flex flex-col gap-sp-3" role="radiogroup">
            {/* Option 1: Selected / Hover State */}
            {/* 
              Correct Answer State styles (conditionally applied if correct):
              bg-secondary/10 border-secondary shadow-glow-primary
              with text-secondary check_circle
            */}
            <label className="relative flex items-start gap-sp-4 p-sp-4 rounded-lg bg-primary/10 border border-primary shadow-glow-primary cursor-pointer transition-all duration-200 group">
              <input defaultChecked className="peer sr-only" name="quiz-answer" type="radio" value="1" />
              <div className="mt-1 w-5 h-5 shrink-0 rounded-full border-2 border-primary flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-100 scale-100 transition-all"></div>
              </div>
              <span className="font-body-lg text-body-lg text-text-primary">
                Faster convergence on large datasets due to frequent updates.
              </span>
              <span
                className="absolute right-sp-4 top-1/2 -translate-y-1/2 text-primary material-symbols-outlined opacity-100 transition-opacity"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                check_circle
              </span>
            </label>

            {/* Option 2 */}
            {/* 
              Incorrect Answer State styles (conditionally applied if incorrect):
              bg-error/10 border-error shadow-lg
              with text-error close icon
            */}
            <label className="relative flex items-start gap-sp-4 p-sp-4 rounded-lg bg-surface-1 border border-white/10 hover:bg-surface-2 hover:border-white/20 cursor-pointer transition-all duration-200 group">
              <input className="peer sr-only" name="quiz-answer" type="radio" value="2" />
              <div className="mt-1 w-5 h-5 shrink-0 rounded-full border-2 border-outline-variant flex items-center justify-center group-hover:border-primary/50 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 scale-50 transition-all"></div>
              </div>
              <span className="font-body-lg text-body-lg text-text-secondary group-hover:text-text-primary transition-colors">
                Guaranteed convergence to the global minimum in non-convex functions.
              </span>
            </label>

            {/* Option 3 */}
            <label className="relative flex items-start gap-sp-4 p-sp-4 rounded-lg bg-surface-1 border border-white/10 hover:bg-surface-2 hover:border-white/20 cursor-pointer transition-all duration-200 group">
              <input className="peer sr-only" name="quiz-answer" type="radio" value="3" />
              <div className="mt-1 w-5 h-5 shrink-0 rounded-full border-2 border-outline-variant flex items-center justify-center group-hover:border-primary/50 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 scale-50 transition-all"></div>
              </div>
              <span className="font-body-lg text-body-lg text-text-secondary group-hover:text-text-primary transition-colors">
                Lower variance in parameter updates, leading to a more stable path.
              </span>
            </label>

            {/* Option 4 */}
            <label className="relative flex items-start gap-sp-4 p-sp-4 rounded-lg bg-surface-1 border border-white/10 hover:bg-surface-2 hover:border-white/20 cursor-pointer transition-all duration-200 group">
              <input className="peer sr-only" name="quiz-answer" type="radio" value="4" />
              <div className="mt-1 w-5 h-5 shrink-0 rounded-full border-2 border-outline-variant flex items-center justify-center group-hover:border-primary/50 transition-colors">
                <div className="w-2.5 h-2.5 rounded-full bg-primary opacity-0 scale-50 transition-all"></div>
              </div>
              <span className="font-body-lg text-body-lg text-text-secondary group-hover:text-text-primary transition-colors">
                Eliminates the need for a learning rate schedule entirely.
              </span>
            </label>
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="p-sp-6 border-t border-white/10 bg-surface-container-lowest/50 flex items-center justify-between">
          {/* AI Context Placeholder (Collapsed/Inactive State before submit) */}
          <div className="flex items-center gap-2 opacity-50 font-label-mono text-label-mono text-text-muted">
            <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
            <span>AI Insight available after submission</span>
          </div>

          {/* Correct State Insight Example:
          <div className="flex flex-col gap-2 p-sp-4 rounded-lg bg-secondary/5 border border-secondary/20 max-w-[60%]">
            <div className="flex items-center gap-2 font-label-mono text-label-mono text-secondary">
              <span className="material-symbols-outlined text-[18px]">auto_awesome</span>
              <span className="font-semibold uppercase tracking-wider">AI Insight</span>
            </div>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              Correct! SGD's primary advantage is its efficiency...
            </p>
          </div>
          */}

          {/* Incorrect State Insight Example:
          <div className="flex flex-col gap-2 p-sp-4 rounded-lg bg-error/5 border border-error/20 max-w-[60%]">
            <div className="flex items-center gap-2 font-label-mono text-label-mono text-error">
              <span className="material-symbols-outlined text-[18px]">warning</span>
              <span className="font-semibold uppercase tracking-wider">AI CORRECTION</span>
            </div>
            <p className="text-body-sm text-text-secondary leading-relaxed">
              Not quite. Batch Gradient Descent actually has lower variance...
            </p>
          </div>
          */}

          {/* Submit Action */}
          <button
            className="px-sp-6 py-3 rounded-lg font-body-base text-body-base font-semibold text-text-primary shadow-lg transition-all duration-200 hover:scale-[1.02] active:scale-[0.98] flex items-center gap-2"
            style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)" }}
          >
            Submit Answer
            <span className="material-symbols-outlined text-[20px]">arrow_forward</span>
          </button>
        </div>
      </main>
      
      {/* Box shadow glow style for tailwind since we can't easily rely on just tailwind class if not in config */}
      <style dangerouslySetInnerHTML={{__html: `
        .shadow-glow-primary {
            box-shadow: 0 0 24px rgba(208, 188, 255, 0.25);
        }
      `}} />
    </>
  );
}
