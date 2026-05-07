export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function AgentQueuePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const actions = await prisma.agentAction.findMany({
    where: {
      agentProxy: { ownerId: session.user.id },
    },
    include: {
      agentProxy: { select: { name: true, description: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  const pending = actions.filter((a) => a.status === "PENDING");
  const resolved = actions.filter((a) => a.status !== "PENDING");

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-[hsl(var(--border))] px-6 py-3 flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">coordinate</Link>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">/ Agent Queue</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">Agent Queue</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mb-8">
          Review and approve actions from your agents. Human decisions, agent speed.
        </p>

        {/* Pending */}
        {pending.length > 0 ? (
          <div className="mb-10">
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
              Pending ({pending.length})
            </h2>
            <div className="space-y-4">
              {pending.map((action) => {
                let payload: Record<string, string> = {};
                try { payload = JSON.parse(action.payload) as Record<string, string>; } catch {}

                return (
                  <div key={action.id} className="p-5 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-purple-400 text-sm">🤖 {action.agentProxy.name}</span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        wants to {action.type.replace(/_/g, " ").toLowerCase()}
                      </span>
                      <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
                        {new Date(action.createdAt).toLocaleString()}
                      </span>
                    </div>

                    {/* Preview payload */}
                    <div className="p-3 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] mb-3">
                      {payload.title && (
                        <h3 className="font-medium text-sm mb-1">{String(payload.title)}</h3>
                      )}
                      {payload.content && (
                        <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-4 whitespace-pre-wrap">
                          {String(payload.content).slice(0, 500)}
                        </p>
                      )}
                      {payload.position && (
                        <span className="text-xs text-blue-400">Position: {String(payload.position)}</span>
                      )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2">
                      <form method="POST" action="/api/agent">
                        <input type="hidden" name="action" value="approve" />
                        <input type="hidden" name="actionId" value={action.id} />
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-500 transition"
                          onClick={async (e) => {
                            e.preventDefault();
                            await fetch("/api/agent", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "approve", actionId: action.id }),
                            });
                            window.location.reload();
                          }}
                        >
                          ✅ Approve
                        </button>
                      </form>
                      <form method="POST" action="/api/agent">
                        <input type="hidden" name="action" value="reject" />
                        <input type="hidden" name="actionId" value={action.id} />
                        <button
                          type="submit"
                          className="px-4 py-1.5 rounded-md border border-red-500/50 text-red-400 text-xs font-medium hover:bg-red-500/10 transition"
                          onClick={async (e) => {
                            e.preventDefault();
                            await fetch("/api/agent", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ action: "reject", actionId: action.id }),
                            });
                            window.location.reload();
                          }}
                        >
                          ❌ Reject
                        </button>
                      </form>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="text-center py-12 mb-10 border border-dashed border-[hsl(var(--border))] rounded-lg">
            <p className="text-[hsl(var(--muted-foreground))]">No pending actions.</p>
            <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Your agents are waiting for work.</p>
          </div>
        )}

        {/* History */}
        {resolved.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold mb-4">History</h2>
            <div className="space-y-2">
              {resolved.map((action) => {
                let payload: Record<string, string> = {};
                try { payload = JSON.parse(action.payload) as Record<string, string>; } catch {}

                return (
                  <div key={action.id} className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center gap-3">
                    <span className={action.status === "APPROVED" ? "text-green-400" : "text-red-400"}>
                      {action.status === "APPROVED" ? "✅" : "❌"}
                    </span>
                    <span className="text-xs text-purple-400">🤖 {action.agentProxy.name}</span>
                    <span className="text-xs">{String(payload.title || action.type)}</span>
                    <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
                      {action.resolvedAt ? new Date(action.resolvedAt).toLocaleDateString() : ""}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
