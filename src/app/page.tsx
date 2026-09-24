"use client";

import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Image from "next/image";
import { CursorHoverMask } from "@/components/cursor-hover-mask";

export default function LandingPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.push("/dashboard");
    }
  }, [status, router]);

  return (
    <div className="min-h-screen bg-bg-base text-text-primary flex flex-col items-center justify-center relative overflow-hidden font-body-base">
      <div className="absolute inset-0 z-0">
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] mix-blend-screen animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] mix-blend-screen animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="z-10 w-full flex-1 flex flex-col items-center justify-center pointer-events-auto">
        <CursorHoverMask 
          maskColor="#8B5CF6"
          backContent={
            <>
              <div className="relative w-24 h-24 mb-sp-6 mx-auto drop-shadow-2xl">
                <Image src="/pathweaver-app_logo.png" alt="PathWeaver AI Logo" fill className="object-contain" priority />
              </div>
              
              <h1 className="font-headline-lg text-4xl md:text-6xl font-bold mb-sp-6 leading-tight">
                Master Any Skill with <span className="text-transparent bg-clip-text bg-primary-gradient">PathWeaver AI</span>
              </h1>
              
              <p className="font-body-lg text-xl text-text-secondary mb-sp-10 max-w-2xl">
                Generate personalized, YouTube-curated learning paths tailored to your exact goal, skill level, and schedule.
              </p>
            </>
          }
          frontContent={
            <div className="text-black">
              <div className="relative w-24 h-24 mb-sp-6 mx-auto drop-shadow-xl">
                <Image src="/pathweaver-app_logo.png" alt="PathWeaver AI Logo" fill className="object-contain" priority />
              </div>
              
              <h1 className="font-headline-lg text-4xl md:text-6xl font-bold mb-sp-6 leading-tight">
                Master Any Skill with <span className="text-black">PathWeaver AI</span>
              </h1>
              
              <p className="font-body-lg text-xl text-black/80 mb-sp-10 max-w-2xl mx-auto font-medium">
                Generate personalized, YouTube-curated learning paths tailored to your exact goal, skill level, and schedule.
              </p>
            </div>
          }
        />

        <button 
          onClick={() => signIn("google")}
          disabled={status === "loading"}
          className="disabled:opacity-50 flex items-center gap-3 px-sp-8 py-sp-4 bg-white text-black rounded-full font-body-lg font-semibold hover:scale-105 active:scale-95 transition-all shadow-glow-primary"
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48" className="w-6 h-6">
            <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
            <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
            <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
            <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
          </svg>
          {status === "loading" ? "Loading..." : "Continue with Google"}
        </button>
      </div>

      {/* Classic Footer */}
      <footer className="w-full py-8 px-6 mt-auto border-t border-white/5 bg-surface-1/50 backdrop-blur-md relative z-10">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-text-muted">
          <div className="flex items-center gap-2">
            <div className="relative w-32 h-6">
              <Image src="/pathweaver-logo.png" alt="PathWeaver AI Logo" fill className="object-contain object-left brightness-0 invert" />
            </div>
            <span className="ml-2 border-l border-white/20 pl-2">&copy; {new Date().getFullYear()}</span>
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="hover:text-primary transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-primary transition-colors">Terms of Service</a>
            <a href="https://instagram.com/paradox.suraj" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">
              by Paradox Creation
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
