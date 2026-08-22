'use client';

import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { CourseGenerationInput } from "@/server/schema/course";
import { generateCourse } from "@/server/actions/course";

export default function CourseCreationReview() {
    const { getValues, setValue } = useFormContext<CourseGenerationInput>();
    const router = useRouter();
    const [isGenerating, setIsGenerating] = useState(false);
    const [isPublic, setIsPublic] = useState(getValues("isPublic") ?? true);
    
    const values = getValues();
    const topic = values.topic || "Unknown Topic";
    const level = values.level || "Beginner";
    const hoursPerDay = values.hoursPerDay || 2;
    const deadline = values.deadlineDate ? new Date(values.deadlineDate).toLocaleDateString() : "No strict deadline";

    const handleBack = () => {
        router.push("/courses/create/commitment");
    };

    const handleTogglePrivacy = () => {
        const { setValue } = (window as any).formMethods || {};
        // Note: the component uses useFormContext so setValue is available
    };

    const handleGenerate = async () => {
        if (isGenerating) return;
        setIsGenerating(true);
        
        try {
            const result = await generateCourse(values);
            if (result.success && result.courseId) {
                router.push(`/courses/create/generating?courseId=${result.courseId}`);
            } else {
                console.error("Failed to generate course:", result.error);
                setIsGenerating(false);
            }
        } catch (error) {
            console.error("Error calling generateCourse:", error);
            setIsGenerating(false);
        }
    };

    return (
        <div className="relative font-body-base overflow-hidden flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-8">
            <div className="fixed inset-0 w-full h-full z-0 overflow-hidden" style={{ background: "radial-gradient(circle at 50% 50%, rgba(76, 29, 149, 0.15) 0%, #09090B 70%)" }}>
                <div className="absolute rounded-full opacity-50 blur-[80px] w-[400px] h-[400px] -top-[100px] -right-[100px]" style={{ background: "rgba(139, 92, 246, 0.2)" }}></div>
                <div className="absolute rounded-full opacity-50 blur-[80px] w-[300px] h-[300px] -bottom-[50px] left-[10%]" style={{ background: "rgba(76, 29, 149, 0.3)" }}></div>
            </div>

            <main className="w-full max-w-2xl mx-auto bg-surface-glass backdrop-blur-[12px] border border-white/10 rounded-xl shadow-2xl relative overflow-hidden z-10 flex flex-col">
                <div className="w-full h-2 bg-surface-2">
                    <div className="h-full bg-primary-gradient w-full rounded-r-full relative overflow-hidden">
                        <div className="absolute inset-0 bg-white/20 -translate-x-full animate-[shimmer_2s_infinite]"></div>
                    </div>
                </div>
                
                <div className="p-sp-6 md:p-sp-8 flex flex-col gap-sp-6">
                    <div className="text-center flex flex-col gap-sp-2">
                        <div className="flex justify-center items-center gap-sp-2 text-primary mb-sp-1">
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                            <span className="font-label-mono text-label-mono uppercase tracking-widest text-primary-fixed">Step 5 of 5</span>
                        </div>
                        <h1 className="font-display-xl-mobile text-display-xl-mobile md:font-display-xl md:text-display-xl text-text-primary">Review Your Path</h1>
                        <p className="font-body-lg text-body-lg text-text-secondary max-w-md mx-auto">Double-check your learning preferences before AI generates your custom curriculum.</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-sp-4 mt-sp-4">
                        <div className="bg-surface-2/50 border border-white/5 rounded-lg p-sp-4 flex items-start gap-sp-3 hover:bg-surface-2 transition-colors duration-200">
                            <div className="p-sp-2 rounded-md bg-surface-variant text-primary shrink-0">
                                <span className="material-symbols-outlined">network_node</span>
                            </div>
                            <div>
                                <p className="font-label-mono text-label-mono text-text-muted uppercase mb-1">Topic</p>
                                <p className="font-body-base text-body-base font-medium text-text-primary">{topic}</p>
                            </div>
                        </div>

                        <div className="bg-surface-2/50 border border-white/5 rounded-lg p-sp-4 flex items-start gap-sp-3 hover:bg-surface-2 transition-colors duration-200">
                            <div className="p-sp-2 rounded-md bg-surface-variant text-secondary shrink-0">
                                <span className="material-symbols-outlined">signal_cellular_alt_1_bar</span>
                            </div>
                            <div>
                                <p className="font-label-mono text-label-mono text-text-muted uppercase mb-1">Level</p>
                                <p className="font-body-base text-body-base font-medium text-text-primary">{level}</p>
                            </div>
                        </div>

                        <div className="bg-surface-2/50 border border-white/5 rounded-lg p-sp-4 flex items-start gap-sp-3 hover:bg-surface-2 transition-colors duration-200">
                            <div className="p-sp-2 rounded-md bg-surface-variant text-accent-amber shrink-0">
                                <span className="material-symbols-outlined">event</span>
                            </div>
                            <div>
                                <p className="font-label-mono text-label-mono text-text-muted uppercase mb-1">Deadline</p>
                                <p className="font-body-base text-body-base font-medium text-text-primary">{deadline}</p>
                            </div>
                        </div>

                        <div className="bg-surface-2/50 border border-white/5 rounded-lg p-sp-4 flex items-start gap-sp-3 hover:bg-surface-2 transition-colors duration-200">
                            <div className="p-sp-2 rounded-md bg-surface-variant text-info shrink-0">
                                <span className="material-symbols-outlined">schedule</span>
                            </div>
                            <div>
                                <p className="font-label-mono text-label-mono text-text-muted uppercase mb-1">Commitment</p>
                                <p className="font-body-base text-body-base font-medium text-text-primary">{hoursPerDay} hrs / day</p>
                            </div>
                        </div>
                    </div>

                    <div className="relative mt-sp-2 p-sp-4 rounded-xl overflow-hidden border border-primary/20 bg-primary-900/20">
                        <div className="absolute inset-0 bg-primary/5 mix-blend-overlay"></div>
                        <div className="absolute -top-10 -right-10 w-32 h-32 bg-primary/20 rounded-full blur-2xl"></div>
                        <div className="relative z-10 flex gap-sp-4 items-start">
                            <div className="shrink-0 p-sp-2 rounded-full bg-primary-gradient text-white shadow-glow-primary">
                                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>auto_awesome</span>
                            </div>
                            <div>
                                <h3 className="font-headline-md text-headline-md text-primary-fixed mb-sp-1">AI Projection</h3>
                                <p className="font-body-sm text-body-sm text-on-surface-variant leading-relaxed">
                                    Based on your commitment, your path will focus on foundations and practical implementations carefully spaced for maximum retention.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Privacy Toggle */}
                    <div className="bg-surface-2/50 border border-white/5 rounded-lg p-sp-4 flex items-center justify-between hover:bg-surface-2 transition-colors duration-200 mt-sp-2">
                        <div className="flex items-center gap-sp-3">
                            <div className={`p-sp-2 rounded-md shrink-0 transition-colors ${isPublic ? 'bg-primary-900/30 text-primary-fixed' : 'bg-surface-variant text-text-muted'}`}>
                                <span className="material-symbols-outlined">{isPublic ? "public" : "lock"}</span>
                            </div>
                            <div>
                                <p className="font-body-base text-body-base font-medium text-text-primary">
                                    {isPublic ? "Public Course 🌐" : "Private Course 🔒"}
                                </p>
                                <p className="font-body-sm text-body-sm text-text-muted">
                                    {isPublic ? "Visible in the Community and your Profile." : "Only visible to you."}
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => {
                                setIsPublic(!isPublic);
                                setValue("isPublic", !isPublic);
                            }}
                            className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 focus:ring-offset-background ${isPublic ? 'bg-primary' : 'bg-surface-variant'}`}
                        >
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${isPublic ? 'translate-x-6' : 'translate-x-1'}`} />
                        </button>
                    </div>

                    <div className="flex flex-col-reverse sm:flex-row justify-between items-center gap-sp-4 mt-sp-4 pt-sp-4 border-t border-white/10">
                        <button onClick={handleBack} disabled={isGenerating} className="w-full sm:w-auto px-sp-6 py-sp-3 rounded-lg font-body-base text-body-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-all duration-200 flex items-center justify-center gap-2">
                            <span className="material-symbols-outlined">arrow_back</span>
                            Back
                        </button>
                        <button onClick={handleGenerate} disabled={isGenerating} className="w-full sm:w-auto group relative px-sp-8 py-sp-3 rounded-lg bg-primary-gradient font-body-base text-body-base font-medium text-white shadow-lg hover:shadow-glow-primary transform hover:scale-[1.02] active:scale-95 transition-all duration-200 flex items-center justify-center gap-2 overflow-hidden disabled:opacity-50 disabled:pointer-events-none">
                            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]"></div>
                            <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>{isGenerating ? "hourglass_top" : "auto_awesome"}</span>
                            <span className="relative z-10">{isGenerating ? "Initializing..." : "Generate My Course"}</span>
                        </button>
                    </div>
                </div>
            </main>
        </div>
    );
}
