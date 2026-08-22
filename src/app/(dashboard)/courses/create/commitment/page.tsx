'use client';

import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CourseGenerationInput } from "@/server/schema/course";

export default function CourseCreationCommitmentSelection() {
    const { watch, setValue } = useFormContext<CourseGenerationInput>();
    const router = useRouter();
    const hoursPerDay = watch("hoursPerDay") || 2;
    const deadline = watch("deadlineDate");

    const handleNext = () => {
        router.push("/courses/create/review");
    };

    const handleBack = () => {
        router.push("/courses/create/deadline");
    };

    return (
        <div className="relative font-body-base overflow-hidden flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-8 selection:bg-primary/30">
            <div className="fixed inset-0 z-0 pointer-events-none opacity-40">
                <div className="bg-cover bg-center w-full h-full" style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDiF3IhRfdvgBXzpobuJ9c8wxxSm2Alad2DKGNErpcTuCHEWTWpYby3WVR9XqzffvzRa6W-D4edIbHrKi9NzcHy8aojrm9uKONoN0nxdpzdUZ_e0PMLHbcpOLTBLLpQXe6luj4J49J_GyLz_GYB77RBsGeCq-5d3Cl88NrIys_cxsCCMk9yg39p5_qKc68YZJxJwcAM5lAuJFhcQi02iciEcsFRFamVpQ1NRYLs5aQ3HDp63EM21h1NhA')" }}></div>
            </div>
            <div className="fixed inset-0 z-0 backdrop-blur-[12px] bg-bg-base/70"></div>
            
            <main className="relative z-10 flex items-center justify-center w-full p-sp-4 md:p-margin-desktop">
                <div className="w-full max-w-2xl bg-surface-glass border border-white/10 rounded-xl shadow-2xl backdrop-blur-xl overflow-hidden flex flex-col">
                    <div className="p-sp-6 border-b border-white/10">
                        <div className="flex items-center justify-between mb-sp-4">
                            <span className="font-label-mono text-label-mono text-primary uppercase tracking-widest">Step 4 of 5</span>
                            <button className="text-text-secondary hover:text-text-primary transition-colors">
                                <span className="material-symbols-outlined" data-icon="close">close</span>
                            </button>
                        </div>
                        <div className="flex items-center gap-sp-2">
                            <div className="flex-1 h-2 rounded-full bg-primary-gradient"></div>
                            <div className="flex-1 h-2 rounded-full bg-primary-gradient"></div>
                            <div className="flex-1 h-2 rounded-full bg-primary-gradient"></div>
                            <div className="flex-1 h-2 rounded-full bg-primary-gradient shadow-glow-primary relative overflow-hidden">
                                <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                            </div>
                            <div className="flex-1 h-2 rounded-full bg-surface-2"></div>
                        </div>
                        <div className="flex justify-between mt-sp-2 font-label-mono text-[10px] text-text-muted">
                            <span>Topic</span>
                            <span>Level</span>
                            <span>Deadline</span>
                            <span className="text-primary font-bold">Commitment</span>
                            <span>Review</span>
                        </div>
                    </div>
                    
                    <div className="p-sp-6 md:p-sp-8 flex-1">
                        <div className="text-center mb-sp-8">
                            <h2 className="font-headline-md text-headline-md md:font-headline-lg md:text-headline-lg mb-sp-3 text-text-primary">How much time can you commit?</h2>
                            <p className="font-body-base text-body-base text-text-secondary max-w-lg mx-auto">Set your daily study goal. AI will adjust the curriculum density to match your pace.</p>
                        </div>
                        
                        <div className="mb-sp-8">
                            {/* Interactive Slider Area */}
                            <div className="relative pt-sp-8 pb-sp-4 px-2">
                                <div className="absolute top-1/2 left-0 w-full h-1 bg-surface-2 -translate-y-1/2 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-primary-gradient transition-all duration-300 ease-out" 
                                        style={{ width: `${Math.min(100, Math.max(0, ((hoursPerDay - 1) / 11) * 100))}%` }}
                                    ></div>
                                </div>
                                
                                <input 
                                    type="range" 
                                    min="1" 
                                    max="12" 
                                    value={hoursPerDay}
                                    onChange={(e) => setValue("hoursPerDay", parseInt(e.target.value), { shouldValidate: true })}
                                    className="w-full absolute top-1/2 left-0 -translate-y-1/2 opacity-0 cursor-pointer h-8 z-20"
                                />

                                {/* Custom Slider Thumb representation (visual only) */}
                                <div 
                                    className="w-8 h-8 bg-white rounded-full absolute top-1/2 -translate-y-1/2 -translate-x-1/2 shadow-glow-primary border-4 border-primary flex items-center justify-center transition-all duration-75 pointer-events-none z-10"
                                    style={{ left: `${Math.min(100, Math.max(0, ((hoursPerDay - 1) / 11) * 100))}%` }}
                                >
                                    <div className="w-2 h-2 rounded-full bg-primary"></div>
                                </div>
                            </div>
                            
                            <div className="flex justify-between items-center mt-sp-4 font-label-mono text-xs text-text-muted">
                                <span>1 hr</span>
                                <span>12 hrs</span>
                            </div>
                            
                            <div className="text-center mt-sp-8">
                                <div className="inline-flex items-center justify-center gap-2 px-sp-6 py-sp-3 rounded-full bg-surface-2 border border-white/10">
                                    <span className="font-headline-lg text-headline-lg text-primary">{hoursPerDay}</span>
                                    <span className="font-label-mono text-label-mono text-text-secondary uppercase tracking-wider">Hours / Day</span>
                                </div>
                                <p className="font-body-sm text-body-sm text-text-muted mt-sp-4">
                                    {hoursPerDay < 2 ? "Light commitment. Perfect for consistent learning." : hoursPerDay < 5 ? "Steady pace. Good for rapid progress." : hoursPerDay < 9 ? "Intensive cramming. Be sure to take breaks." : "Extreme dedication. Maximum growth."}
                                </p>
                            </div>
                        </div>
                        
                        <div className="bg-surface-2/50 border border-white/5 rounded-lg p-sp-4 flex items-center gap-sp-4">
                            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                <span className="material-symbols-outlined text-primary" data-icon="calendar_month">calendar_month</span>
                            </div>
                            <div>
                                <h4 className="font-body-sm text-body-sm text-text-primary font-medium mb-1">Estimated Course Duration</h4>
                                <p className="font-body-sm text-body-sm text-text-secondary">
                                    At this pace, AI will pack {hoursPerDay * 60} mins of material {deadline ? "every day until your deadline." : "per day into your dynamic course."}
                                </p>
                            </div>
                        </div>
                    </div>
                    
                    <footer className="p-sp-6 md:p-margin-desktop border-t border-white/10 flex items-center justify-between bg-surface-glass">
                        <button onClick={handleBack} className="px-sp-6 py-sp-3 rounded-lg font-body-base text-body-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-200">
                            Back
                        </button>
                        <button onClick={handleNext} className="px-sp-8 py-sp-3 rounded-lg font-body-base text-body-base font-medium text-white bg-primary-gradient hover:scale-105 active:scale-95 transition-all duration-200 shadow-glow-primary flex items-center gap-2 group">
                            Review Course Details
                            <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                        </button>
                    </footer>
                </div>
            </main>
        </div>
    );
}
