export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";
import { AgentQueue } from "@/components/agent-queue";

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

  const serializedActions = actions.map((action) => ({
    id: action.id,
    type: action.type,
    status: action.status,
    payload: action.payload,
    resultId: action.resultId,
    createdAt: action.createdAt.toISOString(),
    resolvedAt: action.resolvedAt?.toISOString() ?? null,
    agentProxy: action.agentProxy,
  }));

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

        <AgentQueue actions={serializedActions} />
      </main>
    </div>
  );
}
