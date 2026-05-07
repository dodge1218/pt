export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import { BridgeForm } from "@/components/bridge-form";
import {
  BridgeMemberControls,
  RemoveBridgeMemberButton,
} from "@/components/bridge-member-controls";

export default async function BridgesPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const userId = session.user.id;

  const [bridges, sent, received] = await Promise.all([
    prisma.bridge.findMany({
      where: { members: { some: { userId } } },
      include: {
        members: {
          include: {
            bridge: false,
          },
          orderBy: { joinedAt: "asc" },
        },
        _count: { select: { tickets: true } },
      },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.friendship.findMany({
      where: { requesterId: userId, status: "ACCEPTED" },
      include: {
        receiver: { select: { id: true, name: true, image: true, github: true } },
      },
    }),
    prisma.friendship.findMany({
      where: { receiverId: userId, status: "ACCEPTED" },
      include: {
        requester: { select: { id: true, name: true, image: true, github: true } },
      },
    }),
  ]);

  const memberUserIds = Array.from(
    new Set(bridges.flatMap((bridge) => bridge.members.map((member) => member.userId)))
  );
  const memberUsers = await prisma.user.findMany({
    where: { id: { in: memberUserIds } },
    select: { id: true, name: true, image: true, github: true },
  });
  const usersById = new Map(memberUsers.map((user) => [user.id, user]));

  const friends = [
    ...sent.map((friendship) => friendship.receiver),
    ...received.map((friendship) => friendship.requester),
  ];

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Bridges</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Private coordination spaces for people and agents working together.
        </p>
      </div>

      <div className="mb-8 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4">
        <h2 className="mb-3 text-sm font-semibold">Create Bridge</h2>
        <BridgeForm />
      </div>

      {bridges.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] py-12 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">No bridges yet.</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Create one to coordinate private tickets with a small group.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {bridges.map((bridge) => {
            const currentMembership = bridge.members.find(
              (member) => member.userId === userId
            );
            const isOwner = currentMembership?.role === "OWNER";
            const existingMemberIds = new Set(bridge.members.map((member) => member.userId));
            const eligibleFriends = friends.filter((friend) => !existingMemberIds.has(friend.id));

            return (
              <section
                key={bridge.id}
                className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-5"
              >
                <div className="mb-4 flex items-start justify-between gap-4">
                  <div>
                    <h2 className="font-semibold">{bridge.name}</h2>
                    <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                      {bridge._count.tickets} tickets · {bridge.members.length} members
                    </p>
                  </div>
                  {isOwner && (
                    <span className="rounded-full bg-[hsl(var(--secondary))] px-2 py-0.5 text-[10px] text-[hsl(var(--muted-foreground))]">
                      owner
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {bridge.members.map((member) => {
                    const user = usersById.get(member.userId);
                    return (
                      <div
                        key={member.id}
                        className="flex items-center gap-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-2"
                      >
                        {user?.image && (
                          <img src={user.image} alt="" className="h-6 w-6 rounded-full" />
                        )}
                        <span className="text-sm">
                          {user?.name || user?.github || member.userId}
                        </span>
                        <span className="ml-auto text-[10px] text-[hsl(var(--muted-foreground))]">
                          {member.role.toLowerCase()}
                        </span>
                        {isOwner && member.userId !== userId && (
                          <RemoveBridgeMemberButton
                            bridgeId={bridge.id}
                            userId={member.userId}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {isOwner && (
                  <div className="mt-4 border-t border-[hsl(var(--border))] pt-4">
                    <BridgeMemberControls bridgeId={bridge.id} friends={eligibleFriends} />
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
