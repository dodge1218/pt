import { parseJsonArray } from "@/lib/utils";
import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PublicBoardPage() {
  const tickets = await prisma.ticket.findMany({
    where: { visibility: "PUBLIC", deletedAt: null },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: {
      author: { select: { id: true, name: true, image: true, github: true } },
      _count: { select: { responses: true } },
    },
  });

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-[hsl(var(--border))] px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <Link href="/" className="text-lg font-bold tracking-tight">coordinate</Link>
          <span className="text-sm text-[hsl(var(--muted-foreground))]">Public Board</span>
        </div>
        <Link
          href="/login"
          className="text-sm px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white hover:opacity-90 transition"
        >
          Sign in with GitHub
        </Link>
      </header>

      <main className="max-w-4xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-2">What builders are working on</h1>
        <p className="text-[hsl(var(--muted-foreground))] text-sm mb-8">
          Public tickets from the community. Comment, suggest, offer to build together.
        </p>

        {tickets.length === 0 ? (
          <div className="text-center py-16 text-[hsl(var(--muted-foreground))]">
            <p className="text-lg">No public tickets yet.</p>
            <p className="text-sm mt-2">Be the first to share what you&apos;re building.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {tickets.map((ticket) => (
              <Link
                key={ticket.id}
                href={`/tickets/${ticket.id}`}
                className="block p-5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] transition"
              >
                <div className="flex items-center gap-2 mb-2">
                  {ticket.author.image && (
                    <img src={ticket.author.image} alt="" className="w-5 h-5 rounded-full" />
                  )}
                  <span className="text-sm text-[hsl(var(--muted-foreground))]">
                    {ticket.author.name || ticket.author.github}
                  </span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    · {new Date(ticket.createdAt).toLocaleDateString()}
                  </span>
                  {ticket.createdByAgent && (
                    <span className="text-xs text-purple-400">🤖</span>
                  )}
                </div>

                <h2 className="font-semibold text-base mb-1">{ticket.title}</h2>
                <p className="text-sm text-[hsl(var(--muted-foreground))] line-clamp-3">
                  {ticket.content.slice(0, 300)}
                </p>

                <div className="flex items-center gap-4 mt-3">
                  {parseJsonArray(ticket.tags).length > 0 && (
                    <div className="flex gap-1">
                      {parseJsonArray(ticket.tags).slice(0, 3).map((tag) => (
                        <span key={tag} className="px-2 py-0.5 rounded-full bg-[hsl(var(--secondary))] text-[10px] text-[hsl(var(--muted-foreground))]">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
                    💬 {ticket._count.responses}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
