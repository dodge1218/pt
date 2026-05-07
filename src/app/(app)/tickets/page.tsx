export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { TicketCard } from "@/components/ticket-card";
import Link from "next/link";

export default async function TicketsPage({
  searchParams,
}: {
  searchParams: Promise<{ type?: string; status?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const params = await searchParams;
  const where: Record<string, unknown> = {
    deletedAt: null,
    OR: [
      { authorId: session.user.id },
      { visibility: "PUBLIC" },
      { bridge: { members: { some: { userId: session.user.id } } } },
    ],
  };
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

  const types = ["DECISION", "INFO", "PROPOSAL", "STATUS", "PUBLIC"];
  const statuses = ["OPEN", "IN_PROGRESS", "RESOLVED", "ARCHIVED"];

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tickets</h1>
        <Link
          href="/tickets/new"
          className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition"
        >
          + New Ticket
        </Link>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 flex-wrap">
        <Link
          href="/tickets"
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
            href={`/tickets?type=${t}`}
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
            href={`/tickets?status=${s}`}
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
          <p>No tickets found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {tickets.map((ticket) => (
            <TicketCard key={ticket.id} ticket={ticket} showAuthor />
          ))}
        </div>
      )}
    </div>
  );
}
