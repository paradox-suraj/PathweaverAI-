"use client";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function LogoutButton({ className, variant = "sidebar" }: { className?: string, variant?: "sidebar" | "settings" }) {
  if (variant === "settings") {
    return (
      <button 
        onClick={() => signOut({ callbackUrl: "/" })}
        className={`flex items-center gap-2 px-6 py-2 rounded-lg bg-surface-2 border border-white/10 hover:border-red-500/50 hover:bg-red-500/10 hover:text-red-400 text-text-primary font-label-mono uppercase tracking-wider transition-colors ${className || ""}`}
      >
        <LogOut className="w-4 h-4" />
        Sign Out
      </button>
    );
  }

  return (
    <button
      onClick={() => signOut({ callbackUrl: "/" })}
      className={`w-full flex items-center gap-3 text-on-surface-variant px-4 py-3 rounded-lg hover:bg-surface-variant/50 hover:text-on-surface transition-all font-label-mono text-label-mono ${className || ""}`}
    >
      <span className="material-symbols-outlined">logout</span>
      <span>Logout</span>
    </button>
  );
}
