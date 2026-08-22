'use client';
import React, { useState } from 'react';
import Image from 'next/image';

export default function StudySession() {
  const [activeTab, setActiveTab] = useState('notes');

  return (
    <main className="flex-1 flex flex-col lg:flex-row overflow-hidden relative w-full h-full">
      {/* Background Ambient Glow */}
      <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-primary-900/20 blur-[120px] rounded-full pointer-events-none z-0"></div>
      
      {/* LEFT PANEL: Video Player Workspace (70%) */}
      <section className="flex-1 lg:w-[70%] flex flex-col p-gutter lg:p-sp-6 gap-sp-4 z-10 overflow-y-auto">
        {/* Context Header */}
        <header className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-sp-3">
            <button className="w-10 h-10 flex items-center justify-center rounded-full bg-surface-1 hover:bg-surface-2 border border-white/10 text-on-surface transition-colors shadow-sm">
              <span className="material-symbols-outlined text-[20px]">arrow_back</span>
            </button>
            <div>
              <div className="font-label-mono text-label-mono text-primary flex items-center gap-2 uppercase tracking-wider">
                <span>Module 3</span>
                <span className="w-1 h-1 rounded-full bg-primary/50"></span>
                <span>Neural Architectures</span>
              </div>
              <h1 className="font-headline-md text-headline-md text-text-primary mt-1">Understanding Attention Mechanisms</h1>
            </div>
          </div>
          <div className="hidden md:flex items-center gap-sp-4">
            <div className="flex items-center gap-2 bg-surface-1 border border-white/10 rounded-full px-4 py-1.5 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
              <span className="material-symbols-outlined text-accent-amber text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>local_fire_department</span>
              <span className="font-label-mono text-label-mono text-text-primary font-bold">12 Day Streak</span>
            </div>
          </div>
        </header>
        
        {/* Video Player Container */}
        <div className="w-full aspect-video relative rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-black group shrink-0 mt-sp-2">
          {/* Video Feed Placeholder */}
          <div className="absolute inset-0 bg-surface-container-lowest">
            <div className="w-full h-full bg-cover bg-center opacity-80 mix-blend-luminosity" data-alt="A cinematic, high-resolution shot of a futuristic AI development environment displayed on a large 16:9 screen. The scene is illuminated by moody, deep indigo and violet ambient lighting, characteristic of a modern tech-forward academy. Complex neural network diagrams, glowing cyan code blocks, and dynamic data visualizations pulse gently against a dark background. The aesthetic is sleek, professional, and slightly cyberpunk, featuring glossy dark surfaces and vibrant glowing accents in a high-contrast dark mode setting." style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuBnc9SkGpcDkkR8jQ_yZ9YvkipzxnahwJD5FAfvD4xuBIbB-rWyUDxGw4I5ZWQZqHc9JE3urSceJP07i5NSjPuluYg8xBvFue9R5wD5oJeptLjehAj6vtshgzdEzDrnrmXHeCXIujIgI7ZbbP8CqyVxuALJflERSy3bYM8WFz5UtHqyBVN4DsN6FbOPDmV0ehquK_gnbrr4VXaQ8hN--K3eDi7_SW0z52GBS8uCmffOhxFhTfOpe7WMKg')" }}></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.6)_100%)]"></div>
          </div>
          
          {/* Custom Player Controls Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end px-sp-6 py-sp-4">
            {/* Progress Bar Area */}
            <div className="flex flex-col gap-2 w-full mb-sp-2 group/progress cursor-pointer">
              <div className="flex justify-between items-end font-label-mono text-label-mono text-on-surface-variant mb-1">
                <span className="text-text-primary">12:45</span>
                <span>45:20</span>
              </div>
              <div className="w-full h-1.5 group-hover/progress:h-2 transition-all bg-surface-2 rounded-full overflow-hidden relative backdrop-blur-sm border border-white/5">
                <div className="absolute top-0 left-0 h-full w-[60%] bg-white/20 rounded-full"></div>
                <div className="absolute top-0 left-0 h-full w-[28%] rounded-full shadow-[0_0_10px_rgba(139,92,246,0.8)]" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)' }}>
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3 h-3 bg-white rounded-full shadow-md scale-0 group-hover/progress:scale-100 transition-transform origin-center"></div>
                </div>
              </div>
            </div>
            {/* Lower Controls Row */}
            <div className="flex items-center justify-between text-text-primary">
              <div className="flex items-center gap-sp-4">
                <button className="hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10">
                  <span className="material-symbols-outlined text-[32px]" style={{ fontVariationSettings: "'FILL' 1" }}>pause</span>
                </button>
                <button className="hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[24px]">replay_10</span>
                </button>
                <button className="hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[24px]">forward_10</span>
                </button>
                <div className="flex items-center gap-2 ml-4 group/vol">
                  <button className="hover:text-primary transition-colors text-on-surface-variant">
                    <span className="material-symbols-outlined text-[24px]">volume_up</span>
                  </button>
                  <div className="w-0 overflow-hidden group-hover/vol:w-20 transition-all duration-300 h-1 bg-surface-2 rounded-full flex items-center cursor-pointer">
                    <div className="h-full w-[70%] bg-primary rounded-full"></div>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-sp-4">
                <button className="hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[24px]">closed_caption</span>
                </button>
                <button className="hover:text-primary transition-colors flex items-center justify-center w-8 h-8 rounded-full hover:bg-white/10 text-on-surface-variant">
                  <span className="material-symbols-outlined text-[24px]">settings</span>
                </button>
                <button className="hover:text-primary transition-colors flex items-center justify-center w-10 h-10 rounded-full hover:bg-white/10">
                  <span className="material-symbols-outlined text-[28px]">fullscreen</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video Meta & Engagement */}
        <div className="flex flex-col gap-sp-4 mt-sp-4">
          <div className="flex items-start justify-between bg-surface-1/50 border border-white/5 rounded-xl p-sp-4 backdrop-blur-md">
            <div className="flex gap-sp-4">
              <div className="w-12 h-12 rounded-full bg-surface-2 border border-white/10 overflow-hidden shrink-0">
                <Image className="w-full h-full object-cover" data-alt="A professional headshot of a female AI instructor, brightly lit against a dark studio background, wearing a sleek black turtleneck. The lighting features a subtle rim light in neon violet, matching the modern tech academy aesthetic." alt="A professional headshot of a female AI instructor" src="https://lh3.googleusercontent.com/aida-public/AB6AXuDd8pFpY3DuCDLHufyKk-4pNnLpE5pZIhnlhmbFy-zShQuKfYoAh6fBhVwW8iTimwBmvwgKE4N3hwa5VgYCGJAWys64-4yVc4XiQ5z_sZw7eHhEHA2Z6HRecVAN0EyZ3r7kpMUNbLbYHI4Rt-FsPGP-9Zcomf-72c8y-4ieVHTglPMIkme4NQ_RI8OMWTyXqUvlaNjkBv2evQ-eqrQkz9Q5s_l7WHyev4OklbhnCXsF1sZGqGm8-JeJeg" width={400} height={400} priority={false} />
              </div>
              <div className="flex flex-col">
                <h3 className="font-headline-md text-[18px] text-text-primary">Dr. Elena Rostova</h3>
                <p className="font-body-sm text-body-sm text-on-surface-variant">Lead AI Researcher, PathWeaver AI</p>
              </div>
            </div>
            <div className="flex items-center gap-sp-2">
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-bright text-text-primary font-label-mono text-label-mono transition-all border border-white/5">
                <span className="material-symbols-outlined text-[18px]">bookmark</span> Save
              </button>
              <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-surface-2 hover:bg-surface-bright text-text-primary font-label-mono text-label-mono transition-all border border-white/5">
                <span className="material-symbols-outlined text-[18px]">share</span> Share
              </button>
            </div>
          </div>
          <p className="font-body-base text-body-base text-on-surface-variant leading-relaxed max-w-4xl">
            In this session, we dive deep into the architecture of self-attention mechanisms. We'll explore how queries, keys, and values are computed to allow the model to weigh the importance of different words in a sequence dynamically.
          </p>
        </div>
        <div className="h-10 shrink-0"></div>
      </section>
      
      {/* RIGHT PANEL: Tabbed Side Panel */}
      <aside className="w-full lg:w-[360px] xl:w-[400px] border-t lg:border-t-0 lg:border-l border-white/10 bg-surface-1 flex flex-col h-full flex-shrink-0 z-20 shadow-[-8px_0_32px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col border-b border-white/10 bg-surface-glass backdrop-blur-md sticky top-0 z-10 shadow-[inset_0_1px_0_0_rgba(255,255,255,0.08)]">
          <div className="px-sp-4 py-sp-3 flex items-center justify-between">
            <h2 className="font-headline-md text-[18px] text-text-primary flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">auto_awesome</span> Study Assistant
            </h2>
            <button className="w-8 h-8 flex items-center justify-center rounded-md hover:bg-surface-2 text-on-surface-variant transition-colors">
              <span className="material-symbols-outlined text-[20px]">more_vert</span>
            </button>
          </div>
          <div className="flex items-center px-2">
            <button 
              onClick={() => setActiveTab('notes')}
              className={`flex-1 py-3 border-b-2 font-headline-md text-[15px] flex items-center justify-center gap-2 transition-all ${activeTab === 'notes' ? 'border-primary text-primary bg-[linear-gradient(180deg,rgba(208,188,255,0)_0%,rgba(208,188,255,0.1)_100%)]' : 'border-transparent text-on-surface-variant hover:text-text-primary hover:bg-surface-2/30'}`}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === 'notes' ? "'FILL' 1" : undefined }}>edit_note</span> Notes
            </button>
            <button 
              onClick={() => setActiveTab('chat')}
              className={`flex-1 py-3 border-b-2 font-headline-md text-[15px] flex items-center justify-center gap-2 transition-all ${activeTab === 'chat' ? 'border-primary text-primary bg-[linear-gradient(180deg,rgba(208,188,255,0)_0%,rgba(208,188,255,0.1)_100%)]' : 'border-transparent text-on-surface-variant hover:text-text-primary hover:bg-surface-2/30'}`}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === 'chat' ? "'FILL' 1" : undefined }}>forum</span> AI Chat
            </button>
            <button 
              onClick={() => setActiveTab('quiz')}
              className={`flex-1 py-3 border-b-2 font-headline-md text-[15px] flex items-center justify-center gap-2 transition-all ${activeTab === 'quiz' ? 'border-primary text-primary bg-[linear-gradient(180deg,rgba(208,188,255,0)_0%,rgba(208,188,255,0.1)_100%)]' : 'border-transparent text-on-surface-variant hover:text-text-primary hover:bg-surface-2/30'}`}
            >
              <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: activeTab === 'quiz' ? "'FILL' 1" : undefined }}>quiz</span> Quiz
            </button>
          </div>
        </div>
        
        {/* Tab Contents */}
        {activeTab === 'notes' && (
          <div className="flex-1 overflow-y-auto p-sp-4 flex flex-col gap-sp-3 relative bg-bg-base/50">
            <div className="flex items-center gap-2 text-primary font-label-mono text-label-mono bg-primary/10 border border-primary/20 rounded-lg p-3 animate-pulse shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              <span className="material-symbols-outlined text-[16px]">sync</span>
              Listening and generating notes...
            </div>
            
            <div className="bg-surface-2 border border-white/5 rounded-xl p-sp-3 flex flex-col gap-2 hover:border-white/10 transition-colors">
              <div className="flex items-center justify-between">
                <button className="bg-surface-bright hover:bg-primary hover:text-on-primary text-text-primary font-label-mono text-[11px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors border border-white/10">
                  <span className="material-symbols-outlined text-[14px]">play_arrow</span> 02:15
                </button>
                <div className="flex gap-1">
                  <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-[16px]">edit</span></button>
                </div>
              </div>
              <p className="font-body-sm text-body-sm text-on-surface leading-relaxed">
                The core concept of attention is essentially a soft-dictionary lookup.
              </p>
            </div>
            
            <div className="bg-gradient-to-br from-surface-2 to-surface-1 border border-primary/30 rounded-xl p-sp-3 flex flex-col gap-2 relative overflow-hidden group shadow-sm">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary shadow-[0_0_10px_rgba(208,188,255,0.8)]"></div>
              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-2">
                  <button className="bg-surface-bright hover:bg-primary hover:text-on-primary text-text-primary font-label-mono text-[11px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors border border-white/10">
                    <span className="material-symbols-outlined text-[14px]">play_arrow</span> 05:42
                  </button>
                  <span className="bg-primary/10 text-primary font-label-mono text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI Sync
                  </span>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button className="text-on-surface-variant hover:text-primary"><span className="material-symbols-outlined text-[16px]">content_copy</span></button>
                </div>
              </div>
              <div className="pl-2">
                <h4 className="font-headline-md text-[14px] text-primary mb-1">QKV Matrices</h4>
                <p className="font-body-sm text-body-sm text-on-surface leading-relaxed text-text-muted">
                  Queries, Keys, and Values are derived by multiplying the input embedding by three learned weight matrices (W_q, W_k, W_v).
                </p>
                <div className="mt-2 bg-surface-container-lowest border border-white/5 rounded-md p-2 font-label-mono text-label-mono text-secondary-fixed-dim overflow-x-auto">
                  Attention(Q,K,V) = softmax(QK^T / sqrt(d_k))V
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-surface-2 to-surface-1 border border-primary/30 rounded-xl p-sp-3 flex flex-col gap-2 relative overflow-hidden group shadow-sm">
              <div className="absolute left-0 top-0 bottom-0 w-1 bg-primary/50 group-hover:bg-primary transition-colors"></div>
              <div className="flex items-center justify-between pl-2">
                <div className="flex items-center gap-2">
                  <button className="bg-surface-bright hover:bg-primary hover:text-on-primary text-text-primary font-label-mono text-[11px] px-2 py-0.5 rounded flex items-center gap-1 transition-colors border border-white/10">
                    <span className="material-symbols-outlined text-[14px]">play_arrow</span> 11:20
                  </button>
                  <span className="bg-primary/10 text-primary font-label-mono text-[10px] px-1.5 py-0.5 rounded uppercase tracking-wider flex items-center gap-1">
                    <span className="material-symbols-outlined text-[12px]">auto_awesome</span> AI Sync
                  </span>
                </div>
              </div>
              <div className="pl-2">
                <h4 className="font-headline-md text-[14px] text-primary mb-1">Scaled Dot-Product</h4>
                <p className="font-body-sm text-body-sm text-on-surface leading-relaxed text-text-muted">
                  Dividing by the square root of the dimension (d_k) prevents the softmax function from being pushed into regions where it has extremely small gradients, which hinders learning.
                </p>
              </div>
            </div>
            
            <div className="bg-surface-2 border border-white/5 border-l-4 border-l-secondary rounded-xl p-sp-3 flex flex-col gap-2 hover:border-white/10 transition-colors shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="bg-secondary/20 text-secondary font-label-mono text-[11px] px-2 py-0.5 rounded flex items-center gap-1 border border-secondary/30">
                    <span className="w-1.5 h-1.5 rounded-full bg-secondary animate-pulse"></span> 12:45
                  </span>
                  <span className="text-on-surface-variant font-label-mono text-[10px] uppercase">Taking Note...</span>
                </div>
              </div>
              <div className="flex items-center gap-1 h-6 px-1">
                <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-1.5 h-1.5 bg-text-muted rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
            <div className="h-20 shrink-0"></div>
          </div>
        )}

        {activeTab === 'chat' && (
          <div className="flex-1 flex flex-col overflow-hidden bg-bg-base/50">
            <div className="flex-1 overflow-y-auto p-sp-4 flex flex-col gap-4">
              <div className="text-center mb-2">
                <div className="w-10 h-10 rounded-full bg-[linear-gradient(135deg,#8B5CF6_0%,#4C1D95_100%)] flex items-center justify-center mx-auto mb-2 shadow-[0_0_20px_rgba(139,92,246,0.4)]">
                  <span className="material-symbols-outlined text-white">smart_toy</span>
                </div>
                <p className="font-body-sm text-text-secondary">PathWeaver AI Assistant is ready to help.</p>
              </div>
              <div className="self-end max-w-[85%] bg-surface-2 p-3 rounded-t-lg rounded-bl-lg border border-white/5">
                <p className="font-body-sm text-text-primary">Can you explain again why SGD is faster than Batch GD if it makes more updates?</p>
              </div>
              <div className="self-start max-w-[85%] bg-primary-900/20 p-3 rounded-t-lg rounded-br-lg border border-primary/20">
                <p className="font-body-sm text-text-primary leading-relaxed">
                  Great question! While SGD performs an update for *every* training example, it doesn't need to process the *entire* dataset before taking a single step.<br/><br/>
                  In Batch GD, if you have 1 million records, you calculate 1 million gradients before moving 1 step. SGD takes 1 million small steps in the same amount of computation, often reaching a good solution much faster, even if the path is 'noisier'.
                </p>
              </div>
            </div>
            <div className="p-3 border-t border-white/10 bg-surface-1 shrink-0">
              <div className="relative flex items-center bg-black/20 border border-white/10 rounded-lg focus-within:border-primary transition-all">
                <input className="w-full bg-transparent border-none text-text-primary font-body-sm p-3 focus:ring-0 focus:outline-none placeholder:text-text-muted" placeholder="Ask a question about the lesson..." type="text" />
                <button className="absolute right-2 p-1.5 bg-primary/20 text-primary rounded-md hover:bg-primary/30 transition-colors">
                  <span className="material-symbols-outlined text-[18px]">send</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'quiz' && (
          <div className="flex-1 p-sp-4 flex flex-col items-center justify-center text-center bg-bg-base/50">
            <span className="material-symbols-outlined text-4xl text-text-muted mb-4">quiz</span>
            <h3 className="font-headline-md text-text-primary mb-2">Check Your Knowledge</h3>
            <p className="font-body-sm text-text-secondary mb-6 max-w-xs">Take a quick 3-question quiz generated by AI to test your understanding of this lesson.</p>
            <button className="px-6 py-2.5 rounded-lg bg-[linear-gradient(135deg,#8B5CF6_0%,#4C1D95_100%)] text-white font-body-base hover:scale-105 transition-all shadow-[0_0_20px_rgba(139,92,246,0.4)]">
              Start Quiz
            </button>
          </div>
        )}

        {/* Floating Action Area (Bottom of Sidebar) */}
        {activeTab === 'notes' && (
          <div className="p-sp-4 border-t border-white/10 bg-surface-glass backdrop-blur-md sticky bottom-0 z-10 shadow-[0_-10px_20px_rgba(0,0,0,0.2)]">
            <button className="w-full h-12 flex items-center justify-center gap-2 rounded-xl text-text-primary font-headline-md text-[16px] transition-all duration-300 hover:scale-[1.02] shadow-lg" style={{ background: 'linear-gradient(135deg, #8B5CF6 0%, #4C1D95 100%)' }}>
              <span className="material-symbols-outlined text-[20px]">add</span>
              Add Manual Note
            </button>
          </div>
        )}
      </aside>
    </main>
  );
}
