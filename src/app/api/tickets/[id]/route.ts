import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// ============================================
// GET /api/tickets/:id — Ticket detail
// ============================================

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();

  const ticket = await prisma.ticket.findUnique({
    where: { id, deletedAt: null },
    include: {
      author: {
        select: { id: true, name: true, image: true, github: true, headline: true },
      },
      responses: {
        where: { deletedAt: null },
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
      },
      bridge: {
        select: { id: true, name: true },
      },
    },
  });

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  // Check visibility permissions
  if (ticket.visibility !== "PUBLIC") {
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    // Check if user is author or bridge member
    if (ticket.authorId !== session.user.id) {
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
  }

  return NextResponse.json(ticket);
}

// ============================================
// PATCH /api/tickets/:id — Update ticket
// ============================================

const updateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(10000).optional(),
  status: z.enum(["OPEN", "IN_PROGRESS", "IN_MEDIATION", "RESOLVED", "ARCHIVED"]).optional(),
  type: z.enum(["DECISION", "INFO", "PROPOSAL", "STATUS", "PUBLIC"]).optional(),
  tags: z.array(z.string()).optional(),
});

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket || ticket.deletedAt) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  if (ticket.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = updateTicketSchema.parse(body);

    // Convert tags array to JSON string for SQLite
    const dbData = {
      ...data,
      tags: data.tags ? JSON.stringify(data.tags) : undefined,
    };

    const updated = await prisma.ticket.update({
      where: { id },
      data: dbData,
      include: {
        author: {
          select: { id: true, name: true, image: true, github: true },
        },
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// ============================================
// DELETE /api/tickets/:id — Soft delete
// ============================================

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const ticket = await prisma.ticket.findUnique({ where: { id } });
  if (!ticket || ticket.deletedAt) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }
  if (ticket.authorId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.ticket.update({
    where: { id },
    data: { deletedAt: new Date() },
  });

  return NextResponse.json({ deleted: true });
}
