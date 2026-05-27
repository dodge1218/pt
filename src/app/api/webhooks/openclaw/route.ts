import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { redactRecord } from "@/lib/redact";
import { queueTicketCreatedDeliveries } from "@/lib/ticket-delivery";
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

const openClawTicketSchema = z.object({
  source: z.enum(["openclaw", "hermes"]).default("openclaw"),
  idempotencyKey: z.string().min(8).max(200).regex(/^[A-Za-z0-9._:-]+$/),
  actorUserId: z.string().optional(),
  actorEmail: z.string().email().optional(),
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  type: z.enum(["DECISION", "INFO", "PROPOSAL", "STATUS", "PUBLIC"]).default("STATUS"),
  visibility: z.enum(["PRIVATE", "FRIENDS", "PUBLIC"]).default("PRIVATE"),
  tags: z.array(z.string()).optional(),
  bridgeId: z.string().optional(),
  projectId: z.string().optional(),
  businessValue: z.enum(["REVENUE", "COST_SAVINGS", "GROWTH", "LEARNING", "COMMUNITY"]).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  missionId: z.string().max(200).optional(),
  passId: z.string().max(200).optional(),
  terminalSessionId: z.string().max(200).optional(),
  artifacts: z.array(artifactSchema).max(20).optional(),
  metadata: z.record(z.unknown()).optional(),
});

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    bucket: "api:webhooks:openclaw",
    limit: 120,
    windowMs: 60_000,
  });
  if (rateLimit) return rateLimit;

  const webhookSecret = process.env.PROOFTICKET_OPENCLAW_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = openClawTicketSchema.parse(await req.json());
    const actor = await resolveActor(data.actorUserId, data.actorEmail);
    if (!actor) {
      return NextResponse.json(
        { error: "actorUserId or actorEmail must identify an existing user" },
        { status: 400 }
      );
    }

    const existing = await findExistingWebhookTicket(data.idempotencyKey);
    if (existing?.entityId) {
      return NextResponse.json({
        id: existing.entityId,
        idempotent: true,
        message: "Duplicate idempotency key; returning existing ticket.",
      });
    }

    const scopeCheck = await validateScope({
      actorUserId: actor.id,
      bridgeId: data.bridgeId,
      projectId: data.projectId,
    });
    if (!scopeCheck.ok) {
      return NextResponse.json({ error: scopeCheck.error }, { status: scopeCheck.status });
    }

    const safeData = redactRecord(data);
    const ticket = await prisma.ticket.create({
      data: {
        title: safeData.title,
        content: safeData.content,
        type: data.type,
        visibility: data.type === "PUBLIC" ? "PUBLIC" : data.visibility,
        tags: JSON.stringify(data.tags || []),
        bridgeId: data.bridgeId,
        projectId: data.projectId,
        businessValue: data.businessValue,
        riskLevel: data.riskLevel,
        createdByAgent: true,
        approvedBy: actor.id,
        approvedAt: new Date(),
        authorId: actor.id,
      },
    });

    if (safeData.artifacts?.length) {
      await prisma.ticketArtifact.createMany({
        data: safeData.artifacts.map((artifact) => ({
          kind: artifact.kind,
          title: artifact.title,
          uri: artifact.uri || null,
          summary: artifact.summary || null,
          metadata: JSON.stringify(redactRecord({
            ...artifact.metadata,
            source: safeData.source,
            missionId: safeData.missionId,
            passId: safeData.passId,
            terminalSessionId: safeData.terminalSessionId,
          })),
          provider: artifact.provider || null,
          model: artifact.model || null,
          inputTokens: artifact.inputTokens,
          outputTokens: artifact.outputTokens,
          contextSavedTokens: artifact.contextSavedTokens,
          costUsd: artifact.costUsd,
          ticketId: ticket.id,
          createdById: actor.id,
        })),
      });
    }

    await queueTicketCreatedDeliveries({
      ticketId: ticket.id,
      authorId: actor.id,
      title: ticket.title,
      content: ticket.content,
      bridgeId: ticket.bridgeId,
    });

    await writeAuditLog({
      actorUserId: actor.id,
      action: "openclaw.ticket.create",
      entityType: "ticket",
      entityId: ticket.id,
      metadata: {
        idempotencyKey: data.idempotencyKey,
        source: data.source,
        missionId: data.missionId,
        passId: data.passId,
        terminalSessionId: data.terminalSessionId,
        artifactCount: data.artifacts?.length || 0,
      },
      req,
    });

    return NextResponse.json({ id: ticket.id, status: "created" }, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function resolveActor(actorUserId?: string, actorEmail?: string) {
  if (actorUserId) {
    const user = await prisma.user.findUnique({
      where: { id: actorUserId },
      select: { id: true },
    });
    if (user) return user;
  }

  if (actorEmail) {
    const user = await prisma.user.findUnique({
      where: { email: actorEmail },
      select: { id: true },
    });
    if (user) return user;
  }

  return null;
}

async function findExistingWebhookTicket(idempotencyKey: string) {
  return prisma.auditLog.findFirst({
    where: {
      action: "openclaw.ticket.create",
      metadata: { contains: `"idempotencyKey":"${idempotencyKey}"` },
    },
    select: { entityId: true },
    orderBy: { createdAt: "desc" },
  });
}

async function validateScope(params: {
  actorUserId: string;
  bridgeId?: string;
  projectId?: string;
}): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  if (params.bridgeId) {
    const membership = await prisma.bridgeMember.findUnique({
      where: {
        userId_bridgeId: {
          userId: params.actorUserId,
          bridgeId: params.bridgeId,
        },
      },
    });
    if (!membership) return { ok: false, error: "Actor is not a member of this bridge", status: 403 };
  }

  if (params.projectId) {
    const project = await prisma.project.findFirst({
      where: { id: params.projectId, ownerId: params.actorUserId },
      select: { id: true },
    });
    if (!project) return { ok: false, error: "Project not found or forbidden", status: 403 };
  }

  return { ok: true };
}
