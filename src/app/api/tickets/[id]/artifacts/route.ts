import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { redactRecord } from "@/lib/redact";
import { z } from "zod";

const artifactSchema = z.object({
  kind: z
    .enum(["LINK", "FILE", "NOTE", "CONTEXTCLAW_MANIFEST", "CONTEXTCLAW_RECEIPT"])
    .default("LINK"),
  title: z.string().min(1).max(200),
  uri: z.string().max(2000).optional(),
  summary: z.string().max(2000).optional(),
  metadata: z.record(z.unknown()).optional(),
  provider: z.string().max(80).optional(),
  model: z.string().max(120).optional(),
  inputTokens: z.coerce.number().int().nonnegative().optional(),
  outputTokens: z.coerce.number().int().nonnegative().optional(),
  contextSavedTokens: z.coerce.number().int().nonnegative().optional(),
  costUsd: z.coerce.number().nonnegative().optional(),
});

async function loadVisibleTicket(ticketId: string, userId?: string | null) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId, deletedAt: null },
    select: { id: true, authorId: true, visibility: true, bridgeId: true },
  });
  if (!ticket) return null;

  if (ticket.visibility === "PUBLIC") return ticket;
  if (!userId) return null;
  if (ticket.authorId === userId) return ticket;

  if (ticket.bridgeId) {
    const membership = await prisma.bridgeMember.findUnique({
      where: { userId_bridgeId: { userId, bridgeId: ticket.bridgeId } },
      select: { id: true },
    });
    if (membership) return ticket;
  }

  return null;
}

async function canAttachArtifact(ticket: { authorId: string; bridgeId: string | null }, userId: string) {
  if (ticket.authorId === userId) return true;
  if (!ticket.bridgeId) return false;

  const membership = await prisma.bridgeMember.findUnique({
    where: { userId_bridgeId: { userId, bridgeId: ticket.bridgeId } },
    select: { id: true },
  });

  return Boolean(membership);
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const ticket = await loadVisibleTicket(id, session?.user?.id);

  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  const artifacts = await prisma.ticketArtifact.findMany({
    where: { ticketId: id },
    include: {
      createdBy: { select: { id: true, name: true, github: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ artifacts });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(req, {
    bucket: "api:tickets:artifacts:create",
    identifier: session.user.id,
    limit: 40,
    windowMs: 60_000,
  });
  if (rateLimit) return rateLimit;

  const ticket = await loadVisibleTicket(id, session.user.id);
  if (!ticket) {
    return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  }

  if (!(await canAttachArtifact(ticket, session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const body = await req.json();
    const data = artifactSchema.parse(body);
    const safeData = redactRecord(data);
    const artifact = await prisma.ticketArtifact.create({
      data: {
        kind: safeData.kind,
        title: safeData.title,
        uri: safeData.uri || null,
        summary: safeData.summary || null,
        metadata: JSON.stringify(safeData.metadata || {}),
        provider: data.provider || null,
        model: data.model || null,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        contextSavedTokens: data.contextSavedTokens,
        costUsd: data.costUsd,
        ticketId: id,
        createdById: session.user.id,
      },
      include: {
        createdBy: { select: { id: true, name: true, github: true, image: true } },
      },
    });

    await writeAuditLog({
      actorUserId: session.user.id,
      action: "ticket.artifact.create",
      entityType: "ticket_artifact",
      entityId: artifact.id,
      metadata: { ticketId: id, kind: artifact.kind },
      req,
    });

    return NextResponse.json(artifact, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
