import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signOut } from "@/lib/auth";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const [myTickets, pendingActions, recentPublic] = await Promise.all([
    prisma.ticket.findMany({
      where: { authorId: session.user.id, deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { _count: { select: { responses: true } } },
    }),
    prisma.agentAction.count({
      where: {
        status: "PENDING",
        agentProxy: { ownerId: session.user.id },
      },
    }),
    prisma.ticket.findMany({
      where: { visibility: "PUBLIC", deletedAt: null },
      orderBy: { createdAt: "desc" },
      take: 5,
      include: {
        author: { select: { name: true, image: true, github: true } },
        _count: { select: { responses: true } },
      },
    }),
  ]);

  const typeIcons: Record<string, string> = {
    DECISION: "🔀",
    INFO: "ℹ️",
    PROPOSAL: "📋",
    STATUS: "📊",
    PUBLIC: "🌐",
  };

  const statusColors: Record<string, string> = {
    OPEN: "text-green-400",
    IN_PROGRESS: "text-yellow-400",
    IN_MEDIATION: "text-orange-400",
    RESOLVED: "text-blue-400",
    ARCHIVED: "text-gray-400",
  };

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      {/* Top bar */}
      <header className="border-b border-[hsl(var(--border))] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">coordinate</Link>
          <nav className="flex items-center gap-4 text-sm text-[hsl(var(--muted-foreground))]">
            <Link href="/dashboard" className="text-[hsl(var(--foreground))]">Dashboard</Link>
            <Link href="/public" className="hover:text-[hsl(var(--foreground))] transition">Public Board</Link>
            <Link href="/agent/queue" className="hover:text-[hsl(var(--foreground))] transition relative">
              Agent Queue
              {pendingActions > 0 && (
                <span className="absolute -top-1 -right-3 bg-red-500 text-white text-[10px] rounded-full w-4 h-4 flex items-center justify-center">
                  {pendingActions}
                </span>
              )}
            </Link>
          </nav>
        </div>
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
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Quick actions */}
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Dashboard</h1>
          <Link
            href="/tickets/new"
            className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition"
          >
            + New Ticket
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* My Tickets */}
          <div className="lg:col-span-2">
            <h2 className="text-lg font-semibold mb-4">My Tickets</h2>
            {myTickets.length === 0 ? (
              <div className="text-center py-12 text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-lg">
                <p>No tickets yet.</p>
                <Link href="/tickets/new" className="text-[hsl(var(--primary))] text-sm mt-2 inline-block">
                  Create your first ticket →
                </Link>
              </div>
            ) : (
              <div className="space-y-3">
                {myTickets.map((ticket) => (
                  <Link
                    key={ticket.id}
                    href={`/tickets/${ticket.id}`}
                    className="block p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] transition"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <span>{typeIcons[ticket.type] || "📋"}</span>
                        <h3 className="font-medium text-sm">{ticket.title}</h3>
                      </div>
                      <span className={`text-xs ${statusColors[ticket.status]}`}>
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                    <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
                      {ticket.content.slice(0, 150)}
                    </p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                      <span>{ticket._count.responses} responses</span>
                      <span>·</span>
                      <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
                      {ticket.createdByAgent && (
                        <>
                          <span>·</span>
                          <span className="text-purple-400">🤖 Agent</span>
                        </>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div>
            {/* Agent queue alert */}
            {pendingActions > 0 && (
              <div className="p-4 rounded-lg border border-purple-500/30 bg-purple-500/10 mb-6">
                <h3 className="font-medium text-sm text-purple-400">🤖 Agent Queue</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
                  {pendingActions} action{pendingActions > 1 ? "s" : ""} waiting for your approval
                </p>
                <Link
                  href="/agent/queue"
                  className="text-xs text-purple-400 hover:text-purple-300 mt-2 inline-block"
                >
                  Review →
                </Link>
              </div>
            )}

            {/* Recent public */}
            <h2 className="text-lg font-semibold mb-4">Public Board</h2>
            <div className="space-y-3">
              {recentPublic.map((ticket) => (
                <Link
                  key={ticket.id}
                  href={`/tickets/${ticket.id}`}
                  className="block p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] transition"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-xs">🌐</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))]">
                      {ticket.author.name || ticket.author.github}
                    </span>
                  </div>
                  <h3 className="font-medium text-sm">{ticket.title}</h3>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {ticket._count.responses} responses
                  </span>
                </Link>
              ))}
            </div>
            <Link href="/public" className="text-xs text-[hsl(var(--primary))] mt-3 inline-block">
              View all →
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
