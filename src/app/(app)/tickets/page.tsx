export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TicketCard } from "@/components/ticket-card";
import Link from "next/link";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ scope?: string; type?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const scope = params.scope || "my";
  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (scope === "browse") {
    where.visibility = "PUBLIC";
  } else if (scope === "all") {
    where.OR = [
      { authorId: session.user.id },
      { visibility: "PUBLIC" },
      { bridge: { members: { some: { userId: session.user.id } } } },
    ];
  } else {
    where.OR = [
      { authorId: session.user.id },
      { bridge: { members: { some: { userId: session.user.id } } } },
    ];
  }

  if (params.type) where.type = params.type;
  if (params.status) where.status = params.status;

  const tickets = await prisma.ticket.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, image: true, github: true } },
      _count: { select: { responses: true } },
    },
  });
  const agentProxyIds = Array.from(
    new Set(
      tickets
        .map((ticket) => ticket.agentProxyId)
        .filter((agentProxyId): agentProxyId is string => Boolean(agentProxyId))
    )
  );
  const agentProxies = await prisma.agentProxy.findMany({
    where: { id: { in: agentProxyIds } },
    select: { id: true, name: true },
  });
  const agentNameById = new Map(agentProxies.map((agent) => [agent.id, agent.name]));

  const types = ["DECISION", "INFO", "PROPOSAL", "STATUS", "PUBLIC"];
  const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "ARCHIVED"];
  const scopeLinks = [
    { href: "/tickets?scope=my", value: "my", label: "My tickets" },
    { href: "/tickets?scope=browse", value: "browse", label: "Browse tickets" },
    { href: "/tickets?scope=all", value: "all", label: "All visible" },
  ];
  const title =
    scope === "browse" ? "Browse tickets" : scope === "all" ? "All visible tickets" : "My tickets";
  const emptyText =
    scope === "browse"
      ? "No public tickets to browse yet."
      : scope === "all"
        ? "No visible tickets found."
        : "No tickets sent or assigned to you yet.";

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">{title}</h1>
        <Link
          href="/tickets/new"
          className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition"
        >
          Send ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {scopeLinks.map((link) => (
          <Link
            key={link.value}
            href={link.href}
            className={`px-3 py-1 rounded-md text-xs border transition ${
              scope === link.value
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                : "border-[hsl(var(--border))]"
            }`}
          >
            {link.label}
          </Link>
        ))}
        <span className="text-[hsl(var(--border))]">|</span>
        <Link
          href={`/tickets?scope=${scope}`}
          className={`px-3 py-1 rounded-md text-xs border transition ${
            !params.type && !params.status
              ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
              : "border-[hsl(var(--border))]"
          }`}
        >
          All
        </Link>
        {types.map((t) => (
          <Link
            key={t}
            href={`/tickets?scope=${scope}&type=${t}`}
            className={`px-3 py-1 rounded-md text-xs border transition ${
              params.type === t
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                : "border-[hsl(var(--border))]"
            }`}
          >
            {t}
          </Link>
        ))}
        <span className="text-[hsl(var(--border))]">|</span>
        {statuses.map((s) => (
          <Link
            key={s}
            href={`/tickets?scope=${scope}&status=${s}`}
            className={`px-3 py-1 rounded-md text-xs border transition ${
              params.status === s
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                : "border-[hsl(var(--border))]"
            }`}
          >
            {s.replace("_", " ")}
          </Link>
        ))}
      </div>

      {tickets.length === 0 ? (
        <div className="text-center py-16 text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-lg">
          <p>{emptyText}</p>
          {scope !== "browse" && (
            <Link href="/tickets/new" className="text-[hsl(var(--primary))] text-sm mt-2 inline-block">
              Send your first ticket
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={{
                ...ticket,
                agentName: ticket.agentProxyId ? agentNameById.get(ticket.agentProxyId) : null,
              }}
              showAuthor
            />
          ))}
        </div>
      )}
    </div>
  );
}
