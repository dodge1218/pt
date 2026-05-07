export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileCard } from "@/components/profile-card";
import { ThinkingRadar } from "@/components/thinking-radar";
import Link from "next/link";

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      thinkingProfile: true,
      voiceProfile: true,
      interests: true,
      tickets: {
        where: { deletedAt: null, visibility: "PUBLIC" },
        orderBy: { createdAt: "desc" },
        take: 5,
        include: { _count: { select: { responses: true } } },
      },
      projects: {
        take: 10,
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-start gap-6 mb-8">
        {user.image ? (
          <img src={user.image} alt="" className="w-20 h-20 rounded-full" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center text-2xl">
            {(user.name || "?")[0]}
          </div>
        )}
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{user.name}</h1>
          {user.headline && <p className="text-sm text-[hsl(var(--muted-foreground))]">{user.headline}</p>}
          {user.bio && <p className="text-sm mt-2">{user.bio}</p>}
          <div className="flex gap-3 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
            {user.github && <span>@{user.github}</span>}
            {user.website && <a href={user.website} className="hover:underline">{user.website}</a>}
          </div>
          <Link href="/settings" className="text-xs text-[hsl(var(--primary))] mt-2 inline-block">
            Edit profile →
          </Link>
        </div>
      </div>

      {/* Interests */}
      {user.interests.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-2">Interests</h2>
          <div className="flex flex-wrap gap-1">
            {user.interests.map((i) => (
              <span key={i.id} className="px-2 py-0.5 rounded-full bg-[hsl(var(--secondary))] text-xs text-[hsl(var(--muted-foreground))]">
                {i.name}
              </span>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Thinking profile */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Thinking Profile</h2>
          {user.thinkingProfile ? (
            <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] flex items-center justify-center">
              <ThinkingRadar
                size={220}
                breadthScore={user.thinkingProfile.breadthScore}
                depthScore={user.thinkingProfile.depthScore}
                synthesisScore={user.thinkingProfile.synthesisScore}
                velocityScore={user.thinkingProfile.velocityScore}
                strategicAlignment={user.thinkingProfile.strategicAlignment}
              />
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-dashed border-[hsl(var(--border))] text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No thinking profile yet.</p>
              <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Upload a prompt dump to generate one.</p>
            </div>
          )}
        </div>

        {/* Voice preferences */}
        <div>
          <h2 className="text-sm font-semibold mb-3">Voice Preferences</h2>
          {user.voiceProfile ? (
            <div className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] space-y-2 text-sm">
              <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">Length</span><span>{user.voiceProfile.prefersLength}</span></div>
              <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">Structure</span><span>{user.voiceProfile.prefersStructure}</span></div>
              <div className="flex justify-between"><span className="text-[hsl(var(--muted-foreground))]">Formality</span><span>{user.voiceProfile.prefersFormality}</span></div>
              {user.voiceProfile.customNotes && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] pt-2 border-t border-[hsl(var(--border))]">{user.voiceProfile.customNotes}</p>
              )}
            </div>
          ) : (
            <div className="p-6 rounded-lg border border-dashed border-[hsl(var(--border))] text-center">
              <p className="text-sm text-[hsl(var(--muted-foreground))]">No voice profile set.</p>
              <Link href="/settings" className="text-xs text-[hsl(var(--primary))] mt-1 inline-block">Set up →</Link>
            </div>
          )}
        </div>
      </div>

      {/* Projects */}
      {user.projects.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold mb-3">Projects</h2>
          <div className="space-y-2">
            {user.projects.map((p) => (
              <Link key={p.id} href={`/projects/${p.id}`} className="block p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] transition">
                <h3 className="font-medium text-sm">{p.name}</h3>
                <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-1">{p.description}</p>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Public tickets */}
      {user.tickets.length > 0 && (
        <div className="mt-8">
          <h2 className="text-sm font-semibold mb-3">Public Tickets</h2>
          <div className="space-y-2">
            {user.tickets.map((t) => (
              <Link key={t.id} href={`/tickets/${t.id}`} className="block p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] hover:border-[hsl(var(--primary))] transition">
                <h3 className="font-medium text-sm">{t.title}</h3>
                <span className="text-xs text-[hsl(var(--muted-foreground))]">{t._count.responses} responses</span>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
