import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueResponseCreatedDeliveries } from "@/lib/ticket-delivery";
import { z } from "zod";

// ============================================
// POST /api/tickets/:id/responses — Respond to ticket
// ============================================

const createResponseSchema = z.object({
  content: z.string().min(1).max(10000),
  position: z.enum(["AGREE", "DISAGREE", "COUNTER_PROPOSAL", "NEUTRAL", "QUESTION"]).default("NEUTRAL"),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify ticket exists and user has access
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId, deletedAt: null },
  });
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Check access for non-public tickets
  if (ticket.visibility !== "PUBLIC" && ticket.authorId !== session.user.id) {
    if (ticket.bridgeId) {
      const membership = await prisma.bridgeMember.findUnique({
        where: {
          userId_bridgeId: {
            userId: session.user.id,
            bridgeId: ticket.bridgeId,
          },
        },
      });
      if (!membership) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    } else {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const body = await req.json();
    const data = createResponseSchema.parse(body);

    const response = await prisma.response.create({
      data: {
        content: data.content,
        position: data.position,
        authorId: session.user.id,
        ticketId,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, github: true },
        },
      },
    });

    await queueResponseCreatedDeliveries({
      responseId: response.id,
      responderId: session.user.id,
      ticketId,
      ticketTitle: ticket.title,
      ticketAuthorId: ticket.authorId,
      bridgeId: ticket.bridgeId,
      content: response.content,
    });

    return NextResponse.json(response, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// GET /api/tickets/:id/responses — List responses
// ============================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: ticketId } = await params;

  const responses = await prisma.response.findMany({
    where: { ticketId, deletedAt: null },
    include: {
      author: {
        select: { id: true, name: true, image: true, github: true },
      },
      comments: {
        where: { deletedAt: null },
        include: {
          author: {
            select: { id: true, name: true, image: true, github: true },
          },
        },
        orderBy: { createdAt: "asc" },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(responses);
}
