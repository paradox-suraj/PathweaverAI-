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
import { StreakPopover } from "@/components/streak-popover";

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
      <nav className="hidden md:flex flex-col h-full z-40 fixed left-0 top-0 w-64 bg-bg-main border-r border-border-light text-text-primary shadow-2xl">
        <div className="p-sp-6 flex flex-col items-start gap-sp-2">
          <Link href="/dashboard" className="block relative w-40 h-10">
            <Image 
              src="/pathweaver-logo.png" 
              alt="PathWeaver AI Logo" 
              fill
              sizes="(max-width: 768px) 100vw, 160px"
              className="object-contain object-left brightness-0 invert" 
              priority
            />
          </Link>
          <p className="font-label-mono text-[10px] text-white/50 uppercase tracking-wider pl-1">
            by <a href="https://instagram.com/paradox.suraj" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">paradox creation</a>
          </p>
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
        <header className="fixed top-0 md:left-64 left-0 right-0 h-16 bg-bg-main flex justify-between items-center px-gutter z-30 transition-all">
          {/* Mobile Brand */}
          <Link href="/dashboard" className="md:hidden flex items-center gap-2">
            <div className="relative w-8 h-8">
              <Image 
                src="/pathweaver-app_logo.png" 
                alt="PathWeaver AI Logo" 
                fill
                sizes="32px"
                className="object-contain" 
              />
            </div>
            <span className="font-display-xl-mobile text-primary text-lg font-extrabold">
              PathWeaver AI
            </span>
          </Link>
          {/* Desktop Navigation Links / Search */}
          <div className="hidden md:flex items-center gap-sp-6 h-full flex-1 md:pl-4">
            <div className="relative w-64 max-w-sm hidden lg:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-text-dim text-sm">search</span>
              <input type="text" placeholder="Search" className="w-full bg-bg-card border border-border-card rounded-lg pl-9 pr-4 py-2 text-sm outline-none focus:border-gold-primary transition-colors text-text-primary placeholder:text-text-dim" />
            </div>
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
            <StreakPopover initialStreak={streak} />
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
