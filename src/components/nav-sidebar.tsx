"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

interface NavSidebarProps {
  pendingActions?: number;
}

export function NavSidebar({ pendingActions = 0 }: NavSidebarProps) {
  const pathname = usePathname();

  const items: NavItem[] = [
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/tickets", label: "Tickets", icon: "📋" },
    { href: "/public", label: "Public Board", icon: "🌐" },
    { href: "/projects", label: "Projects", icon: "🚀" },
    { href: "/friends", label: "Friends", icon: "👥" },
    { href: "/matches", label: "Matches", icon: "🧠" },
    { href: "/agent/queue", label: "Agent Queue", icon: "🤖", badge: pendingActions },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-56 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col min-h-screen">
      <div className="p-4 border-b border-[hsl(var(--border))]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          kairos
        </Link>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
          async coordination
        </p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {items.map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2 rounded-md text-sm transition ${
                active
                  ? "bg-[hsl(var(--primary))]/10 text-[hsl(var(--foreground))]"
                  : "text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] hover:bg-[hsl(var(--secondary))]"
              }`}
            >
              <span className="text-base">{item.icon}</span>
              <span>{item.label}</span>
              {item.badge && item.badge > 0 ? (
                <span className="ml-auto bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {item.badge}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
