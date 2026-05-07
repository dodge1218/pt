export const dynamic = "force-dynamic";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { TicketCard } from "@/components/ticket-card";
import Link from "next/link";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const project = await prisma.project.findUnique({
    where: { id },
    include: {
      owner: { select: { id: true, name: true, image: true, github: true } },
      tickets: {
        where: { deletedAt: null },
        orderBy: { createdAt: "desc" },
        include: {
          author: { select: { id: true, name: true, image: true, github: true } },
          _count: { select: { responses: true } },
        },
      },
      contributors: true,
    },
  });

  if (!project) notFound();

  // Resolve contributor user info
  const contributorIds = project.contributors.map((c) => c.userId);
  const contributorUsers = await prisma.user.findMany({
    where: { id: { in: contributorIds } },
    select: { id: true, name: true, image: true, github: true, headline: true },
  });

  const statusColors: Record<string, string> = {
    ACTIVE: "text-green-400",
    COMPLETED: "text-blue-400",
    ARCHIVED: "text-gray-400",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center gap-2 text-sm text-[hsl(var(--muted-foreground))] mb-2">
          <Link href="/projects" className="hover:text-[hsl(var(--foreground))]">Projects</Link>
          <span>/</span>
        </div>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold">{project.name}</h1>
            <p className="text-sm text-[hsl(var(--muted-foreground))] mt-1">{project.description}</p>
          </div>
          <span className={`text-xs ${statusColors[project.status] || ""}`}>{project.status}</span>
        </div>
        <div className="flex gap-3 mt-3 text-xs text-[hsl(var(--muted-foreground))]">
          {project.repoUrl && (
            <a href={project.repoUrl} target="_blank" className="hover:text-[hsl(var(--foreground))]">
              🔗 Repository
            </a>
          )}
          {project.websiteUrl && (
            <a href={project.websiteUrl} target="_blank" className="hover:text-[hsl(var(--foreground))]">
              🌐 Website
            </a>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">Tickets ({project.tickets.length})</h2>
            <Link
              href={`/tickets/new`}
              className="text-xs text-[hsl(var(--primary))]"
            >
              + Add ticket
            </Link>
          </div>
          {project.tickets.length === 0 ? (
            <div className="text-center py-12 border border-dashed border-[hsl(var(--border))] rounded-lg text-[hsl(var(--muted-foreground))]">
              No tickets yet.
            </div>
          ) : (
            <div className="space-y-3">
              {project.tickets.map((ticket) => (
                <TicketCard key={ticket.id} ticket={ticket} showAuthor />
              ))}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-4">Contributors</h2>
          <div className="space-y-2">
            {/* Owner */}
            <div className="flex items-center gap-2 p-2 rounded-md">
              {project.owner.image && <img src={project.owner.image} alt="" className="w-6 h-6 rounded-full" />}
              <span className="text-sm">{project.owner.name || project.owner.github}</span>
              <span className="text-[10px] text-[hsl(var(--muted-foreground))] ml-auto">owner</span>
            </div>
            {contributorUsers.map((u) => {
              const contrib = project.contributors.find((c) => c.userId === u.id);
              return (
                <div key={u.id} className="flex items-center gap-2 p-2 rounded-md">
                  {u.image && <img src={u.image} alt="" className="w-6 h-6 rounded-full" />}
                  <span className="text-sm">{u.name || u.github}</span>
                  <span className="text-[10px] text-[hsl(var(--muted-foreground))] ml-auto">{contrib?.role}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
