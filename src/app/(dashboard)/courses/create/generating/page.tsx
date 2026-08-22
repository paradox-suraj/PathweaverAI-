'use client';
import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { checkCourseStatus } from '@/server/actions/course';

export default function GeneratingYourCourse() {
    const [progress, setProgress] = useState(5);
    const [statusText, setStatusText] = useState("Initializing learning engine...");
    const searchParams = useSearchParams();
    const router = useRouter();
    const courseId = searchParams.get('courseId');
    
    useEffect(() => {
        if (!courseId) return;

        const totalDuration = 20000; // Increased expected duration
        const updateInterval = 100;
        let progressVal = 5;
        const progressIncrement = (93 / (totalDuration / updateInterval));

        // Server Status Polling
        let isActive = false;
        const pollInterval = setInterval(async () => {
            if (isActive) return;
            const res = await checkCourseStatus(courseId);
            if (res.success) {
                if (res.status === "GENERATING" && res.statusMessage) {
                    setStatusText(res.statusMessage);
                } else if (res.status === "ACTIVE") {
                    isActive = true;
                    clearInterval(pollInterval);
                    clearInterval(progressInterval);
                    setProgress(100);
                    setStatusText(res.statusMessage || "Curriculum Ready. Redirecting...");
                    
                    setTimeout(() => {
                        router.push(`/courses/${courseId}`);
                    }, 800);
                } else if (res.status === "FAILED") {
                    isActive = true;
                    clearInterval(pollInterval);
                    clearInterval(progressInterval);
                    setStatusText(res.statusMessage || "Generation failed. Please try again.");
                }
            }
        }, 2000); // Check every 2 seconds for real-time updates

        // Visual fake progress
        const progressInterval = setInterval(() => {
            if (isActive) return;
            progressVal += progressIncrement;
            const jitter = Math.random() * 0.5 - 0.25; 
            let currentProgress = progressVal + jitter;

            // Cap at 98% until server actually says ACTIVE
            if (currentProgress >= 98) {
                currentProgress = 98;
            }
            
            setProgress(Math.min(currentProgress, 98));
        }, updateInterval);
        
        return () => {
            clearInterval(progressInterval);
            clearInterval(pollInterval);
        };
    }, [courseId, router]);

    return (
        <div className="relative font-body-base overflow-hidden flex items-center justify-center min-h-[calc(100vh-80px)] w-full py-8">
            <main className="relative z-10 flex flex-col items-center justify-center w-full">
                <div className="w-full max-w-lg bg-surface-glass backdrop-blur-[12px] border border-white/10 rounded-xl p-sp-8 sm:p-[48px] shadow-[0_0_80px_rgba(139,92,246,0.05)] flex flex-col items-center text-center relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"></div>
                    
                    <div className="relative mb-sp-8 w-24 h-24 flex items-center justify-center">
                        <div className="absolute inset-0 bg-primary/20 blur-[32px] rounded-full animate-pulse"></div>
                        <span className="material-symbols-outlined text-[64px] text-primary relative z-10 animate-pulse" style={{ fontVariationSettings: "'FILL' 1", filter: 'drop-shadow(0 0 15px rgba(208, 188, 255, 0.4))' }}>
                            psychology
                        </span>
                    </div>
                    
                    <h1 className="font-headline-lg text-headline-lg text-text-primary mb-sp-8 tracking-tight">
                        Generating Your Custom Path...
                    </h1>
                    
                    <div className="w-full relative mb-sp-4">
                        <div className="w-full h-2 rounded-full bg-surface-2 overflow-hidden shadow-inner">
                            <div className="h-full bg-primary-gradient rounded-full transition-all duration-300 ease-out shadow-[0_0_12px_rgba(139,92,246,0.8)] relative" style={{ width: `${progress}%` }}>
                                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]"></div>
                            </div>
                        </div>
                    </div>
                    
                    <div className="h-8 flex items-center justify-center">
                        <p className={`font-body-base text-body-base transition-opacity duration-300 ${progress === 100 ? 'text-secondary-fixed' : 'text-text-secondary'}`}>
                            {statusText}
                        </p>
                    </div>
                </div>
                
                <div className="absolute bottom-sp-8 flex items-center gap-2 text-text-secondary opacity-60">
                    <span className="material-symbols-outlined text-[16px]">lock</span>
                    <span className="font-label-mono text-label-mono uppercase tracking-widest">Quantum Secured Pathing</span>
                </div>
            </main>
        </div>
    );
}
