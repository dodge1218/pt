import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { queueCommentCreatedDeliveries } from "@/lib/ticket-delivery";
import { checkRateLimit } from "@/lib/rate-limit";
import { redactRecord } from "@/lib/redact";
import { z } from "zod";

const createCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: responseId } = await params;
  const session = await auth();

  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(req, {
    bucket: "api:comments:create",
    identifier: session.user.id,
    limit: 90,
    windowMs: 60_000,
  });
  if (rateLimit) return rateLimit;

  const response = await prisma.response.findUnique({
    where: { id: responseId, deletedAt: null },
    include: {
      ticket: {
        select: {
          id: true,
          title: true,
          authorId: true,
          visibility: true,
          bridgeId: true,
          deletedAt: true,
        },
      },
    },
  });

  if (!response || response.ticket.deletedAt) {
    return NextResponse.json({ error: "Response not found" }, { status: 404 });
  }

  if (response.ticket.visibility !== "PUBLIC" && response.ticket.authorId !== session.user.id) {
    if (!response.ticket.bridgeId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const membership = await prisma.bridgeMember.findUnique({
      where: {
        userId_bridgeId: {
          userId: session.user.id,
          bridgeId: response.ticket.bridgeId,
        },
      },
    });

    if (!membership) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  try {
    const data = createCommentSchema.parse(await req.json());
    const safeData = redactRecord(data);
    const comment = await prisma.comment.create({
      data: {
        content: safeData.content,
        responseId,
        authorId: session.user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, image: true, github: true },
        },
      },
    });

    await queueCommentCreatedDeliveries({
      commentId: comment.id,
      commenterId: session.user.id,
      responseAuthorId: response.authorId,
      ticketTitle: response.ticket.title,
      ticketAuthorId: response.ticket.authorId,
      bridgeId: response.ticket.bridgeId,
      content: comment.content,
    });

    return NextResponse.json(comment, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
