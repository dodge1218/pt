import { parseJsonArray, parseJsonObject } from "@/lib/utils";
export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CommentForm } from "@/components/comment-form";
import { ResponseForm } from "@/components/response-form";
import { AgentAttribution } from "@/components/agent-attribution";
import { TicketActions } from "@/components/ticket-actions";
import { ArtifactForm } from "@/components/artifact-form";

const positionLabels: Record<string, { icon: string; label: string; color: string }> = {
  AGREE: { icon: "✅", label: "Agrees", color: "text-green-400" },
  DISAGREE: { icon: "❌", label: "Disagrees", color: "text-red-400" },
  COUNTER_PROPOSAL: { icon: "🔄", label: "Counter-proposal", color: "text-yellow-400" },
  NEUTRAL: { icon: "➖", label: "Neutral", color: "text-gray-400" },
  QUESTION: { icon: "❓", label: "Question", color: "text-blue-400" },
};

const typeIcons: Record<string, string> = {
  DECISION: "🔀", INFO: "ℹ️", PROPOSAL: "📋", STATUS: "📊", PUBLIC: "🌐",
};

export default async function TicketDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const session = await auth();

  const ticket = await prisma.ticket.findUnique({
    where: { id, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, image: true, github: true, headline: true } },
      responses: {
        where: { deletedAt: null },
        include: {
          author: { select: { id: true, name: true, image: true, github: true } },
          comments: {
            where: { deletedAt: null },
            include: { author: { select: { id: true, name: true, image: true, github: true } } },
            orderBy: { createdAt: "asc" },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      bridge: { select: { id: true, name: true } },
      artifacts: {
        include: {
          createdBy: { select: { id: true, name: true, github: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!ticket) notFound();

  // Check visibility
  if (ticket.visibility !== "PUBLIC" && session?.user?.id !== ticket.authorId) {
    if (!session?.user?.id) notFound();
    if (ticket.bridgeId) {
      const membership = await prisma.bridgeMember.findUnique({
        where: { userId_bridgeId: { userId: session.user.id, bridgeId: ticket.bridgeId } },
      });
      if (!membership) notFound();
    } else {
      notFound();
    }
  }

  const isOwner = session?.user?.id === ticket.authorId;
  const tags = parseJsonArray(ticket.tags);
  const canAttachArtifact = Boolean(
    session?.user?.id &&
      (isOwner ||
        (ticket.bridgeId &&
          (await prisma.bridgeMember.findUnique({
            where: { userId_bridgeId: { userId: session.user.id, bridgeId: ticket.bridgeId } },
            select: { id: true },
          }))))
  );
  const receiptArtifacts = ticket.artifacts.filter(
    (artifact) => artifact.kind === "CONTEXTCLAW_RECEIPT"
  );
  const receiptTotals = receiptArtifacts.reduce(
    (totals, artifact) => ({
      costUsd: totals.costUsd + (artifact.costUsd || 0),
      inputTokens: totals.inputTokens + (artifact.inputTokens || 0),
      outputTokens: totals.outputTokens + (artifact.outputTokens || 0),
      contextSavedTokens: totals.contextSavedTokens + (artifact.contextSavedTokens || 0),
    }),
    { costUsd: 0, inputTokens: 0, outputTokens: 0, contextSavedTokens: 0 }
  );
  const agentProxyIds = Array.from(
    new Set(
      [
        ticket.agentProxyId,
        ...ticket.responses.map((response) => response.agentProxyId),
        ...ticket.responses.flatMap((response) =>
          response.comments.map((comment) => comment.agentProxyId)
        ),
      ].filter((agentProxyId): agentProxyId is string => Boolean(agentProxyId))
    )
  );
  const agentProxies = await prisma.agentProxy.findMany({
    where: { id: { in: agentProxyIds } },
    select: { id: true, name: true },
  });
  const agentNameById = new Map(agentProxies.map((agent) => [agent.id, agent.name]));

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-[hsl(var(--border))] px-6 py-3 flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">coordinate</Link>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">/ Ticket</span>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8">
        {/* Ticket header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2 text-sm text-[hsl(var(--muted-foreground))]">
            <span>{typeIcons[ticket.type]}</span>
            <span className="uppercase text-xs font-medium">{ticket.type}</span>
            <span>·</span>
            <span className={ticket.status === "OPEN" ? "text-green-400" : "text-gray-400"}>
              {ticket.status.replace("_", " ")}
            </span>
            {ticket.visibility === "PUBLIC" && (
              <>
                <span>·</span>
                <span className="text-blue-400">Public</span>
              </>
            )}
            {ticket.createdByAgent && (
              <>
                <span>·</span>
                <AgentAttribution
                  createdByAgent={ticket.createdByAgent}
                  agentName={ticket.agentProxyId ? agentNameById.get(ticket.agentProxyId) : null}
                  approvedAt={ticket.approvedAt}
                />
              </>
            )}
          </div>

          <h1 className="text-2xl font-bold">{ticket.title}</h1>

          {isOwner && (
            <TicketActions
              ticket={{
                id: ticket.id,
                title: ticket.title,
                content: ticket.content,
                type: ticket.type,
                status: ticket.status,
                visibility: ticket.visibility,
              }}
              initialTags={tags}
            />
          )}

          <div className="flex items-center gap-3 mt-3">
            {ticket.author.image && (
              <img src={ticket.author.image} alt="" className="w-6 h-6 rounded-full" />
            )}
            <span className="text-sm">
              {ticket.author.name || ticket.author.github}
            </span>
            <span className="text-xs text-[hsl(var(--muted-foreground))]">
              {new Date(ticket.createdAt).toLocaleDateString("en-US", {
                month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
              })}
            </span>
          </div>

          {tags.length > 0 && (
            <div className="flex flex-wrap gap-1 mt-3">
              {tags.map((tag) => (
                <span key={tag} className="px-2 py-0.5 rounded-full bg-[hsl(var(--secondary))] text-xs text-[hsl(var(--muted-foreground))]">
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>

        {/* Ticket content */}
        <div className="prose prose-invert max-w-none mb-8 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
          <div className="whitespace-pre-wrap text-sm">{ticket.content}</div>
        </div>

        {/* Artifacts */}
        <div className="mb-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold">
              Artifacts ({ticket.artifacts.length})
            </h2>
            {canAttachArtifact && <ArtifactForm ticketId={ticket.id} />}
          </div>

          {receiptArtifacts.length > 0 && (
            <div className="mb-4 grid gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4 sm:grid-cols-4">
              <div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Spend</div>
                <div className="text-sm font-semibold">${receiptTotals.costUsd.toFixed(4)}</div>
              </div>
              <div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Input tokens</div>
                <div className="text-sm font-semibold">{receiptTotals.inputTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Output tokens</div>
                <div className="text-sm font-semibold">{receiptTotals.outputTokens.toLocaleString()}</div>
              </div>
              <div>
                <div className="text-xs text-[hsl(var(--muted-foreground))]">Context saved</div>
                <div className="text-sm font-semibold">{receiptTotals.contextSavedTokens.toLocaleString()}</div>
              </div>
            </div>
          )}

          {ticket.artifacts.length === 0 ? (
            <p className="rounded-lg border border-dashed border-[hsl(var(--border))] py-6 text-center text-sm text-[hsl(var(--muted-foreground))]">
              No artifacts attached yet.
            </p>
          ) : (
            <div className="space-y-3">
              {ticket.artifacts.map((artifact) => {
                const metadata = parseJsonObject(artifact.metadata);
                const metadataEntries = Object.entries(metadata).slice(0, 4);
                return (
                  <div key={artifact.id} className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-medium text-[hsl(var(--muted-foreground))]">
                          {artifact.kind.replaceAll("_", " ")}
                        </div>
                        <h3 className="text-sm font-semibold">{artifact.title}</h3>
                      </div>
                      <span className="text-xs text-[hsl(var(--muted-foreground))]">
                        {new Date(artifact.createdAt).toLocaleDateString()}
                      </span>
                    </div>

                    {artifact.uri && (
                      <a
                        href={artifact.uri.startsWith("http") ? artifact.uri : undefined}
                        className="mt-2 block break-all font-mono text-xs text-blue-300"
                      >
                        {artifact.uri}
                      </a>
                    )}

                    {artifact.summary && (
                      <p className="mt-2 whitespace-pre-wrap text-sm text-[hsl(var(--muted-foreground))]">
                        {artifact.summary}
                      </p>
                    )}

                    {(artifact.provider || artifact.model || artifact.costUsd || artifact.inputTokens || artifact.outputTokens || artifact.contextSavedTokens) && (
                      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[hsl(var(--muted-foreground))]">
                        {artifact.provider && <span>provider: {artifact.provider}</span>}
                        {artifact.model && <span>model: {artifact.model}</span>}
                        {artifact.inputTokens != null && <span>in: {artifact.inputTokens.toLocaleString()}</span>}
                        {artifact.outputTokens != null && <span>out: {artifact.outputTokens.toLocaleString()}</span>}
                        {artifact.contextSavedTokens != null && <span>saved: {artifact.contextSavedTokens.toLocaleString()}</span>}
                        {artifact.costUsd != null && <span>cost: ${artifact.costUsd.toFixed(4)}</span>}
                      </div>
                    )}

                    {metadataEntries.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {metadataEntries.map(([key, value]) => (
                          <span key={key} className="rounded bg-[hsl(var(--secondary))] px-2 py-1 font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                            {key}: {String(value)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Responses */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">
            Responses ({ticket.responses.length})
          </h2>

          {ticket.responses.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))] py-8 text-center border border-dashed border-[hsl(var(--border))] rounded-lg">
              No responses yet. Be the first to weigh in.
            </p>
          ) : (
            <div className="space-y-4">
              {ticket.responses.map((response) => {
                const pos = positionLabels[response.position];
                return (
                  <div key={response.id} className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                    <div className="flex items-center gap-2 mb-2">
                      {response.author.image && (
                        <img src={response.author.image} alt="" className="w-5 h-5 rounded-full" />
                      )}
                      <span className="text-sm font-medium">{response.author.name || response.author.github}</span>
                      {pos && (
                        <span className={`text-xs ${pos.color}`}>
                          {pos.icon} {pos.label}
                        </span>
                      )}
                      {response.createdByAgent && (
                        <AgentAttribution
                          compact
                          createdByAgent={response.createdByAgent}
                          agentName={response.agentProxyId ? agentNameById.get(response.agentProxyId) : null}
                          approvedAt={response.approvedAt}
                        />
                      )}
                      <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
                        {new Date(response.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="whitespace-pre-wrap text-sm">{response.content}</div>

                    {/* Comments */}
                    {response.comments.length > 0 && (
                      <div className="mt-3 pl-4 border-l-2 border-[hsl(var(--border))] space-y-2">
                        {response.comments.map((comment) => (
                          <div key={comment.id} className="text-sm">
                            <span className="font-medium text-xs">{comment.author.name || comment.author.github}</span>
                            <span className="text-xs text-[hsl(var(--muted-foreground))] ml-2">
                              {new Date(comment.createdAt).toLocaleDateString()}
                            </span>
                            {comment.createdByAgent && (
                              <span className="ml-2">
                                <AgentAttribution
                                  compact
                                  createdByAgent={comment.createdByAgent}
                                  agentName={comment.agentProxyId ? agentNameById.get(comment.agentProxyId) : null}
                                  approvedAt={comment.approvedAt}
                                />
                              </span>
                            )}
                            <p className="text-[hsl(var(--muted-foreground))] mt-0.5">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {session?.user && <CommentForm responseId={response.id} />}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Respond form */}
        {session?.user && (
          <div className="border-t border-[hsl(var(--border))] pt-6">
            <h3 className="text-sm font-semibold mb-3">Your Response</h3>
            <ResponseForm ticketId={id} />
          </div>
        )}
      </main>
    </div>
  );
}
