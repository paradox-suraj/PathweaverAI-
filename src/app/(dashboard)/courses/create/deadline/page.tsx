'use client';

import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CourseGenerationInput } from "@/server/schema/course";

export default function CourseCreationDeadlineSelection() {
    const { register, watch } = useFormContext<CourseGenerationInput>();
    const router = useRouter();

    const handleNext = () => {
        router.push("/courses/create/commitment");
    };

    const handleBack = () => {
        router.push("/courses/create/level");
    };

    const handleSkip = () => {
        router.push("/courses/create/commitment");
    };

    const deadlineDate = watch("deadlineDate");

    return (
        <div className="relative font-body-base overflow-hidden flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-8">
            <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-primary-900/30 blur-[120px]"></div>
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-secondary-container/20 blur-[100px]"></div>
            </div>
            
            <main className="relative z-10 w-full max-w-3xl px-sp-4 md:px-0 flex flex-col items-center">
                <div className="w-full bg-surface-glass backdrop-blur-md border border-white/10 rounded-xl shadow-2xl overflow-hidden flex flex-col">
                    <div className="px-sp-6 py-sp-4 border-b border-white/10 bg-surface-1/50 flex items-center justify-between">
                        {/* Progress Indicator */}
                        <div className="flex items-center w-full max-w-lg mx-auto">
                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary border border-secondary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                </div>
                                <span className="font-label-mono text-label-mono text-secondary">Topic</span>
                            </div>
                            <div className="flex-1 h-px bg-secondary/50 mx-2"></div>
                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-8 h-8 rounded-full bg-secondary/20 text-secondary border border-secondary flex items-center justify-center">
                                    <span className="material-symbols-outlined text-[16px]">check</span>
                                </div>
                                <span className="font-label-mono text-label-mono text-secondary">Level</span>
                            </div>
                            <div className="flex-1 h-px bg-secondary/50 mx-2"></div>
                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-8 h-8 rounded-full bg-primary/20 text-primary border-2 border-primary flex items-center justify-center shadow-[0_0_10px_rgba(139,92,246,0.3)]">
                                    <span className="font-label-mono text-[14px] font-bold">3</span>
                                </div>
                                <span className="font-label-mono text-label-mono text-primary font-bold">Deadline</span>
                            </div>
                            <div className="flex-1 h-px bg-surface-variant mx-2"></div>
                            <div className="flex flex-col items-center gap-2 flex-1">
                                <div className="w-8 h-8 rounded-full bg-surface-2 text-text-muted border border-outline-variant flex items-center justify-center">
                                    <span className="font-label-mono text-[14px]">4</span>
                                </div>
                                <span className="font-label-mono text-label-mono text-text-muted">Review</span>
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-sp-8 flex flex-col gap-sp-6 items-center">
                        <div className="text-center flex flex-col gap-sp-2 mb-sp-4">
                            <h1 className="font-headline-lg text-headline-lg text-text-primary">Set Your Deadline</h1>
                            <p className="font-body-base text-body-base text-text-secondary max-w-md mx-auto">
                                When do you want to master this subject? AI will pace your lessons accordingly.
                            </p>
                        </div>
                        
                        <div className="bg-surface-1 rounded-xl border border-white/5 p-sp-6 shadow-md max-w-md w-full flex flex-col items-center justify-center space-y-6">
                            <div className="flex flex-col w-full gap-2">
                                <label htmlFor="deadlineDate" className="text-sm font-medium text-text-primary">
                                    Select Target Date (Optional)
                                </label>
                                <input 
                                    type="date"
                                    id="deadlineDate"
                                    min={new Date().toISOString().split("T")[0]}
                                    className="w-full bg-surface-2 border border-white/10 rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary"
                                    {...register("deadlineDate")}
                                />
                            </div>

                            {deadlineDate && (
                                <div className="bg-primary/10 border border-primary/20 rounded-lg p-sp-4 flex items-start gap-sp-3 w-full">
                                    <span className="material-symbols-outlined text-primary mt-0.5">smart_toy</span>
                                    <div>
                                        <h4 className="font-body-base text-[15px] font-semibold text-primary">AI Pace Enabled</h4>
                                        <p className="font-body-sm text-body-sm text-text-secondary mt-1">Your learning plan will be automatically structured to hit your target date.</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                    
                    <footer className="p-sp-6 md:p-margin-desktop border-t border-white/10 flex flex-col-reverse md:flex-row items-center justify-between bg-surface-glass gap-4">
                        <div className="flex items-center gap-4 w-full md:w-auto">
                            <button onClick={handleBack} className="flex-1 md:flex-none px-sp-6 py-sp-3 rounded-lg font-body-base text-body-base text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors flex items-center justify-center gap-sp-2">
                                Back
                            </button>
                            <button onClick={handleSkip} className="flex-1 md:flex-none px-sp-6 py-sp-3 rounded-lg font-body-base text-body-base text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors text-center">
                                Skip
                            </button>
                        </div>
                        <button onClick={handleNext} className="w-full md:w-auto px-sp-8 py-sp-3 rounded-lg bg-primary-gradient font-body-base text-body-base text-white hover:scale-[1.02] active:scale-95 shadow-glow-primary transition-all flex items-center justify-center gap-sp-2">
                            Next Step
                            <span className="material-symbols-outlined">arrow_forward</span>
                        </button>
                    </footer>
                </div>
            </main>
        </div>
    );
}
