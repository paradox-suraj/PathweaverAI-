import Link from "next/link";
import Image from "next/image";
import { auth } from "@/auth";
import { progressService } from "@/server/services/progress.service";
import { LogoutButton } from "@/components/logout-button";
import { SidebarNav } from "@/components/sidebar-nav";
import { MobileNav } from "@/components/mobile-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { NotificationDropdown } from "@/components/NotificationDropdown";
import { GlobalCursor } from "@/components/global-cursor";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  const streak = session?.user?.id ? await progressService.getUserStreak(session.user.id) : 0;
  return (
    <>
      <GlobalCursor />
      {/* SideNavBar */}
      <nav className="hidden md:flex flex-col h-full z-40 fixed left-0 top-0 w-64 surface-glass border-r border-white/10 shadow-2xl">
        <div className="p-sp-6 flex items-center gap-sp-3">
          <div className="w-10 h-10 rounded-lg bg-primary-gradient flex items-center justify-center shadow-glow-primary">
            <span
              className="material-symbols-outlined text-white font-bold"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              school
            </span>
          </div>
          <div>
            <h1 className="font-display-xl text-primary text-xl font-extrabold leading-tight tracking-tight">
              PathWeaver AI
            </h1>
            <p className="font-label-mono text-[10px] text-text-muted uppercase tracking-wider">
              by <a href="https://instagram.com/paradox.suraj" target="_blank" rel="noopener noreferrer" className="hover:text-primary transition-colors">paradox creation</a>
            </p>
          </div>
        </div>
        <div className="flex-1 px-sp-4 py-sp-2 space-y-sp-1 overflow-y-auto">
          <SidebarNav />
        </div>
        <div className="px-sp-4 pb-sp-6 pt-sp-2 space-y-sp-1 border-t border-white/5">
          <Link
            href="/help"
            className="flex items-center gap-3 text-on-surface-variant px-4 py-3 rounded-lg hover:bg-surface-variant/50 hover:text-on-surface transition-all font-label-mono text-label-mono"
          >
            <span className="material-symbols-outlined">help</span>
            <span>Help</span>
          </Link>
          <LogoutButton />
        </div>
      </nav>

      {/* Main Content Wrapper */}
      <div className="flex-1 md:ml-64 flex flex-col min-h-screen relative w-full">
        {/* TopNavBar */}
        <header className="fixed top-0 md:left-64 left-0 right-0 h-16 surface-glass border-b border-white/10 shadow-md flex justify-between items-center px-gutter z-30 transition-all">
          {/* Mobile Brand */}
          <div className="md:hidden flex items-center gap-2">
            <div className="w-8 h-8 rounded bg-primary-gradient flex items-center justify-center">
              <span
                className="material-symbols-outlined text-white text-sm"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                school
              </span>
            </div>
            <span className="font-display-xl-mobile text-primary text-lg font-extrabold">
              PathWeaver AI
            </span>
          </div>
          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-sp-6 h-full">
            <Link
              href="/courses"
              className="h-full flex items-center text-on-surface-variant hover:text-primary transition-colors duration-200 font-headline-md text-sm font-semibold"
            >
              Courses
            </Link>
            <Link
              href="/analytics"
              className="h-full flex items-center text-on-surface-variant hover:text-primary transition-colors duration-200 font-headline-md text-sm font-semibold"
            >
              Analytics
            </Link>
          </div>
          {/* Trailing Actions */}
          <div className="flex items-center gap-sp-4">
            <div className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-surface-2 border border-accent-amber/20">
              <span
                className="material-symbols-outlined text-accent-amber text-lg"
                style={{ fontVariationSettings: "'FILL' 1" }}
              >
                local_fire_department
              </span>
              <span className="font-label-mono text-label-mono text-accent-amber font-bold">
                {streak} {streak === 1 ? 'Day' : 'Days'}
              </span>
            </div>
            <ThemeToggle />
            <NotificationDropdown />
            <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-surface-2 hover:border-primary transition-colors cursor-pointer bg-surface-variant relative">
              {session?.user?.image ? (
                <Image src={session.user.image} alt="User" fill sizes="36px" className="object-cover" />
              ) : (
                <span className="material-symbols-outlined text-on-surface-variant flex items-center justify-center h-full w-full">person</span>
              )}
            </div>
          </div>
        </header>

        {/* Main Canvas */}
        <main className="flex-1 mt-16 p-margin-mobile pb-24 md:pb-margin-desktop md:p-margin-desktop overflow-y-auto">
          {children}
        </main>
        
        <MobileNav />
      </div>
    </>
  );
}
