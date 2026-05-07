export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { ProfileCard } from "@/components/profile-card";

export default async function FriendsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const [sent, received] = await Promise.all([
    prisma.friendship.findMany({
      where: { requesterId: session.user.id },
      include: {
        receiver: { select: { id: true, name: true, image: true, github: true, headline: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: session.user.id },
      include: {
        requester: { select: { id: true, name: true, image: true, github: true, headline: true } },
      },
    }),
  ]);

  const friends = [
    ...sent.filter((f) => f.status === "ACCEPTED").map((f) => ({ ...f.receiver, friendshipId: f.id })),
    ...received.filter((f) => f.status === "ACCEPTED").map((f) => ({ ...f.requester, friendshipId: f.id })),
  ];

  const pendingIncoming = received
    .filter((f) => f.status === "PENDING")
    .map((f) => ({ ...f.requester, friendshipId: f.id }));

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Friends</h1>

      {/* Pending incoming */}
      {pendingIncoming.length > 0 && (
        <div className="mb-8">
          <h2 className="text-sm font-semibold mb-3 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse" />
            Incoming Requests ({pendingIncoming.length})
          </h2>
          <div className="space-y-2">
            {pendingIncoming.map((user) => (
              <ProfileCard
                key={user.id}
                user={user}
                action={
                  <div className="flex gap-1">
                    <form action={`/api/friends`} method="POST">
                      <button
                        type="button"
                        className="px-3 py-1 rounded-md bg-green-600 text-white text-xs hover:bg-green-500 transition"
                        onClick={async () => {
                          await fetch("/api/friends", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ action: "accept", friendshipId: user.friendshipId }),
                          });
                          window.location.reload();
                        }}
                      >
                        Accept
                      </button>
                    </form>
                    <button
                      type="button"
                      className="px-3 py-1 rounded-md border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition"
                      onClick={async () => {
                        await fetch("/api/friends", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ action: "decline", friendshipId: user.friendshipId }),
                        });
                        window.location.reload();
                      }}
                    >
                      Decline
                    </button>
                  </div>
                }
              />
            ))}
          </div>
        </div>
      )}

      {/* Friends list */}
      <h2 className="text-sm font-semibold mb-3">
        Friends ({friends.length})
      </h2>
      {friends.length === 0 ? (
        <div className="text-center py-12 border border-dashed border-[hsl(var(--border))] rounded-lg">
          <p className="text-[hsl(var(--muted-foreground))]">No friends yet.</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Find people on the public board or through matches.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {friends.map((user) => (
            <ProfileCard key={user.id} user={user} />
          ))}
        </div>
      )}
    </div>
  );
}
