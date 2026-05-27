import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { redactRecord } from "@/lib/redact";
import {
  queueAgentActionPendingDelivery,
  queueResponseCreatedDeliveries,
  queueTicketCreatedDeliveries,
} from "@/lib/ticket-delivery";
import { createHash, randomBytes } from "crypto";
import { z } from "zod";

// ============================================
// GET /api/agent/queue — Pending agent actions
// ============================================

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const actions = await prisma.agentAction.findMany({
    where: {
      status: "PENDING",
      agentProxy: {
        ownerId: session.user.id,
      },
    },
    include: {
      agentProxy: {
        select: { id: true, name: true, description: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(actions);
}

// ============================================
// POST /api/agent — Register agent or create action
// ============================================

const registerAgentSchema = z.object({
  action: z.literal("register"),
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  canCreateTickets: z.boolean().default(true),
  canRespond: z.boolean().default(true),
  canComment: z.boolean().default(true),
  requiresApproval: z.boolean().default(true),
});

const createActionSchema = z.object({
  action: z.literal("create"),
  agentApiKey: z.string().min(16),
  type: z.enum(["CREATE_TICKET", "CREATE_RESPONSE", "CREATE_COMMENT"]),
  payload: z.union([z.string(), z.record(z.unknown())]),
  idempotencyKey: z.string().min(8).max(200).regex(/^[A-Za-z0-9._:-]+$/).optional(),
});

const approveActionSchema = z.object({
  action: z.literal("approve"),
  actionId: z.string(),
  payload: z.union([z.string(), z.record(z.unknown())]).optional(),
});

const rejectActionSchema = z.object({
  action: z.literal("reject"),
  actionId: z.string(),
});

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

function isExecutableAgentActionType(type: string): type is ExecutableAgentActionType {
  return type === "CREATE_TICKET" || type === "CREATE_RESPONSE" || type === "CREATE_COMMENT";
}

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    bucket: "api:agent:post",
    limit: 60,
    windowMs: 60_000,
  });
  if (rateLimit) return rateLimit;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  if (!isRecord(body) || typeof body.action !== "string") {
    return NextResponse.json({ error: "Missing action" }, { status: 400 });
  }

  // Register agent (requires auth)
  if (body.action === "register") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = registerAgentSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;
    const rawApiKey = generateAgentApiKey();
    const agent = await prisma.agentProxy.create({
      data: {
        name: data.name,
        description: data.description,
        canCreateTickets: data.canCreateTickets,
        canRespond: data.canRespond,
        canComment: data.canComment,
        requiresApproval: data.requiresApproval,
        apiKey: hashAgentApiKey(rawApiKey),
        ownerId: session.user.id,
      },
    });

    await writeAuditLog({
      actorUserId: session.user.id,
      action: "agent.register",
      entityType: "agent_proxy",
      entityId: agent.id,
      metadata: {
        name: agent.name,
        canCreateTickets: agent.canCreateTickets,
        canRespond: agent.canRespond,
        canComment: agent.canComment,
        requiresApproval: agent.requiresApproval,
      },
      req,
    });

    return NextResponse.json({
      id: agent.id,
      name: agent.name,
      apiKey: rawApiKey,
      message: "Agent registered. Store this apiKey now; only its digest is retained.",
    }, { status: 201 });
  }

  // Create agent action (requires agent API key)
  if (body.action === "create") {
    const parsed = createActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;
    const agent = await findAgentByApiKey(data.agentApiKey);
    if (!agent) {
      return NextResponse.json({ error: "Invalid agent API key" }, { status: 401 });
    }

    const payload = parsePayload(data.payload);
    if (!payload.ok) {
      return NextResponse.json({ error: payload.error }, { status: 400 });
    }

    // Check permissions
    if (data.type === "CREATE_TICKET" && !agent.canCreateTickets) {
      return NextResponse.json({ error: "Agent lacks ticket creation permission" }, { status: 403 });
    }
    if (data.type === "CREATE_RESPONSE" && !agent.canRespond) {
      return NextResponse.json({ error: "Agent lacks response permission" }, { status: 403 });
    }
    if (data.type === "CREATE_COMMENT" && !agent.canComment) {
      return NextResponse.json({ error: "Agent lacks comment permission" }, { status: 403 });
    }

    const validation = await validateAgentPayload({
      ownerId: agent.ownerId,
      type: data.type,
      payload: payload.value,
    });
    if (!validation.ok) {
      return NextResponse.json({ error: validation.error }, { status: validation.status });
    }

    const safePayload = redactRecord(validation.payload);
    const payloadToStore = data.idempotencyKey
      ? { ...safePayload, _proofticket: { idempotencyKey: data.idempotencyKey } }
      : safePayload;
    const storedPayload = JSON.stringify(payloadToStore);

    if (data.idempotencyKey) {
      const existing = await prisma.agentAction.findFirst({
        where: {
          agentProxyId: agent.id,
          type: data.type,
          payload: { contains: `"idempotencyKey":"${data.idempotencyKey}"` },
        },
        orderBy: { createdAt: "desc" },
      });
      if (existing) {
        return NextResponse.json({
          id: existing.id,
          status: existing.status,
          idempotent: true,
          message: "Duplicate idempotency key; returning existing action.",
        });
      }
    }

    const action = await prisma.agentAction.create({
      data: {
        type: data.type,
        payload: storedPayload,
        agentProxyId: agent.id,
      },
    });

    if (!agent.requiresApproval) {
      // Auto-approve and execute
      await executeAgentAction(action.id, agent.ownerId);
    } else {
      await queueAgentActionPendingDelivery({
        actionId: action.id,
        ownerId: agent.ownerId,
        agentName: agent.name,
        actionType: data.type,
      });
    }

    await writeAuditLog({
      actorUserId: agent.ownerId,
      action: "agent.action.create",
      entityType: "agent_action",
      entityId: action.id,
      metadata: {
        agentProxyId: agent.id,
        type: action.type,
        requiresApproval: agent.requiresApproval,
      },
      req,
    });

    return NextResponse.json({
      id: action.id,
      status: agent.requiresApproval ? "PENDING" : "APPROVED",
      message: agent.requiresApproval
        ? "Action queued for human approval."
        : "Action auto-approved and executed.",
    }, { status: 201 });
  }

  // Approve action (requires auth, must own the agent)
  if (body.action === "approve") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = approveActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }
    const data = parsed.data;
    const agentAction = await prisma.agentAction.findUnique({
      where: { id: data.actionId },
      include: { agentProxy: true },
    });

    if (!agentAction) {
      return NextResponse.json({ error: "Action not found" }, { status: 404 });
    }
    if (agentAction.agentProxy.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (agentAction.status !== "PENDING") {
      return NextResponse.json({ error: "Action already resolved" }, { status: 400 });
    }

    try {
      let revisedPayload = false;
      if (data.payload !== undefined) {
        if (!isExecutableAgentActionType(agentAction.type)) {
          return NextResponse.json({ error: "This action type does not support revised approval yet" }, { status: 400 });
        }

        const payload = parsePayload(data.payload);
        if (!payload.ok) {
          return NextResponse.json({ error: payload.error }, { status: 400 });
        }

        const validation = await validateAgentPayload({
          ownerId: session.user.id,
          type: agentAction.type,
          payload: payload.value,
        });
        if (!validation.ok) {
          return NextResponse.json({ error: validation.error }, { status: validation.status });
        }

        const originalPayload = parsePayload(agentAction.payload);
        const originalMeta = originalPayload.ok && isRecord(originalPayload.value._proofticket)
          ? { _proofticket: originalPayload.value._proofticket }
          : {};
        const safePayload = redactRecord(validation.payload);
        await prisma.agentAction.update({
          where: { id: data.actionId },
          data: { payload: JSON.stringify({ ...safePayload, ...originalMeta }) },
        });
        revisedPayload = true;
      }

      const result = await executeAgentAction(data.actionId, session.user.id);
      await writeAuditLog({
        actorUserId: session.user.id,
        action: "agent.action.approve",
        entityType: "agent_action",
        entityId: data.actionId,
        metadata: {
          agentProxyId: agentAction.agentProxyId,
          type: agentAction.type,
          revisedPayload,
          resultId: result.resultId,
        },
        req,
      });
      return NextResponse.json(result);
    } catch (e) {
      return NextResponse.json({ error: e instanceof Error ? e.message : "Failed to execute action" }, { status: 400 });
    }
  }

  // Reject action
  if (body.action === "reject") {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const parsed = rejectActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Validation failed", details: parsed.error.errors }, { status: 400 });
    }
    const data = parsed.data;
    const agentAction = await prisma.agentAction.findUnique({
      where: { id: data.actionId },
      include: { agentProxy: true },
    });

    if (!agentAction || agentAction.agentProxy.ownerId !== session.user.id) {
      return NextResponse.json({ error: "Not found or forbidden" }, { status: 404 });
    }

    await prisma.agentAction.update({
      where: { id: data.actionId },
      data: { status: "REJECTED", resolvedAt: new Date() },
    });

    await writeAuditLog({
      actorUserId: session.user.id,
      action: "agent.action.reject",
      entityType: "agent_action",
      entityId: data.actionId,
      metadata: {
        agentProxyId: agentAction.agentProxyId,
        type: agentAction.type,
      },
      req,
    });

    return NextResponse.json({ status: "rejected" });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}

// ============================================
// Execute approved agent action
// ============================================

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
      const ticketPayload = ticketPayloadSchema.parse(stripProofTicketMeta(payload));
      const ticket = await prisma.ticket.create({
        data: {
          title: redactRecord({ title: ticketPayload.title }).title as string,
          content: redactRecord({ content: ticketPayload.content }).content as string,
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
            title: redactRecord({ title: artifact.title }).title as string,
            uri: artifact.uri ? redactRecord({ uri: artifact.uri }).uri as string : null,
            summary: artifact.summary ? redactRecord({ summary: artifact.summary }).summary as string : null,
            metadata: JSON.stringify(redactRecord({
              ...artifact.metadata,
              source: artifact.metadata?.source || "agent_action",
              agentActionId: action.id,
              agentProxyId: action.agentProxyId,
            })),
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
      const responsePayload = responsePayloadSchema.parse(stripProofTicketMeta(payload));
      const ticket = await prisma.ticket.findUnique({
        where: { id: responsePayload.ticketId, deletedAt: null },
        select: { id: true, title: true, authorId: true, bridgeId: true },
      });
      if (!ticket) throw new Error("Ticket not found");

      const response = await prisma.response.create({
        data: {
          content: redactRecord({ content: responsePayload.content }).content as string,
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
      const commentPayload = commentPayloadSchema.parse(stripProofTicketMeta(payload));
      const comment = await prisma.comment.create({
        data: {
          content: redactRecord({ content: commentPayload.content }).content as string,
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
    data: {
      status: "APPROVED",
      resultId,
      resolvedAt: new Date(),
    },
  });

  return { status: "approved", resultId };
}

function generateAgentApiKey() {
  return `proofticket_${randomBytes(32).toString("base64url")}`;
}

function hashAgentApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

async function findAgentByApiKey(apiKey: string) {
  const hashed = hashAgentApiKey(apiKey);
  return prisma.agentProxy.findFirst({
    where: {
      OR: [
        { apiKey: hashed },
        { apiKey },
      ],
    },
  });
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function parsePayload(payload: string | Record<string, unknown>):
  | { ok: true; value: Record<string, unknown> }
  | { ok: false; error: string } {
  if (typeof payload !== "string") {
    return { ok: true, value: payload };
  }

  try {
    const parsed = JSON.parse(payload);
    if (!isRecord(parsed)) return { ok: false, error: "Payload must be a JSON object" };
    return { ok: true, value: parsed };
  } catch {
    return { ok: false, error: "Invalid payload JSON" };
  }
}

function stripProofTicketMeta(payload: unknown) {
  if (!isRecord(payload)) return payload;
  const { _proofticket, ...rest } = payload;
  void _proofticket;
  return rest;
}

async function validateAgentPayload(params: {
  ownerId: string;
  type: "CREATE_TICKET" | "CREATE_RESPONSE" | "CREATE_COMMENT";
  payload: Record<string, unknown>;
}): Promise<
  | { ok: true; payload: Record<string, unknown> }
  | { ok: false; error: string; status: number }
> {
  if (params.type === "CREATE_TICKET") {
    const parsed = ticketPayloadSchema.safeParse(params.payload);
    if (!parsed.success) {
      return { ok: false, error: "Invalid ticket payload", status: 400 };
    }

    if (parsed.data.bridgeId) {
      const membership = await prisma.bridgeMember.findUnique({
        where: {
          userId_bridgeId: {
            userId: params.ownerId,
            bridgeId: parsed.data.bridgeId,
          },
        },
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
    if (!parsed.success) {
      return { ok: false, error: "Invalid response payload", status: 400 };
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: parsed.data.ticketId, deletedAt: null },
      select: { authorId: true, visibility: true, bridgeId: true },
    });
    if (!ticket) return { ok: false, error: "Ticket not found", status: 404 };

    const allowed =
      ticket.visibility === "PUBLIC" ||
      ticket.authorId === params.ownerId ||
      (ticket.bridgeId
        ? Boolean(
            await prisma.bridgeMember.findUnique({
              where: {
                userId_bridgeId: {
                  userId: params.ownerId,
                  bridgeId: ticket.bridgeId,
                },
              },
            })
          )
        : false);

    if (!allowed) return { ok: false, error: "Agent owner cannot access this ticket", status: 403 };
    return { ok: true, payload: parsed.data };
  }

  const parsed = commentPayloadSchema.safeParse(params.payload);
  if (!parsed.success) {
    return { ok: false, error: "Invalid comment payload", status: 400 };
  }

  const response = await prisma.response.findUnique({
    where: { id: parsed.data.responseId, deletedAt: null },
    select: {
      ticket: {
        select: { authorId: true, visibility: true, bridgeId: true },
      },
    },
  });
  if (!response) return { ok: false, error: "Response not found", status: 404 };

  const allowed =
    response.ticket.visibility === "PUBLIC" ||
    response.ticket.authorId === params.ownerId ||
    (response.ticket.bridgeId
      ? Boolean(
          await prisma.bridgeMember.findUnique({
            where: {
              userId_bridgeId: {
                userId: params.ownerId,
                bridgeId: response.ticket.bridgeId,
              },
            },
          })
        )
      : false);

  if (!allowed) return { ok: false, error: "Agent owner cannot access this response", status: 403 };
  return { ok: true, payload: parsed.data };
}

function normalizeTags(tags: unknown) {
  if (Array.isArray(tags)) {
    return JSON.stringify(tags.filter((tag) => typeof tag === "string"));
  }
  if (typeof tags === "string") {
    try {
      const parsed = JSON.parse(tags);
      if (Array.isArray(parsed)) {
        return JSON.stringify(parsed.filter((tag) => typeof tag === "string"));
      }
    } catch {
      return JSON.stringify(
        tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean)
      );
    }
  }
  return "[]";
}
