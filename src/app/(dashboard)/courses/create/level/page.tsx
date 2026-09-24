'use client';

import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CourseGenerationInput } from "@/server/schema/course";

export default function CourseCreationLevelSelection() {
    const { watch, setValue } = useFormContext<CourseGenerationInput>();
    const router = useRouter();
    const level = watch("level");

    const handleNext = () => {
        if (level) {
            router.push("/courses/create/deadline");
        }
    };

    const handleBack = () => {
        router.push("/courses/create");
    };

    return (
        <div className="relative font-body-base overflow-hidden flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-8">
            <div className="absolute inset-0 z-0 pointer-events-none">
                <div className="w-full h-full opacity-30" style={{ background: 'radial-gradient(circle at 30% 30%, rgba(139, 92, 246, 0.18), transparent 60%), radial-gradient(circle at 70% 70%, rgba(59, 130, 246, 0.12), transparent 50%)' }}></div>
                <div className="absolute inset-0 bg-bg-base/80"></div>
            </div>
            
            <main className="relative z-10 w-full max-w-[800px] p-sp-4 md:p-gutter">
                <div className="w-full bg-surface-glass backdrop-blur-xl border border-white/10 rounded-xl shadow-modal overflow-hidden flex flex-col">
                    <header className="p-sp-6 md:p-margin-desktop border-b border-white/10">
                        <div className="flex items-center justify-between mb-sp-8 relative">
                            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-1 bg-surface-2 rounded-full -z-10">
                                <div className="h-full bg-primary-gradient rounded-full" style={{ width: '25%' }}></div>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-primary-gradient flex items-center justify-center text-white shadow-glow-primary">
                                    <span className="material-symbols-outlined text-sm">check</span>
                                </div>
                                <span className="font-label-mono text-label-mono text-text-primary">Topic</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-surface-1 border-2 border-primary flex items-center justify-center text-primary shadow-glow-primary relative after:content-[''] after:absolute after:inset-1 after:bg-primary after:rounded-full after:animate-pulse">
                                    <span className="font-label-mono text-label-mono text-white relative z-10">2</span>
                                </div>
                                <span className="font-label-mono text-label-mono text-text-primary">Level</span>
                            </div>
                            <div className="flex flex-col items-center gap-2">
                                <div className="w-8 h-8 rounded-full bg-surface-2 border border-outline-variant flex items-center justify-center text-text-secondary">
                                    <span className="font-label-mono text-label-mono">3</span>
                                </div>
                                <span className="font-label-mono text-label-mono text-text-secondary">Deadline</span>
                            </div>
                            <div className="flex-col items-center gap-2 hidden sm:flex">
                                <div className="w-8 h-8 rounded-full bg-surface-2 border border-outline-variant flex items-center justify-center text-text-secondary">
                                    <span className="font-label-mono text-label-mono">4</span>
                                </div>
                                <span className="font-label-mono text-label-mono text-text-secondary">Commitment</span>
                            </div>
                            <div className="flex-col items-center gap-2 hidden sm:flex">
                                <div className="w-8 h-8 rounded-full bg-surface-2 border border-outline-variant flex items-center justify-center text-text-secondary">
                                    <span className="font-label-mono text-label-mono">5</span>
                                </div>
                                <span className="font-label-mono text-label-mono text-text-secondary">Review</span>
                            </div>
                        </div>
                        <div className="text-center">
                            <h1 className="font-headline-md text-headline-md text-text-primary mb-sp-2">Step 2: Current Level</h1>
                            <p className="font-body-lg text-body-lg text-text-secondary">Assess your current proficiency to tailor the curriculum depth.</p>
                        </div>
                    </header>
                    
                    <section className="p-sp-6 md:p-margin-desktop flex-grow bg-surface-1/50">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-sp-4">
                            {/* Option 1: Beginner */}
                            <button 
                                onClick={() => setValue("level", "Beginner", { shouldValidate: true })}
                                className={`text-left p-sp-6 rounded-xl border transition-all duration-200 group ${level === 'Beginner' ? 'bg-primary/20 border-primary' : 'bg-surface-1 hover:bg-surface-2 border-white/10 hover:border-primary/50'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-secondary text-2xl group-hover:scale-110 transition-transform">school</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${level === 'Beginner' ? 'border-primary bg-primary' : 'border-white/20 group-hover:border-primary/50'}`}>
                                        {level === 'Beginner' && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                    </div>
                                </div>
                                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2">Beginner</h3>
                                <p className="font-body-sm text-body-sm text-text-secondary">I'm new to this and need to start from the absolute basics.</p>
                            </button>

                            {/* Option 2: Intermediate */}
                            <button 
                                onClick={() => setValue("level", "Intermediate", { shouldValidate: true })}
                                className={`text-left p-sp-6 rounded-xl border transition-all duration-200 group ${level === 'Intermediate' ? 'bg-primary/20 border-primary' : 'bg-surface-1 hover:bg-surface-2 border-white/10 hover:border-primary/50'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-full bg-info/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-info text-2xl group-hover:scale-110 transition-transform">trending_up</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${level === 'Intermediate' ? 'border-primary bg-primary' : 'border-white/20 group-hover:border-primary/50'}`}>
                                        {level === 'Intermediate' && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                    </div>
                                </div>
                                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2">Intermediate</h3>
                                <p className="font-body-sm text-body-sm text-text-secondary">I know the basics and want to dive deeper into core concepts.</p>
                            </button>

                            {/* Option 3: Advanced */}
                            <button 
                                onClick={() => setValue("level", "Advanced", { shouldValidate: true })}
                                className={`text-left p-sp-6 rounded-xl border transition-all duration-200 group ${level === 'Advanced' ? 'bg-primary/20 border-primary' : 'bg-surface-1 hover:bg-surface-2 border-white/10 hover:border-primary/50'}`}
                            >
                                <div className="flex justify-between items-start mb-4">
                                    <div className="w-12 h-12 rounded-full bg-accent-amber/20 flex items-center justify-center">
                                        <span className="material-symbols-outlined text-accent-amber text-2xl group-hover:scale-110 transition-transform">psychology</span>
                                    </div>
                                    <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${level === 'Advanced' ? 'border-primary bg-primary' : 'border-white/20 group-hover:border-primary/50'}`}>
                                        {level === 'Advanced' && <span className="material-symbols-outlined text-white text-sm">check</span>}
                                    </div>
                                </div>
                                <h3 className="font-headline-sm text-headline-sm text-text-primary mb-2">Advanced</h3>
                                <p className="font-body-sm text-body-sm text-text-secondary">I'm experienced and looking for complex challenges and mastery.</p>
                            </button>
                        </div>
                    </section>
                    
                    <footer className="p-sp-6 md:p-margin-desktop border-t border-white/10 flex items-center justify-between bg-surface-glass">
                        <button onClick={handleBack} className="px-sp-6 py-sp-3 rounded-lg font-body-base text-body-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-200">
                            Back
                        </button>
                        <button 
                            onClick={handleNext}
                            className="px-sp-8 py-sp-3 rounded-lg font-body-base text-body-base font-medium text-white bg-primary-gradient hover:scale-105 active:scale-95 transition-all duration-200 shadow-glow-primary flex items-center gap-2 group"
                        >
                            Next Step
                            <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </footer>
                </div>
            </main>
        </div>
    );
}
