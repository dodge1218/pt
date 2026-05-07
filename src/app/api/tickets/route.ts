import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueTicketCreatedDeliveries } from "@/lib/ticket-delivery";
import { z } from "zod";

// ============================================
// GET /api/tickets — List tickets
// ============================================

export async function GET(req: NextRequest) {
  const session = await auth();
  const { searchParams } = new URL(req.url);

  const type = searchParams.get("type");
  const status = searchParams.get("status");
  const visibility = searchParams.get("visibility");
  const authorId = searchParams.get("authorId");
  const bridgeId = searchParams.get("bridgeId");
  const limit = Math.min(parseInt(searchParams.get("limit") || "50"), 100);
  const offset = parseInt(searchParams.get("offset") || "0");

  // Build filter
  const where: Record<string, unknown> = {
    deletedAt: null,
  };

  if (type) where.type = type;
  if (status) where.status = status;
  if (authorId) where.authorId = authorId;
  if (bridgeId) where.bridgeId = bridgeId;

  // Visibility logic
  if (visibility === "PUBLIC") {
    where.visibility = "PUBLIC";
  } else if (session?.user?.id) {
    // Authenticated: show public + own private + bridge member tickets
    where.OR = [
      { visibility: "PUBLIC" },
      { authorId: session.user.id },
      {
        bridge: {
          members: {
            some: { userId: session.user.id },
          },
        },
      },
    ];
  } else {
    // Unauthenticated: public only
    where.visibility = "PUBLIC";
  }

  const [tickets, total] = await Promise.all([
    prisma.ticket.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, image: true, github: true },
        },
        _count: { select: { responses: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
      skip: offset,
    }),
    prisma.ticket.count({ where }),
  ]);

  return NextResponse.json({ tickets, total, limit, offset });
}

// ============================================
// POST /api/tickets — Create ticket
// ============================================

const createTicketSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  type: z.enum(["DECISION", "INFO", "PROPOSAL", "STATUS", "PUBLIC"]).default("DECISION"),
  visibility: z.enum(["PRIVATE", "FRIENDS", "PUBLIC"]).default("PRIVATE"),
  tags: z.array(z.string()).optional(),
  bridgeId: z.string().optional(),
  projectId: z.string().optional(),
  businessValue: z.enum(["REVENUE", "COST_SAVINGS", "GROWTH", "LEARNING", "COMMUNITY"]).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = createTicketSchema.parse(body);

    // If bridgeId provided, verify membership
    if (data.bridgeId) {
      const membership = await prisma.bridgeMember.findUnique({
        where: {
          userId_bridgeId: {
            userId: session.user.id,
            bridgeId: data.bridgeId,
          },
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Not a member of this bridge" }, { status: 403 });
      }
    }

    if (data.projectId) {
      const project = await prisma.project.findFirst({
        where: {
          id: data.projectId,
          ownerId: session.user.id,
        },
        select: { id: true },
      });
      if (!project) {
        return NextResponse.json({ error: "Project not found or forbidden" }, { status: 403 });
      }
    }

    // PUBLIC type tickets are always PUBLIC visibility
    const visibility = data.type === "PUBLIC" ? "PUBLIC" : data.visibility;

    const ticket = await prisma.ticket.create({
      data: {
        title: data.title,
        content: data.content,
        type: data.type,
        visibility,
        tags: JSON.stringify(data.tags || []),
        bridgeId: data.bridgeId,
        projectId: data.projectId,
        businessValue: data.businessValue,
        riskLevel: data.riskLevel,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, github: true },
        },
      },
    });

    await queueTicketCreatedDeliveries({
      ticketId: ticket.id,
      authorId: session.user.id,
      title: ticket.title,
      content: ticket.content,
      bridgeId: ticket.bridgeId,
    });

    return NextResponse.json(ticket, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    console.error("[API] Create ticket error:", e);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
