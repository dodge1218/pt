import Link from "next/link";
import { parseJsonArray } from "@/lib/utils";
import { AgentAttribution } from "@/components/agent-attribution";

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

interface TicketCardProps {
  ticket: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
    tags: string;
    createdByAgent: boolean;
    agentName?: string | null;
    approvedAt?: Date | null;
    createdAt: Date;
    author?: { name: string | null; image: string | null; github: string | null };
    _count?: { responses: number };
  };
  showAuthor?: boolean;
}

export function TicketCard({ ticket, showAuthor = false }: TicketCardProps) {
  return (
    <Link
      href={`/tickets/${ticket.id}`}
      className="block p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] transition"
    >
      {showAuthor && ticket.author && (
        <div className="flex items-center gap-2 mb-1.5">
          {ticket.author.image && (
            <img src={ticket.author.image} alt="" className="w-4 h-4 rounded-full" />
          )}
          <span className="text-xs text-[hsl(var(--muted-foreground))]">
            {ticket.author.name || ticket.author.github}
          </span>
        </div>
      )}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <span>{typeIcons[ticket.type] || "📋"}</span>
          <h3 className="font-medium text-sm">{ticket.title}</h3>
        </div>
        <span className={`text-xs whitespace-nowrap ${statusColors[ticket.status] || ""}`}>
          {ticket.status.replace("_", " ")}
        </span>
      </div>
      <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1 line-clamp-2">
        {ticket.content.slice(0, 150)}
      </p>
      <div className="flex items-center gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
        {ticket._count && <span>{ticket._count.responses} responses</span>}
        <span>·</span>
        <span>{new Date(ticket.createdAt).toLocaleDateString()}</span>
        {ticket.createdByAgent && (
          <>
            <span>·</span>
            <AgentAttribution
              compact
              createdByAgent={ticket.createdByAgent}
              agentName={ticket.agentName}
              approvedAt={ticket.approvedAt}
            />
          </>
        )}
      </div>
      {parseJsonArray(ticket.tags).length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {parseJsonArray(ticket.tags).slice(0, 4).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full bg-[hsl(var(--secondary))] text-[10px] text-[hsl(var(--muted-foreground))]">
              {tag}
            </span>
          ))}
        </div>
      )}
    </Link>
  );
}
