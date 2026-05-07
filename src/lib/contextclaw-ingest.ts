import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { z } from "zod";

const actorSchema = z.object({
  actorUserId: z.string().optional(),
  actorEmail: z.string().email().optional(),
});

export const contextClawMetadataSchema = z.record(z.unknown()).optional();

export const contextClawReceiptSchema = actorSchema.extend({
  ticketId: z.string().min(1),
  missionId: z.string().min(1).max(200),
  passId: z.string().min(1).max(200).optional(),
  receiptId: z.string().min(1).max(200).optional(),
  title: z.string().min(1).max(200).optional(),
  uri: z.string().max(2000).optional(),
  summary: z.string().max(2000).optional(),
  provider: z.string().max(80).optional(),
  model: z.string().max(120).optional(),
  inputTokens: z.coerce.number().int().nonnegative().optional(),
  outputTokens: z.coerce.number().int().nonnegative().optional(),
  contextSavedTokens: z.coerce.number().int().nonnegative().optional(),
  costUsd: z.coerce.number().nonnegative().optional(),
  estimatedInputTokens: z.coerce.number().int().nonnegative().optional(),
  estimatedOutputTokens: z.coerce.number().int().nonnegative().optional(),
  estimatedCostUsd: z.coerce.number().nonnegative().optional(),
  priceSnapshot: contextClawMetadataSchema,
  includedArtifactIds: z.array(z.string()).optional(),
  excludedArtifactIds: z.array(z.string()).optional(),
  budgetDecision: z.string().max(500).optional(),
  qualityRiskNote: z.string().max(1000).optional(),
  metadata: contextClawMetadataSchema,
});

export const contextClawManifestSchema = actorSchema.extend({
  ticketId: z.string().min(1),
  missionId: z.string().min(1).max(200),
  passId: z.string().min(1).max(200).optional(),
  contextManifestId: z.string().min(1).max(200),
  title: z.string().min(1).max(200).optional(),
  uri: z.string().max(2000).optional(),
  summary: z.string().max(2000).optional(),
  estimatedInputTokens: z.coerce.number().int().nonnegative().optional(),
  estimatedOutputTokens: z.coerce.number().int().nonnegative().optional(),
  estimatedCostUsd: z.coerce.number().nonnegative().optional(),
  includedArtifactIds: z.array(z.string()).optional(),
  excludedArtifactIds: z.array(z.string()).optional(),
  budgetDecision: z.string().max(500).optional(),
  qualityRiskNote: z.string().max(1000).optional(),
  metadata: contextClawMetadataSchema,
});

type IngestAuth = {
  actorUserId: string;
  source: "session" | "contextclaw_secret";
};

async function resolveActorUserId(
  req: NextRequest,
  actor: z.infer<typeof actorSchema>
): Promise<IngestAuth | NextResponse> {
  const contextClawSecret = process.env.KAIROS_CONTEXTCLAW_SECRET;
  const authHeader = req.headers.get("authorization");
  const hasSecretAuth = Boolean(
    contextClawSecret && authHeader === `Bearer ${contextClawSecret}`
  );

  if (!hasSecretAuth) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return { actorUserId: session.user.id, source: "session" };
  }

  if (actor.actorUserId) {
    const user = await prisma.user.findUnique({
      where: { id: actor.actorUserId },
      select: { id: true },
    });
    if (user) return { actorUserId: user.id, source: "contextclaw_secret" };
  }

  if (actor.actorEmail) {
    const user = await prisma.user.findUnique({
      where: { email: actor.actorEmail },
      select: { id: true },
    });
    if (user) return { actorUserId: user.id, source: "contextclaw_secret" };
  }

  return NextResponse.json(
    { error: "actorUserId or actorEmail must identify an existing user" },
    { status: 400 }
  );
}

async function assertTicketWritable(ticketId: string, actorUserId: string) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId, deletedAt: null },
    select: { id: true, authorId: true, bridgeId: true },
  });
  if (!ticket) return NextResponse.json({ error: "Ticket not found" }, { status: 404 });
  if (ticket.authorId === actorUserId) return ticket;
  if (!ticket.bridgeId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const membership = await prisma.bridgeMember.findUnique({
    where: { userId_bridgeId: { userId: actorUserId, bridgeId: ticket.bridgeId } },
    select: { id: true },
  });
  if (!membership) return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  return ticket;
}

function isNextResponse(value: unknown): value is NextResponse {
  return value instanceof NextResponse;
}

export async function ingestContextClawReceipt(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    bucket: "api:contextclaw:receipts",
    limit: 120,
    windowMs: 60_000,
  });
  if (rateLimit) return rateLimit;

  try {
    const data = contextClawReceiptSchema.parse(await req.json());
    const authResult = await resolveActorUserId(req, data);
    if (isNextResponse(authResult)) return authResult;

    const ticket = await assertTicketWritable(data.ticketId, authResult.actorUserId);
    if (isNextResponse(ticket)) return ticket;

    const metadata = {
      ...data.metadata,
      missionId: data.missionId,
      passId: data.passId,
      receiptId: data.receiptId,
      estimatedInputTokens: data.estimatedInputTokens,
      estimatedOutputTokens: data.estimatedOutputTokens,
      estimatedCostUsd: data.estimatedCostUsd,
      priceSnapshot: data.priceSnapshot,
      includedArtifactIds: data.includedArtifactIds,
      excludedArtifactIds: data.excludedArtifactIds,
      budgetDecision: data.budgetDecision,
      qualityRiskNote: data.qualityRiskNote,
    };

    const artifact = await prisma.ticketArtifact.create({
      data: {
        kind: "CONTEXTCLAW_RECEIPT",
        title: data.title || `ContextClaw receipt ${data.receiptId || data.passId || data.missionId}`,
        uri: data.uri || null,
        summary: data.summary || null,
        metadata: JSON.stringify(metadata),
        provider: data.provider || null,
        model: data.model || null,
        inputTokens: data.inputTokens,
        outputTokens: data.outputTokens,
        contextSavedTokens: data.contextSavedTokens,
        costUsd: data.costUsd,
        ticketId: data.ticketId,
        createdById: authResult.actorUserId,
      },
    });

    await writeAuditLog({
      actorUserId: authResult.actorUserId,
      action: "contextclaw.receipt.ingest",
      entityType: "ticket_artifact",
      entityId: artifact.id,
      metadata: { ticketId: data.ticketId, missionId: data.missionId, source: authResult.source },
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

export async function ingestContextClawManifest(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    bucket: "api:contextclaw:manifests",
    limit: 120,
    windowMs: 60_000,
  });
  if (rateLimit) return rateLimit;

  try {
    const data = contextClawManifestSchema.parse(await req.json());
    const authResult = await resolveActorUserId(req, data);
    if (isNextResponse(authResult)) return authResult;

    const ticket = await assertTicketWritable(data.ticketId, authResult.actorUserId);
    if (isNextResponse(ticket)) return ticket;

    const metadata = {
      ...data.metadata,
      missionId: data.missionId,
      passId: data.passId,
      contextManifestId: data.contextManifestId,
      estimatedInputTokens: data.estimatedInputTokens,
      estimatedOutputTokens: data.estimatedOutputTokens,
      estimatedCostUsd: data.estimatedCostUsd,
      includedArtifactIds: data.includedArtifactIds,
      excludedArtifactIds: data.excludedArtifactIds,
      budgetDecision: data.budgetDecision,
      qualityRiskNote: data.qualityRiskNote,
    };

    const artifact = await prisma.ticketArtifact.create({
      data: {
        kind: "CONTEXTCLAW_MANIFEST",
        title: data.title || `ContextClaw manifest ${data.contextManifestId}`,
        uri: data.uri || null,
        summary: data.summary || null,
        metadata: JSON.stringify(metadata),
        inputTokens: data.estimatedInputTokens,
        outputTokens: data.estimatedOutputTokens,
        costUsd: data.estimatedCostUsd,
        ticketId: data.ticketId,
        createdById: authResult.actorUserId,
      },
    });

    await writeAuditLog({
      actorUserId: authResult.actorUserId,
      action: "contextclaw.manifest.ingest",
      entityType: "ticket_artifact",
      entityId: artifact.id,
      metadata: { ticketId: data.ticketId, missionId: data.missionId, source: authResult.source },
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
