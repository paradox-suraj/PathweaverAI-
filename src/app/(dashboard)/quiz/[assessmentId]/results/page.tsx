'use client';

import React from 'react';
import Link from 'next/link';

export default function QuizResultsPage() {
  return (
    <>
      <style dangerouslySetInnerHTML={{__html: `
        .shimmer-bg {
            position: absolute;
            inset: 0;
            overflow: hidden;
            z-index: 0;
            pointer-events: none;
        }
        
        .particle {
            position: absolute;
            border-radius: 50%;
            background: radial-gradient(circle, rgba(139,92,246,0.8) 0%, rgba(139,92,246,0) 70%);
            animation: float 8s infinite linear;
            opacity: 0;
        }

        .particle:nth-child(1) { width: 100px; height: 100px; left: 10%; top: 20%; animation-delay: 0s; }
        .particle:nth-child(2) { width: 150px; height: 150px; right: 20%; top: 10%; animation-delay: 2s; background: radial-gradient(circle, rgba(78,222,163,0.6) 0%, rgba(78,222,163,0) 70%); }
        .particle:nth-child(3) { width: 80px; height: 80px; left: 30%; bottom: 20%; animation-delay: 4s; }
        .particle:nth-child(4) { width: 120px; height: 120px; right: 10%; bottom: 30%; animation-delay: 1s; }
        .particle:nth-child(5) { width: 200px; height: 200px; left: 50%; top: 50%; transform: translate(-50%, -50%); animation: pulse 6s infinite alternate; opacity: 0.2; background: radial-gradient(circle, rgba(76,29,149,0.5) 0%, rgba(76,29,149,0) 70%);}

        @keyframes float {
            0% { transform: translateY(100px) scale(0.8); opacity: 0; }
            20% { opacity: 0.5; }
            80% { opacity: 0.5; }
            100% { transform: translateY(-100px) scale(1.2); opacity: 0; }
        }

        @keyframes pulse {
            0% { transform: translate(-50%, -50%) scale(1); opacity: 0.1; }
            100% { transform: translate(-50%, -50%) scale(1.5); opacity: 0.3; }
        }

        @keyframes fadeInUp {
            from {
                opacity: 0;
                transform: translateY(20px);
            }
            to {
                opacity: 1;
                transform: translateY(0);
            }
        }
        .animate-fade-in-up {
            animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .shadow-glass-inner {
            box-shadow: inset 0 1px 0 0 rgba(255, 255, 255, 0.1);
        }
      `}} />

      {/* Shimmer Background */}
      <div className="shimmer-bg">
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
        <div className="particle"></div>
      </div>

      <main className="flex-1 w-full flex items-center justify-center p-sp-4 md:p-margin-desktop relative z-10 my-8">
        {/* Glassmorphism Container */}
        <div className="w-full max-w-4xl mx-auto bg-surface-glass backdrop-blur-xl border border-white/10 rounded-xl shadow-2xl p-sp-6 md:p-sp-8 flex flex-col items-center gap-sp-8 animate-fade-in-up">
          {/* Success Banner */}
          <div className="inline-flex items-center justify-center gap-sp-3 bg-surface-2/80 border border-secondary/30 px-sp-6 py-sp-3 rounded-full shadow-glass-inner">
            <span className="material-symbols-outlined text-secondary" style={{ fontVariationSettings: "'FILL' 1" }}>workspace_premium</span>
            <h2 className="font-headline-md text-headline-md text-text-primary m-0">Quiz Complete! Score: <span className="text-secondary">9/10</span></h2>
          </div>

          {/* 3D Animation Showcase */}
          <div className="w-full h-64 md:h-96 relative rounded-lg border border-white/5 bg-surface-1 overflow-hidden shadow-inner flex items-center justify-center group">
            <div className="absolute inset-0 opacity-10 group-hover:opacity-20 transition-opacity duration-500" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)" }}></div>
            {/* Overlay glow effect for depth */}
            <div className="absolute inset-0 bg-gradient-to-t from-surface-1 via-transparent to-transparent pointer-events-none"></div>
          </div>

          {/* Mastery Level Text */}
          <div className="text-center flex flex-col gap-sp-2">
            <p className="font-label-mono text-label-mono text-primary tracking-[0.2em] uppercase">New Status Achieved</p>
            <h1 className="font-display-xl-mobile md:font-display-xl text-display-xl-mobile md:text-display-xl bg-clip-text text-transparent drop-shadow-sm uppercase tracking-tight" style={{ backgroundImage: "linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)" }}>
              Level Up: Advanced Practitioner
            </h1>
          </div>

          {/* Statistics Grid */}
          <div className="w-full grid grid-cols-1 md:grid-cols-3 gap-sp-4 mt-sp-4">
            {/* Stat Card: Mastery */}
            <div className="bg-surface-2 border border-white/10 rounded-lg p-sp-4 flex flex-col items-center justify-center gap-sp-2 shadow-sm hover:border-secondary/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-secondary/10 flex items-center justify-center mb-sp-1">
                <span className="material-symbols-outlined text-secondary">trending_up</span>
              </div>
              <span className="font-headline-lg text-headline-lg text-secondary">+15%</span>
              <span className="font-label-mono text-label-mono text-text-muted uppercase">Mastery Gained</span>
            </div>

            {/* Stat Card: XP */}
            <div className="bg-surface-2 border border-white/10 rounded-lg p-sp-4 flex flex-col items-center justify-center gap-sp-2 shadow-sm hover:border-tertiary/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-tertiary/10 flex items-center justify-center mb-sp-1">
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
              </div>
              <span className="font-headline-lg text-headline-lg text-text-primary">450</span>
              <span className="font-label-mono text-label-mono text-text-muted uppercase">XP Earned</span>
            </div>

            {/* Stat Card: Accuracy */}
            <div className="bg-surface-2 border border-white/10 rounded-lg p-sp-4 flex flex-col items-center justify-center gap-sp-2 shadow-sm hover:border-info/50 transition-colors">
              <div className="w-10 h-10 rounded-full bg-info/10 flex items-center justify-center mb-sp-1">
                <span className="material-symbols-outlined text-info">my_location</span>
              </div>
              <span className="font-headline-lg text-headline-lg text-text-primary">90%</span>
              <span className="font-label-mono text-label-mono text-text-muted uppercase">Accuracy</span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col sm:flex-row gap-sp-4 justify-center mt-sp-4 pt-sp-6 border-t border-white/10">
            <button className="px-sp-6 py-sp-3 rounded-lg border border-outline-variant text-text-secondary bg-transparent hover:bg-surface-2 hover:text-text-primary transition-all duration-200 font-body-base text-body-base font-medium flex items-center justify-center gap-sp-2 w-full sm:w-auto group">
              <span className="material-symbols-outlined text-[20px] group-hover:-rotate-12 transition-transform">history</span>
              Review Mistakes
            </button>
            <Link href="/dashboard" className="px-sp-6 py-sp-3 rounded-lg text-text-primary hover:scale-[1.02] shadow-[0_0_20px_rgba(139,92,246,0.4)] active:scale-[0.98] transition-all duration-200 font-body-base text-body-base font-semibold flex items-center justify-center gap-sp-2 w-full sm:w-auto" style={{ background: "linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)" }}>
              <span className="material-symbols-outlined text-[20px]">dashboard</span>
              Back to Dashboard
            </Link>
          </div>
        </div>
      </main>
    </>
  );
}
