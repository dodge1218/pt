import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/bridges — List user's bridges
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bridges = await prisma.bridge.findMany({
    where: {
      members: { some: { userId: session.user.id } },
    },
    include: {
      members: {
        include: {
          bridge: false,
        },
      },
      _count: { select: { tickets: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  // Resolve member user info
  const bridgesWithUsers = await Promise.all(
    bridges.map(async (bridge) => {
      const memberUserIds = bridge.members.map((m) => m.userId);
      const users = await prisma.user.findMany({
        where: { id: { in: memberUserIds } },
        select: { id: true, name: true, image: true, github: true },
      });
      return {
        ...bridge,
        members: bridge.members.map((m) => ({
          ...m,
          user: users.find((u) => u.id === m.userId),
        })),
      };
    })
  );

  return NextResponse.json(bridgesWithUsers);
}

// POST /api/bridges — Create bridge
const createBridgeSchema = z.object({
  name: z.string().min(1).max(200),
  memberIds: z.array(z.string()).min(1),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createBridgeSchema.parse(body);

    // Ensure all members exist and are friends
    const allMemberIds = [session.user!.id, ...data.memberIds.filter((id) => id !== session.user!.id)];

    const bridge = await prisma.bridge.create({
      data: {
        name: data.name,
        members: {
          create: allMemberIds.map((userId, i) => ({
            userId,
            role: i === 0 ? "OWNER" : "MEMBER",
          })),
        },
      },
      include: {
        members: true,
      },
    });

    return NextResponse.json(bridge, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
