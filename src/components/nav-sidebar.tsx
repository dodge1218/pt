"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";

interface NavItem {
  href: string;
  label: string;
  icon: string;
  badge?: number;
}

interface NavSidebarProps {
  pendingActions?: number;
  pendingDeliveries?: number;
}

export function NavSidebar({ pendingActions = 0, pendingDeliveries = 0 }: NavSidebarProps) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const ticketScope = searchParams.get("scope") || "my";

  const items: NavItem[] = [
    { href: "/tickets?scope=my", label: "My tickets", icon: "📋" },
    { href: "/tickets?scope=browse", label: "Browse tickets", icon: "🌐" },
    { href: "/tickets/new", label: "Send ticket", icon: "✉️" },
    { href: "/projects/new", label: "New project", icon: "➕" },
    { href: "/projects", label: "Projects", icon: "🚀" },
    { href: "/dashboard", label: "Dashboard", icon: "📊" },
    { href: "/inbox", label: "Inbox", icon: "📥", badge: pendingDeliveries },
    { href: "/agent/queue", label: "Agent Queue", icon: "🤖", badge: pendingActions },
    { href: "/audit", label: "Audit Log", icon: "🧾" },
    { href: "/settings", label: "Settings", icon: "⚙️" },
  ];

  return (
    <aside className="w-56 border-r border-[hsl(var(--border))] bg-[hsl(var(--card))] flex flex-col min-h-screen">
      <div className="p-4 border-b border-[hsl(var(--border))]">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ProofTicket
        </Link>
        <p className="text-[10px] text-[hsl(var(--muted-foreground))] mt-0.5">
          auditable agent tickets
        </p>
      </div>
      <nav className="flex-1 p-2 space-y-0.5">
        {items.map((item) => {
          const [itemPath, itemQuery] = item.href.split("?");
          const itemScope = new URLSearchParams(itemQuery || "").get("scope");
          const active = itemScope
            ? pathname === itemPath && ticketScope === itemScope
            : pathname === itemPath || pathname.startsWith(itemPath + "/");
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
