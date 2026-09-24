"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function MobileNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Home", href: "/dashboard", icon: "dashboard" },
    { name: "Community", href: "/community", icon: "public", matchPrefix: true },
    { name: "Guilds", href: "/guilds", icon: "group", matchPrefix: true },
    { name: "Party", href: "/live-parties", icon: "celebration", matchPrefix: true },
    { name: "Messages", href: "/messages", icon: "chat", matchPrefix: true },
    { name: "Leader", href: "/leaderboard", icon: "leaderboard" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-bg-base/90 backdrop-blur-lg border-t border-white/10 pb-safe">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const isActive = item.matchPrefix 
            ? pathname.startsWith(item.href)
            : pathname === item.href;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center gap-1 min-w-[64px] transition-colors ${
                isActive ? "text-primary" : "text-text-muted hover:text-text-secondary"
              }`}
            >
              <span 
                className={`material-symbols-outlined text-2xl transition-transform ${isActive ? 'scale-110' : ''}`}
                style={{ fontVariationSettings: isActive ? "'FILL' 1" : "'FILL' 0" }}
              >
                {item.icon}
              </span>
              <span className="text-[10px] font-label-mono uppercase tracking-wider">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
