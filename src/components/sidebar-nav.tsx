"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarNav() {
  const pathname = usePathname();

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    { name: "My Profile", href: "/profile", icon: "person", matchPrefix: true },
    { name: "Courses", href: "/courses", icon: "menu_book", matchPrefix: true },
    { name: "Community", href: "/community", icon: "public", matchPrefix: true },
    { name: "Live Party", href: "/live-parties", icon: "celebration", matchPrefix: true },
    { name: "Bounties", href: "/bounties", icon: "attach_money", matchPrefix: true },
    { name: "Review Queue", href: "/review", icon: "psychology" },
    { name: "Analytics", href: "/analytics", icon: "insights" },
    { name: "Achievements", href: "/achievements", icon: "military_tech" },
    { name: "Settings", href: "/settings", icon: "settings" },
  ];

  return (
    <>
      {navItems.map((item) => {
        const isActive = item.matchPrefix 
          ? pathname.startsWith(item.href)
          : pathname === item.href;

        if (isActive) {
          return (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 bg-primary/10 text-primary border-l-4 border-primary px-4 py-3 rounded-r-lg font-label-mono text-label-mono shadow-glow-primary scale-102 transition-all"
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className="flex items-center gap-3 text-on-surface-variant px-4 py-3 rounded-lg hover:bg-surface-variant/50 hover:text-on-surface transition-all font-label-mono text-label-mono"
          >
            <span className="material-symbols-outlined">{item.icon}</span>
            <span>{item.name}</span>
          </Link>
        );
      })}
    </>
  );
}
