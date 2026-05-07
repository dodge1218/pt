import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET /api/matches — Get match suggestions for current user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const matches = await prisma.match.findMany({
    where: {
      OR: [
        { user1Id: session.user.id },
        { user2Id: session.user.id },
      ],
    },
    include: {
      user1: { select: { id: true, name: true, image: true, github: true, headline: true } },
      user2: { select: { id: true, name: true, image: true, github: true, headline: true } },
    },
    orderBy: { score: "desc" },
    take: 20,
  });

  // Normalize: always put the "other" user in a consistent field
  const normalized = matches.map((m) => {
    const isUser1 = m.user1Id === session.user!.id;
    return {
      id: m.id,
      score: m.score,
      rationale: m.rationale,
      sharedDomains: m.sharedDomains,
      complementaryGaps: m.complementaryGaps,
      thinkingOverlap: m.thinkingOverlap,
      domainDiversity: m.domainDiversity,
      status: m.status,
      otherUser: isUser1 ? m.user2 : m.user1,
      createdAt: m.createdAt,
    };
  });

  return NextResponse.json(normalized);
}

// POST /api/matches — Update match status (view/connect/dismiss)
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { matchId, action } = body;

  if (!matchId || !["view", "connect", "dismiss"].includes(action)) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({ where: { id: matchId } });
  if (!match || (match.user1Id !== session.user.id && match.user2Id !== session.user.id)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const statusMap: Record<string, "VIEWED" | "CONNECTED" | "DISMISSED"> = {
    view: "VIEWED",
    connect: "CONNECTED",
    dismiss: "DISMISSED",
  };

  const updated = await prisma.match.update({
    where: { id: matchId },
    data: { status: statusMap[action] },
  });

  return NextResponse.json(updated);
}
