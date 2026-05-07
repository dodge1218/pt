/**
 * Agent Proxy System
 * 
 * Agents can create tickets, responses, and comments on behalf of their owner.
 * All agent actions go through an approval queue unless the proxy is set to auto-approve.
 */

import { prisma } from "./prisma";
import type { AgentActionType } from "@prisma/client";

interface AgentTicketPayload {
  title: string;
  content: string;
  type?: "DECISION" | "INFO" | "PROPOSAL" | "STATUS" | "PUBLIC";
  visibility?: "PRIVATE" | "FRIENDS" | "PUBLIC";
  businessValue?: "REVENUE" | "COST_SAVINGS" | "GROWTH" | "LEARNING" | "COMMUNITY";
  riskLevel?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  tags?: string[];
  bridgeId?: string;
}

interface AgentResponsePayload {
  ticketId: string;
  content: string;
  position?: "AGREE" | "DISAGREE" | "COUNTER_PROPOSAL" | "NEUTRAL" | "QUESTION";
}

interface AgentCommentPayload {
  responseId: string;
  content: string;
}

/**
 * Validate an agent API key and return the proxy + owner
 */
export async function validateAgentKey(apiKey: string) {
  return prisma.agentProxy.findUnique({
    where: { apiKey },
    include: {
      owner: {
        select: { id: true, name: true, email: true },
      },
    },
  });
}

/**
 * Create an agent action (queued for approval or auto-executed)
 */
export async function createAgentAction(
  agentProxyId: string,
  type: AgentActionType,
  payload: AgentTicketPayload | AgentResponsePayload | AgentCommentPayload
) {
  const proxy = await prisma.agentProxy.findUnique({
    where: { id: agentProxyId },
  });

  if (!proxy) throw new Error("Agent proxy not found");

  // Check permissions
  if (type === "CREATE_TICKET" && !proxy.canCreateTickets) {
    throw new Error("Agent does not have permission to create tickets");
  }
  if (type === "CREATE_RESPONSE" && !proxy.canRespond) {
    throw new Error("Agent does not have permission to respond");
  }
  if (type === "CREATE_COMMENT" && !proxy.canComment) {
    throw new Error("Agent does not have permission to comment");
  }

  // Create the action
  const action = await prisma.agentAction.create({
    data: {
      type,
      payload: JSON.stringify(payload),
      agentProxyId,
      status: proxy.requiresApproval ? "PENDING" : "APPROVED",
    },
  });

  // If auto-approve, execute immediately
  if (!proxy.requiresApproval) {
    return executeAgentAction(action.id);
  }

  return action;
}

/**
 * Execute an approved agent action
 */
export async function executeAgentAction(actionId: string) {
  const action = await prisma.agentAction.findUnique({
    where: { id: actionId },
    include: { agentProxy: true },
  });

  if (!action) throw new Error("Action not found");
  if (action.status !== "APPROVED" && action.status !== "PENDING") {
    throw new Error(`Action is ${action.status}, cannot execute`);
  }

  const payload = JSON.parse(action.payload);
  let resultId: string | undefined;

  switch (action.type) {
    case "CREATE_TICKET": {
      const ticket = await prisma.ticket.create({
        data: {
          title: payload.title,
          content: payload.content,
          type: payload.type || "INFO",
          visibility: payload.visibility || "PRIVATE",
          businessValue: payload.businessValue,
          riskLevel: payload.riskLevel,
          tags: payload.tags || [],
          bridgeId: payload.bridgeId,
          authorId: action.agentProxy.ownerId,
          createdByAgent: true,
          agentProxyId: action.agentProxyId,
        },
      });
      resultId = ticket.id;
      break;
    }

    case "CREATE_RESPONSE": {
      const response = await prisma.response.create({
        data: {
          content: payload.content,
          position: payload.position || "NEUTRAL",
          ticketId: payload.ticketId,
          authorId: action.agentProxy.ownerId,
          createdByAgent: true,
          agentProxyId: action.agentProxyId,
        },
      });
      resultId = response.id;
      break;
    }

    case "CREATE_COMMENT": {
      const comment = await prisma.comment.create({
        data: {
          content: payload.content,
          responseId: payload.responseId,
          authorId: action.agentProxy.ownerId,
          createdByAgent: true,
          agentProxyId: action.agentProxyId,
        },
      });
      resultId = comment.id;
      break;
    }
  }

  // Update action with result
  return prisma.agentAction.update({
    where: { id: actionId },
    data: {
      status: "APPROVED",
      resultId,
      resolvedAt: new Date(),
    },
  });
}

/**
 * Get pending actions for a user to approve
 */
export async function getPendingActions(userId: string) {
  return prisma.agentAction.findMany({
    where: {
      status: "PENDING",
      agentProxy: { ownerId: userId },
    },
    include: {
      agentProxy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

/**
 * Approve or reject an agent action
 */
export async function resolveAgentAction(
  actionId: string,
  userId: string,
  approved: boolean
) {
  const action = await prisma.agentAction.findFirst({
    where: {
      id: actionId,
      agentProxy: { ownerId: userId },
      status: "PENDING",
    },
  });

  if (!action) throw new Error("Action not found or not pending");

  if (approved) {
    // Execute the action
    return executeAgentAction(actionId);
  }

  // Reject
  return prisma.agentAction.update({
    where: { id: actionId },
    data: {
      status: "REJECTED",
      resolvedAt: new Date(),
    },
  });
}
