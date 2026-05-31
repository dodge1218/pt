export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ProjectsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const projects = await prisma.project.findMany({
    where: {
      OR: [
        { ownerId: session.user.id },
        { contributors: { some: { userId: session.user.id } } },
      ],
    },
    include: {
      owner: { select: { id: true, name: true, image: true, github: true } },
      _count: { select: { tickets: true, contributors: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const statusColors: Record<string, string> = {
    ACTIVE: "text-green-400",
    COMPLETED: "text-blue-400",
    ARCHIVED: "text-gray-400",
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Projects</h1>
        <Link
          href="/projects/new"
          className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition"
        >
          New project
        </Link>
      </div>

      {projects.length === 0 ? (
        <div className="text-center py-16 text-[hsl(var(--muted-foreground))] border border-dashed border-[hsl(var(--border))] rounded-lg">
          <p>No projects yet.</p>
          <p className="text-xs mt-1">Create a project to organize tickets and contributors.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {projects.map((project) => (
            <Link
              key={project.id}
              href={`/projects/${project.id}`}
              className="p-5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] transition"
            >
              <div className="flex items-start justify-between mb-2">
                <h2 className="font-semibold">{project.name}</h2>
                <span className={`text-xs ${statusColors[project.status] || ""}`}>
                  {project.status}
                </span>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-2 mb-3">
                {project.description}
              </p>
              <div className="flex items-center gap-4 text-xs text-[hsl(var(--muted-foreground))]">
                <span>📋 {project._count.tickets} tickets</span>
                <span>👥 {project._count.contributors} contributors</span>
                {project.repoUrl && <span>🔗 GitHub</span>}
              </div>
              <div className="flex items-center gap-2 mt-2">
                {project.owner.image && (
                  <img src={project.owner.image} alt="" className="w-4 h-4 rounded-full" />
                )}
                <span className="text-xs text-[hsl(var(--muted-foreground))]">
                  {project.owner.name || project.owner.github}
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
