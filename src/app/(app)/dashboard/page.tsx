import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { TicketCard } from "@/components/ticket-card";
import { AgentAttribution } from "@/components/agent-attribution";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user) return null;

  const visibleTicketWhere = {
    deletedAt: null,
    OR: [
      { authorId: session.user.id },
      {
        bridge: {
          members: {
            some: { userId: session.user.id },
          },
        },
      },
    ],
  };

  const [
    myTickets,
    pendingActions,
    recentPublic,
    ticketCount,
    openTicketCount,
    decisionTicketCount,
    resolvedDecisionCount,
    agentCreatedCount,
    receiptArtifacts,
    recentDecisions,
  ] = await Promise.all([
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
    prisma.ticket.count({ where: visibleTicketWhere }),
    prisma.ticket.count({ where: { ...visibleTicketWhere, status: { in: ["OPEN", "IN_PROGRESS", "IN_MEDIATION"] } } }),
    prisma.ticket.count({ where: { ...visibleTicketWhere, type: "DECISION" } }),
    prisma.ticket.count({ where: { ...visibleTicketWhere, type: "DECISION", status: "RESOLVED" } }),
    prisma.ticket.count({ where: { ...visibleTicketWhere, createdByAgent: true } }),
    prisma.ticketArtifact.findMany({
      where: {
        kind: "CONTEXTCLAW_RECEIPT",
        ticket: visibleTicketWhere,
      },
      select: {
        costUsd: true,
        inputTokens: true,
        outputTokens: true,
        contextSavedTokens: true,
      },
    }),
    prisma.ticket.findMany({
      where: {
        ...visibleTicketWhere,
        type: "DECISION",
        status: { in: ["RESOLVED", "IN_MEDIATION", "OPEN"] },
      },
      orderBy: { updatedAt: "desc" },
      take: 5,
      include: { _count: { select: { responses: true } } },
    }),
  ]);

  const receiptTotals = receiptArtifacts.reduce<{
    costUsd: number;
    inputTokens: number;
    outputTokens: number;
    contextSavedTokens: number;
  }>(
    (totals, artifact) => ({
      costUsd: totals.costUsd + (artifact.costUsd || 0),
      inputTokens: totals.inputTokens + (artifact.inputTokens || 0),
      outputTokens: totals.outputTokens + (artifact.outputTokens || 0),
      contextSavedTokens: totals.contextSavedTokens + (artifact.contextSavedTokens || 0),
    }),
    { costUsd: 0, inputTokens: 0, outputTokens: 0, contextSavedTokens: 0 }
  );
  const totalTokens = receiptTotals.inputTokens + receiptTotals.outputTokens;
  const decisionResolutionRate =
    decisionTicketCount > 0 ? Math.round((resolvedDecisionCount / decisionTicketCount) * 100) : 0;
  const contextSavedMultiple =
    totalTokens > 0 ? (receiptTotals.contextSavedTokens / totalTokens).toFixed(1) : "0.0";

  const agentProxyIds = Array.from(
    new Set(
      [...myTickets, ...recentPublic]
        .map((ticket) => ticket.agentProxyId)
        .filter((agentProxyId): agentProxyId is string => Boolean(agentProxyId))
    )
  );
  const agentProxies = await prisma.agentProxy.findMany({
    where: { id: { in: agentProxyIds } },
    select: { id: true, name: true },
  });
  const agentNameById = new Map(agentProxies.map((agent) => [agent.id, agent.name]));

  return (
    <div className="max-w-6xl mx-auto">
        {/* Quick actions */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
              Control-plane view for tickets, decisions, agent work, and ContextClaw receipts.
            </p>
          </div>
          <Link
            href="/tickets/new"
            className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition"
          >
            + New Ticket
          </Link>
        </div>

        <div className="mb-8 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <MetricCard label="Tracked spend" value={`$${receiptTotals.costUsd.toFixed(4)}`} detail={`${receiptArtifacts.length} receipt${receiptArtifacts.length === 1 ? "" : "s"}`} />
          <MetricCard label="Context saved" value={receiptTotals.contextSavedTokens.toLocaleString()} detail={`${contextSavedMultiple}x recorded token volume`} />
          <MetricCard label="Active tickets" value={openTicketCount.toLocaleString()} detail={`${ticketCount.toLocaleString()} visible tickets`} />
          <MetricCard label="Decisions resolved" value={`${decisionResolutionRate}%`} detail={`${resolvedDecisionCount}/${decisionTicketCount} decision tickets`} />
        </div>

        <div className="mb-8 grid gap-4 lg:grid-cols-3">
          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <h2 className="text-sm font-semibold">Agent Work</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricPill label="Pending" value={pendingActions} />
              <MetricPill label="Agent-created" value={agentCreatedCount} />
            </div>
            {pendingActions > 0 && (
              <Link href="/agent/queue" className="mt-3 inline-block text-xs text-[hsl(var(--primary))]">
                Review queue →
              </Link>
            )}
          </div>

          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <h2 className="text-sm font-semibold">Token Ledger</h2>
            <div className="mt-4 grid grid-cols-2 gap-3">
              <MetricPill label="Input" value={receiptTotals.inputTokens.toLocaleString()} />
              <MetricPill label="Output" value={receiptTotals.outputTokens.toLocaleString()} />
            </div>
          </div>

          <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
            <h2 className="text-sm font-semibold">Recent Decisions</h2>
            {recentDecisions.length === 0 ? (
              <p className="mt-3 text-xs text-[hsl(var(--muted-foreground))]">No decision tickets yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {recentDecisions.map((ticket) => (
                  <Link key={ticket.id} href={`/tickets/${ticket.id}`} className="block">
                    <div className="flex items-center justify-between gap-3 text-xs">
                      <span className="truncate">{ticket.title}</span>
                      <span className="shrink-0 text-[hsl(var(--muted-foreground))]">
                        {ticket.status.replace("_", " ")}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
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
                  <TicketCard
                    key={ticket.id}
                    ticket={{
                      ...ticket,
                      agentName: ticket.agentProxyId ? agentNameById.get(ticket.agentProxyId) : null,
                    }}
                  />
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
                    {ticket.createdByAgent && (
                      <AgentAttribution
                        compact
                        createdByAgent={ticket.createdByAgent}
                        agentName={ticket.agentProxyId ? agentNameById.get(ticket.agentProxyId) : null}
                        approvedAt={ticket.approvedAt}
                      />
                    )}
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
    </div>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <div className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
      <div className="text-xs text-[hsl(var(--muted-foreground))]">{label}</div>
      <div className="mt-2 text-2xl font-semibold">{value}</div>
      <div className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">{detail}</div>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3">
      <div className="text-lg font-semibold">{value}</div>
      <div className="text-xs text-[hsl(var(--muted-foreground))]">{label}</div>
    </div>
  );
}
