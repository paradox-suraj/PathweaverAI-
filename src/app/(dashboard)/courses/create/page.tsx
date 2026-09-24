'use client';

import { useFormContext } from "react-hook-form";
import { useRouter } from "next/navigation";
import { CourseGenerationInput } from "@/server/schema/course";
import { useState } from "react";
import { Link2, FileText, TextCursorInput, PlaySquare } from "lucide-react";

export default function CourseCreationWizard() {
    const { register, watch, setValue, formState: { isValid } } = useFormContext<CourseGenerationInput>();
    const router = useRouter();
    const topic = watch("topic");
    const sourceType = watch("sourceType") || "text";
    const sourceContent = watch("sourceContent");

    const handleNext = () => {
        const isPlaylistValid = sourceType !== 'playlist' || (!!sourceContent && sourceContent.includes('list='));
        if (topic?.length >= 2 && isPlaylistValid) {
            router.push("/courses/create/level");
        }
    };
    return (
        <div className="relative font-body-base overflow-hidden flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-8">
            {/* Ambient Background Glow */}
            <div 
                className="absolute inset-0 opacity-40 z-0 pointer-events-none" 
                style={{
                    background: 'radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.18), transparent 60%), radial-gradient(circle at 80% 80%, rgba(59, 130, 246, 0.12), transparent 50%)'
                }}
            />
            <div className="absolute inset-0 bg-background/80 z-0 backdrop-blur-sm"></div>

            <main className="relative z-10 w-full max-w-3xl mx-sp-4 md:mx-auto bg-surface-glass border border-white/10 rounded-xl shadow-modal backdrop-blur-xl flex flex-col overflow-hidden max-h-[921px]">
                {/* Header & Progress Indicator */}
                <header className="pt-sp-6 pb-sp-4 px-sp-6 border-b border-white/10 shrink-0">
                    <div className="flex items-center justify-between mb-sp-6">
                        <h1 className="font-headline-md text-headline-md text-text-primary">Course Creation Wizard</h1>
                        <button className="text-text-muted hover:text-text-primary transition-colors flex items-center justify-center rounded-full hover:bg-white/5 p-1">
                            <span className="material-symbols-outlined text-2xl">close</span>
                        </button>
                    </div>
                    {/* Progress Steps */}
                    <div className="flex items-center justify-between relative">
                        <div className="absolute top-1/2 left-0 w-full h-0.5 bg-surface-2 -z-10 -translate-y-1/2 rounded-full overflow-hidden">
                            <div className="h-full bg-primary-gradient w-1/5"></div>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary-gradient flex items-center justify-center text-on-primary font-bold shadow-glow-primary border border-primary/50">
                                1
                            </div>
                            <span className="font-label-mono text-label-mono text-primary">Topic</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center text-text-muted">
                                2
                            </div>
                            <span className="font-label-mono text-label-mono text-text-muted">Level</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center text-text-muted">
                                3
                            </div>
                            <span className="font-label-mono text-label-mono text-text-muted">Deadline</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center text-text-muted">
                                4
                            </div>
                            <span className="font-label-mono text-label-mono text-text-muted">Commitment</span>
                        </div>
                        <div className="flex flex-col items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-surface-2 border border-white/10 flex items-center justify-center text-text-muted">
                                5
                            </div>
                            <span className="font-label-mono text-label-mono text-text-muted">Review</span>
                        </div>
                    </div>
                </header>

                <section className="p-sp-6 flex-1 overflow-y-auto shrink hide-scrollbar flex flex-col gap-sp-8">
                    <div className="space-y-sp-2">
                        <h2 className="font-headline-md text-headline-md text-text-primary">Step 1: Goal &amp; Topic</h2>
                        <p className="font-body-base text-body-base text-text-secondary">Define the core subject you want to master.</p>
                    </div>

                    <div className="space-y-sp-2">
                        <label className="block font-label-mono text-label-mono text-text-secondary" htmlFor="course-topic">What do you want to learn today?</label>
                        <div className="relative group input-glow rounded-lg transition-all duration-300 border border-white/10 bg-black/20">
                            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-text-muted group-focus-within:text-primary transition-colors">
                                psychology
                            </span>
                            <input 
                                {...register("topic")}
                                className="w-full bg-transparent border-none py-sp-4 pl-12 pr-sp-4 text-text-primary font-body-lg text-body-lg placeholder:text-text-muted/50 focus:ring-0 focus:outline-none rounded-lg" 
                                id="course-topic" 
                                placeholder="e.g., Advanced Neural Networks, UX Design Principles..." 
                                type="text" 
                            />
                        </div>
                    </div>

                    <div className="space-y-sp-4">
                        <h3 className="font-label-mono text-label-mono text-text-secondary uppercase tracking-wider">Source Material (Optional)</h3>
                        <div className="flex gap-4">
                            <button
                                type="button"
                                onClick={() => { setValue("sourceType", "text"); setValue("sourceContent", ""); }}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${sourceType === 'text' || !sourceType ? 'border-primary bg-primary/10' : 'border-white/10 bg-surface-2 hover:border-white/30'}`}
                            >
                                <TextCursorInput className={sourceType === 'text' || !sourceType ? 'text-primary' : 'text-text-muted'} />
                                <span className="font-label-mono text-sm">No Source (Prompt Only)</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setValue("sourceType", "url"); setValue("sourceContent", ""); }}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${sourceType === 'url' ? 'border-primary bg-primary/10' : 'border-white/10 bg-surface-2 hover:border-white/30'}`}
                            >
                                <Link2 className={sourceType === 'url' ? 'text-primary' : 'text-text-muted'} />
                                <span className="font-label-mono text-sm">Webpage URL</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setValue("sourceType", "pdf"); setValue("sourceContent", ""); }}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${sourceType === 'pdf' ? 'border-primary bg-primary/10' : 'border-white/10 bg-surface-2 hover:border-white/30'}`}
                            >
                                <FileText className={sourceType === 'pdf' ? 'text-primary' : 'text-text-muted'} />
                                <span className="font-label-mono text-sm">Paste Document Text</span>
                            </button>
                            <button
                                type="button"
                                onClick={() => { setValue("sourceType", "playlist"); setValue("sourceContent", ""); }}
                                className={`flex-1 flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${sourceType === 'playlist' ? 'border-red-500/70 bg-red-500/10' : 'border-white/10 bg-surface-2 hover:border-white/30'}`}
                            >
                                <PlaySquare className={sourceType === 'playlist' ? 'text-red-400' : 'text-text-muted'} />
                                <span className="font-label-mono text-sm">YT Playlist</span>
                            </button>
                        </div>

                        {sourceType === "url" && (
                            <div className="relative group input-glow rounded-lg transition-all duration-300 border border-white/10 bg-black/20">
                                <Link2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-text-muted group-focus-within:text-primary transition-colors" />
                                <input 
                                    {...register("sourceContent")}
                                    className="w-full bg-transparent border-none py-sp-4 pl-12 pr-sp-4 text-text-primary font-body-lg text-body-lg placeholder:text-text-muted/50 focus:ring-0 focus:outline-none rounded-lg" 
                                    placeholder="https://en.wikipedia.org/wiki/Neural_network" 
                                    type="url" 
                                />
                            </div>
                        )}

                        {sourceType === "pdf" && (
                            <div className="relative group input-glow rounded-lg transition-all duration-300 border border-white/10 bg-black/20">
                                <textarea 
                                    {...register("sourceContent")}
                                    className="w-full bg-transparent border-none py-sp-4 px-sp-4 text-text-primary font-body-base text-body-base placeholder:text-text-muted/50 focus:ring-0 focus:outline-none rounded-lg resize-none h-32" 
                                    placeholder="Paste the text content of your document here..." 
                                />
                            </div>
                        )}

                        {sourceType === "playlist" && (
                            <div className="space-y-3">
                                <div className="relative group input-glow rounded-lg transition-all duration-300 border border-white/10 bg-black/20">
                                    <PlaySquare className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-red-400" />
                                    <input 
                                        {...register("sourceContent")}
                                        className="w-full bg-transparent border-none py-sp-4 pl-12 pr-sp-4 text-text-primary font-body-lg text-body-lg placeholder:text-text-muted/50 focus:ring-0 focus:outline-none rounded-lg" 
                                        placeholder="https://www.youtube.com/playlist?list=PLxxx..." 
                                        type="url" 
                                    />
                                </div>
                                <div className="flex items-start gap-3 px-4 py-3 rounded-lg border border-red-500/20 bg-red-500/5">
                                    <PlaySquare className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                                    <p className="font-label-mono text-xs text-text-muted leading-relaxed">
                                        We&apos;ll use your playlist&apos;s video titles &amp; descriptions to structure the curriculum — <span className="text-text-secondary">no transcripts are read during generation</span>, keeping it fast &amp; token-efficient. Transcripts are fetched on-demand when you open a lesson&apos;s Deep Dive article. Public playlists only (up to 50 videos).
                                    </p>
                                </div>
                            </div>
                        )}

                    </div>

                    <div className="space-y-sp-4">
                        <h3 className="font-label-mono text-label-mono text-text-secondary uppercase tracking-wider">Popular Topics</h3>
                        <div className="flex flex-wrap gap-sp-3">
                            {["Machine Learning", "Frontend Development", "Data Science", "UI/UX Design", "Deep Learning"].map(t => (
                                <button 
                                    key={t}
                                    onClick={() => setValue("topic", t, { shouldValidate: true })}
                                    className={`flex items-center gap-2 px-sp-4 py-sp-2 rounded-full border transition-all text-text-primary font-body-sm text-body-sm group ${topic === t ? 'bg-primary/20 border-primary' : 'bg-surface-2 border-white/10 hover:border-primary/50'}`}
                                >
                                    {t}
                                </button>
                            ))}
                        </div>
                    </div>
                </section>

                <footer className="p-sp-6 border-t border-white/10 bg-surface-glass/80 backdrop-blur-md shrink-0 flex items-center justify-between">
                    <button onClick={() => router.push("/dashboard")} className="px-sp-6 py-sp-3 rounded-lg font-body-base text-body-base font-medium text-text-secondary hover:text-text-primary hover:bg-surface-2 transition-colors duration-200">
                        Cancel
                    </button>
                    <button 
                        onClick={handleNext}
                        disabled={!topic || topic.length < 2 || (sourceType === 'playlist' && (!sourceContent || !sourceContent.includes('list=')))}
                        className="disabled:opacity-50 disabled:cursor-not-allowed px-sp-8 py-sp-3 rounded-lg font-body-base text-body-base font-medium text-white bg-primary-gradient hover:scale-105 active:scale-95 transition-all duration-200 shadow-glow-primary flex items-center gap-2 group"
                    >
                        Next Step
                        <span className="material-symbols-outlined text-xl group-hover:translate-x-1 transition-transform">arrow_forward</span>
                    </button>
                </footer>
            </main>
        </div>
    );
}
