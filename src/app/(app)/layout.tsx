import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { NavSidebar } from "@/components/nav-sidebar";
import { signOut } from "@/lib/auth";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();

  let pendingActions = 0;
  if (session?.user?.id) {
    pendingActions = await prisma.agentAction.count({
      where: {
        status: "PENDING",
        agentProxy: { ownerId: session.user.id },
      },
    });
  }

  return (
    <div className="flex min-h-screen bg-[hsl(var(--background))]">
      <NavSidebar pendingActions={pendingActions} />
      <div className="flex-1 flex flex-col">
        <header className="border-b border-[hsl(var(--border))] px-6 py-3 flex items-center justify-end">
          {session?.user && (
            <div className="flex items-center gap-4">
              <span className="text-sm text-[hsl(var(--muted-foreground))]">
                {session.user.name}
              </span>
              <form action={async () => { "use server"; await signOut({ redirectTo: "/" }); }}>
                <button type="submit" className="text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
                  Sign out
                </button>
              </form>
            </div>
          )}
        </header>
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
}
