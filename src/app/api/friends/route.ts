import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/friends — List friends + pending requests
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const pendingOutgoing = sent
    .filter((f) => f.status === "PENDING")
    .map((f) => ({ ...f.receiver, friendshipId: f.id }));

  return NextResponse.json({ friends, pendingIncoming, pendingOutgoing });
}

// POST /api/friends — Send friend request or accept/decline
const friendActionSchema = z.discriminatedUnion("action", [
  z.object({ action: z.literal("request"), userId: z.string() }),
  z.object({ action: z.literal("accept"), friendshipId: z.string() }),
  z.object({ action: z.literal("decline"), friendshipId: z.string() }),
  z.object({ action: z.literal("remove"), friendshipId: z.string() }),
]);

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = friendActionSchema.parse(body);

    switch (data.action) {
      case "request": {
        if (data.userId === session.user.id) {
          return NextResponse.json({ error: "Cannot friend yourself" }, { status: 400 });
        }
        // Check existing
        const existing = await prisma.friendship.findFirst({
          where: {
            OR: [
              { requesterId: session.user.id, receiverId: data.userId },
              { requesterId: data.userId, receiverId: session.user.id },
            ],
          },
        });
        if (existing) {
          return NextResponse.json({ error: "Friendship already exists", status: existing.status }, { status: 409 });
        }

        const friendship = await prisma.friendship.create({
          data: {
            requesterId: session.user.id,
            receiverId: data.userId,
          },
        });
        return NextResponse.json(friendship, { status: 201 });
      }

      case "accept": {
        const friendship = await prisma.friendship.findUnique({
          where: { id: data.friendshipId },
        });
        if (!friendship || friendship.receiverId !== session.user.id || friendship.status !== "PENDING") {
          return NextResponse.json({ error: "Not found or not pending" }, { status: 404 });
        }
        const updated = await prisma.friendship.update({
          where: { id: data.friendshipId },
          data: { status: "ACCEPTED" },
        });
        return NextResponse.json(updated);
      }

      case "decline": {
        const friendship = await prisma.friendship.findUnique({
          where: { id: data.friendshipId },
        });
        if (!friendship || friendship.receiverId !== session.user.id) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        const updated = await prisma.friendship.update({
          where: { id: data.friendshipId },
          data: { status: "DECLINED" },
        });
        return NextResponse.json(updated);
      }

      case "remove": {
        const friendship = await prisma.friendship.findUnique({
          where: { id: data.friendshipId },
        });
        if (!friendship || (friendship.requesterId !== session.user.id && friendship.receiverId !== session.user.id)) {
          return NextResponse.json({ error: "Not found" }, { status: 404 });
        }
        await prisma.friendship.delete({ where: { id: data.friendshipId } });
        return NextResponse.json({ removed: true });
      }
    }
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
