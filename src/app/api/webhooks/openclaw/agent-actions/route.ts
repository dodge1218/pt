import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  queueResponseCreatedDeliveries,
  queueTicketCreatedDeliveries,
} from "@/lib/ticket-delivery";
import { z } from "zod";

const actionSchema = z.discriminatedUnion("decision", [
  z.object({
    decision: z.literal("approve"),
    actionId: z.string().min(1),
    actorUserId: z.string().optional(),
    actorEmail: z.string().email().optional(),
    payload: z.union([z.string(), z.record(z.unknown())]).optional(),
  }),
  z.object({
    decision: z.literal("reject"),
    actionId: z.string().min(1),
    actorUserId: z.string().optional(),
    actorEmail: z.string().email().optional(),
  }),
]);

const ticketPayloadSchema = z.object({
  title: z.string().min(1).max(200),
  content: z.string().min(1).max(10000),
  type: z.enum(["DECISION", "INFO", "PROPOSAL", "STATUS", "PUBLIC"]).default("INFO"),
  visibility: z.enum(["PRIVATE", "FRIENDS", "PUBLIC"]).default("PRIVATE"),
  businessValue: z.enum(["REVENUE", "COST_SAVINGS", "GROWTH", "LEARNING", "COMMUNITY"]).optional(),
  riskLevel: z.enum(["LOW", "MEDIUM", "HIGH", "CRITICAL"]).optional(),
  tags: z.union([z.array(z.string()), z.string()]).optional(),
  bridgeId: z.string().optional(),
  projectId: z.string().optional(),
  artifacts: z.array(z.object({
    kind: z.enum(["LINK", "FILE", "NOTE", "CONTEXTCLAW_MANIFEST", "CONTEXTCLAW_RECEIPT"]).default("NOTE"),
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
  })).max(20).optional(),
});

const responsePayloadSchema = z.object({
  ticketId: z.string().min(1),
  content: z.string().min(1).max(10000),
  position: z.enum(["AGREE", "DISAGREE", "COUNTER_PROPOSAL", "NEUTRAL", "QUESTION"]).default("NEUTRAL"),
});

const commentPayloadSchema = z.object({
  responseId: z.string().min(1),
  content: z.string().min(1).max(5000),
});

type ExecutableAgentActionType = "CREATE_TICKET" | "CREATE_RESPONSE" | "CREATE_COMMENT";

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    bucket: "api:webhooks:openclaw:agent-actions",
    limit: 120,
    windowMs: 60_000,
  });
  if (rateLimit) return rateLimit;

  const webhookSecret = process.env.KAIROS_OPENCLAW_SECRET;
  const authHeader = req.headers.get("authorization");
  if (!webhookSecret || authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = actionSchema.parse(await req.json());
    const actor = await resolveActor(data.actorUserId, data.actorEmail);
    if (!actor) {
      return NextResponse.json(
        { error: "actorUserId or actorEmail must identify an existing user" },
        { status: 400 }
      );
    }

    const action = await prisma.agentAction.findUnique({
      where: { id: data.actionId },
      include: { agentProxy: true },
    });
    if (!action || action.agentProxy.ownerId !== actor.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }
    if (action.status !== "PENDING") {
      return NextResponse.json({ error: "Action already resolved", status: action.status }, { status: 400 });
    }

    if (data.decision === "reject") {
      await prisma.agentAction.update({
        where: { id: data.actionId },
        data: { status: "REJECTED", resolvedAt: new Date() },
      });

      await writeAuditLog({
        actorUserId: actor.id,
        action: "openclaw.agent_action.reject",
        entityType: "agent_action",
        entityId: data.actionId,
        metadata: { agentProxyId: action.agentProxyId, type: action.type },
        req,
      });

      return NextResponse.json({ status: "rejected" });
    }

    let revisedPayload = false;
    if (data.payload !== undefined) {
      if (!isExecutableAgentActionType(action.type)) {
        return NextResponse.json({ error: "This action type does not support revised approval yet" }, { status: 400 });
      }

      const payload = parsePayload(data.payload);
      if (!payload.ok) return NextResponse.json({ error: payload.error }, { status: 400 });

      const validation = await validateAgentPayload({
        ownerId: actor.id,
        type: action.type,
        payload: payload.value,
      });
      if (!validation.ok) {
        return NextResponse.json({ error: validation.error }, { status: validation.status });
      }

      const originalPayload = parsePayload(action.payload);
      const originalMeta = originalPayload.ok && isRecord(originalPayload.value._kairos)
        ? { _kairos: originalPayload.value._kairos }
        : {};
      await prisma.agentAction.update({
        where: { id: data.actionId },
        data: { payload: JSON.stringify({ ...validation.payload, ...originalMeta }) },
      });
      revisedPayload = true;
    }

    const result = await executeAgentAction(data.actionId, actor.id);
    await writeAuditLog({
      actorUserId: actor.id,
      action: "openclaw.agent_action.approve",
      entityType: "agent_action",
      entityId: data.actionId,
      metadata: {
        agentProxyId: action.agentProxyId,
        type: action.type,
        revisedPayload,
        resultId: result.resultId,
      },
      req,
    });

    return NextResponse.json(result);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: e instanceof Error ? e.message : "Internal server error" }, { status: 500 });
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

async function executeAgentAction(actionId: string, approverId: string) {
  const action = await prisma.agentAction.findUnique({
    where: { id: actionId },
    include: { agentProxy: true },
  });
  if (!action) throw new Error("Action not found");

  const payload = JSON.parse(action.payload);
  let resultId: string | null = null;

  switch (action.type) {
    case "CREATE_TICKET": {
      const ticketPayload = ticketPayloadSchema.parse(stripKairosMeta(payload));
      const ticket = await prisma.ticket.create({
        data: {
          title: ticketPayload.title,
          content: ticketPayload.content,
          type: ticketPayload.type,
          visibility: ticketPayload.type === "PUBLIC" ? "PUBLIC" : ticketPayload.visibility,
          businessValue: ticketPayload.businessValue,
          riskLevel: ticketPayload.riskLevel,
          tags: normalizeTags(ticketPayload.tags),
          bridgeId: ticketPayload.bridgeId,
          projectId: ticketPayload.projectId,
          createdByAgent: true,
          agentProxyId: action.agentProxyId,
          approvedBy: approverId,
          approvedAt: new Date(),
          authorId: action.agentProxy.ownerId,
        },
      });
      if (ticketPayload.artifacts?.length) {
        await prisma.ticketArtifact.createMany({
          data: ticketPayload.artifacts.map((artifact) => ({
            kind: artifact.kind,
            title: artifact.title,
            uri: artifact.uri || null,
            summary: artifact.summary || null,
            metadata: JSON.stringify({
              ...artifact.metadata,
              source: artifact.metadata?.source || "agent_action",
              agentActionId: action.id,
              agentProxyId: action.agentProxyId,
            }),
            provider: artifact.provider || null,
            model: artifact.model || null,
            inputTokens: artifact.inputTokens,
            outputTokens: artifact.outputTokens,
            contextSavedTokens: artifact.contextSavedTokens,
            costUsd: artifact.costUsd,
            ticketId: ticket.id,
            createdById: action.agentProxy.ownerId,
          })),
        });
      }
      resultId = ticket.id;
      await queueTicketCreatedDeliveries({
        ticketId: ticket.id,
        authorId: action.agentProxy.ownerId,
        title: ticket.title,
        content: ticket.content,
        bridgeId: ticket.bridgeId,
      });
      break;
    }
    case "CREATE_RESPONSE": {
      const responsePayload = responsePayloadSchema.parse(stripKairosMeta(payload));
      const ticket = await prisma.ticket.findUnique({
        where: { id: responsePayload.ticketId, deletedAt: null },
        select: { id: true, title: true, authorId: true, bridgeId: true },
      });
      if (!ticket) throw new Error("Ticket not found");

      const response = await prisma.response.create({
        data: {
          content: responsePayload.content,
          position: responsePayload.position,
          ticketId: responsePayload.ticketId,
          createdByAgent: true,
          agentProxyId: action.agentProxyId,
          approvedBy: approverId,
          approvedAt: new Date(),
          authorId: action.agentProxy.ownerId,
        },
      });
      resultId = response.id;
      await queueResponseCreatedDeliveries({
        responseId: response.id,
        responderId: action.agentProxy.ownerId,
        ticketId: ticket.id,
        ticketTitle: ticket.title,
        ticketAuthorId: ticket.authorId,
        bridgeId: ticket.bridgeId,
        content: response.content,
      });
      break;
    }
    case "CREATE_COMMENT": {
      const commentPayload = commentPayloadSchema.parse(stripKairosMeta(payload));
      const comment = await prisma.comment.create({
        data: {
          content: commentPayload.content,
          responseId: commentPayload.responseId,
          authorId: action.agentProxy.ownerId,
          createdByAgent: true,
          agentProxyId: action.agentProxyId,
          approvedBy: approverId,
          approvedAt: new Date(),
        },
      });
      resultId = comment.id;
      break;
    }
  }

  await prisma.agentAction.update({
    where: { id: actionId },
    data: { status: "APPROVED", resultId, resolvedAt: new Date() },
  });

  return { status: "approved", resultId };
}

async function validateAgentPayload(params: {
  ownerId: string;
  type: ExecutableAgentActionType;
  payload: Record<string, unknown>;
}): Promise<
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  if (params.type === "CREATE_TICKET") {
    const parsed = ticketPayloadSchema.safeParse(params.payload);
    if (!parsed.success) return { ok: false, error: "Invalid ticket payload", status: 400 };

    if (parsed.data.bridgeId) {
      const membership = await prisma.bridgeMember.findUnique({
        where: { userId_bridgeId: { userId: params.ownerId, bridgeId: parsed.data.bridgeId } },
      });
      if (!membership) return { ok: false, error: "Agent owner is not a member of this bridge", status: 403 };
    }

    if (parsed.data.projectId) {
      const project = await prisma.project.findFirst({
        where: { id: parsed.data.projectId, ownerId: params.ownerId },
        select: { id: true },
      });
      if (!project) return { ok: false, error: "Project not found or forbidden", status: 403 };
    }

    return { ok: true, payload: parsed.data };
  }

  if (params.type === "CREATE_RESPONSE") {
    const parsed = responsePayloadSchema.safeParse(params.payload);
    if (!parsed.success) return { ok: false, error: "Invalid response payload", status: 400 };

    const ticket = await prisma.ticket.findUnique({
      where: { id: parsed.data.ticketId, deletedAt: null },
      select: { authorId: true, visibility: true, bridgeId: true },
    });
    if (!ticket) return { ok: false, error: "Ticket not found", status: 404 };

    const allowed =
      ticket.visibility === "PUBLIC" ||
      ticket.authorId === params.ownerId ||
      (ticket.bridgeId
        ? Boolean(await prisma.bridgeMember.findUnique({
            where: { userId_bridgeId: { userId: params.ownerId, bridgeId: ticket.bridgeId } },
          }))
        : false);

    if (!allowed) return { ok: false, error: "Agent owner cannot access this ticket", status: 403 };
    return { ok: true, payload: parsed.data };
  }

  const parsed = commentPayloadSchema.safeParse(params.payload);
  if (!parsed.success) return { ok: false, error: "Invalid comment payload", status: 400 };

  const response = await prisma.response.findUnique({
    where: { id: parsed.data.responseId, deletedAt: null },
    select: { ticket: { select: { authorId: true, visibility: true, bridgeId: true } } },
  });
  if (!response) return { ok: false, error: "Response not found", status: 404 };

  const allowed =
    response.ticket.visibility === "PUBLIC" ||
    response.ticket.authorId === params.ownerId ||
    (response.ticket.bridgeId
      ? Boolean(await prisma.bridgeMember.findUnique({
          where: { userId_bridgeId: { userId: params.ownerId, bridgeId: response.ticket.bridgeId } },
        }))
      : false);

  if (!allowed) return { ok: false, error: "Agent owner cannot access this response", status: 403 };
  return { ok: true, payload: parsed.data };
}

function isExecutableAgentActionType(type: string): type is ExecutableAgentActionType {
  return type === "CREATE_TICKET" || type === "CREATE_RESPONSE" || type === "CREATE_COMMENT";
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePayload(payload: string | Record<string, unknown>):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string } {
  if (typeof payload !== "string") return { ok: true, value: payload };
  try {
    const parsed = JSON.parse(payload);
    if (!isRecord(parsed)) return { ok: false, error: "Payload must be a JSON object" };
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: "Invalid payload JSON" };
  }
}

function stripKairosMeta(payload: unknown) {
  if (!isRecord(payload)) return payload;
  const { _kairos, ...rest } = payload;
  void _kairos;
  return rest;
}

function normalizeTags(tags: unknown) {
  if (Array.isArray(tags)) return JSON.stringify(tags.filter((tag) => typeof tag === "string"));
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) return JSON.stringify(parsed.filter((tag) => typeof tag === "string"));
    } catch {
      return JSON.stringify(tags.split(",").map((tag) => tag.trim()).filter(Boolean));
    }
  }
  return "[]";
}
