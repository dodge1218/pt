#!/usr/bin/env node

import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "./lib/env.mjs";
import { parseJsonField, redact } from "./lib/redact.mjs";

loadLocalEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

if (!args.ticketId) {
  console.error("--ticket-id is required.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const bundle = await buildBundle(args.ticketId);
  const redacted = redact(bundle);

  if (args.stdout) {
    if (args.format === "md" || args.format === "markdown") console.log(toMarkdown(redacted));
    else console.log(JSON.stringify(redacted, null, 2));
    process.exit(0);
  }

  const outDir = resolve(process.cwd(), args.outDir || "outputs/evidence");
  const base = resolve(outDir, `${args.ticketId}-evidence`);
  mkdirSync(outDir, { recursive: true });

  const format = args.format || "all";
  const written = [];
  if (format === "all" || format === "json") {
    const jsonPath = `${base}.json`;
    writeFileSync(jsonPath, `${JSON.stringify(redacted, null, 2)}\n`, "utf8");
    written.push(jsonPath);
  }
  if (format === "all" || format === "md" || format === "markdown") {
    const mdPath = `${base}.md`;
    writeFileSync(mdPath, `${toMarkdown(redacted)}\n`, "utf8");
    written.push(mdPath);
  }

  for (const file of written) console.log(`wrote ${file}`);
} finally {
  await prisma.$disconnect();
}

async function buildBundle(ticketId) {
  const ticket = await prisma.ticket.findUnique({
    where: { id: ticketId, deletedAt: null },
    include: {
      author: { select: { id: true, name: true, email: true } },
      bridge: { select: { id: true, name: true } },
      project: { select: { id: true, name: true, repoUrl: true, websiteUrl: true } },
      artifacts: {
        include: { createdBy: { select: { id: true, name: true, email: true } } },
        orderBy: { createdAt: "asc" },
      },
      responses: {
        where: { deletedAt: null },
        orderBy: { createdAt: "asc" },
        include: {
          author: { select: { id: true, name: true, email: true } },
          comments: {
            where: { deletedAt: null },
            orderBy: { createdAt: "asc" },
            include: { author: { select: { id: true, name: true, email: true } } },
          },
        },
      },
    },
  });

  if (!ticket) {
    console.error(`Ticket not found: ${ticketId}`);
    process.exit(1);
  }

  const responseIds = ticket.responses.map((response) => response.id);
  const commentIds = ticket.responses.flatMap((response) => response.comments.map((comment) => comment.id));
  const artifactAgentActionIds = ticket.artifacts
    .map((artifact) => parseJsonField(artifact.metadata).agentActionId)
    .filter((id) => typeof id === "string");

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      OR: [
        { entityType: "ticket", entityId: ticket.id },
        { entityType: "ticket_artifact", metadata: { contains: `"ticketId":"${ticket.id}"` } },
        { entityType: "agent_action", metadata: { contains: `"resultId":"${ticket.id}"` } },
        { metadata: { contains: `"ticketId":"${ticket.id}"` } },
      ],
    },
    orderBy: { createdAt: "asc" },
  });

  const agentActions = await prisma.agentAction.findMany({
    where: {
      OR: [
        { id: { in: artifactAgentActionIds } },
        { resultId: ticket.id },
        { resultId: { in: responseIds } },
        { resultId: { in: commentIds } },
        { payload: { contains: `"ticketId":"${ticket.id}"` } },
      ],
    },
    include: {
      agentProxy: {
        select: {
          id: true,
          name: true,
          description: true,
          owner: { select: { id: true, name: true, email: true } },
        },
      },
    },
    orderBy: { createdAt: "asc" },
  });

  return {
    schema: "proofticket.ticket_evidence.v1",
    exportedAt: new Date().toISOString(),
    ticket: serializeTicket(ticket),
    responses: ticket.responses.map(serializeResponse),
    artifacts: ticket.artifacts.map(serializeArtifact),
    agentActions: agentActions.map(serializeAgentAction),
    audit: auditLogs.map(serializeAuditLog),
    summary: summarize(ticket, agentActions, auditLogs),
  };
}

function serializeTicket(ticket) {
  return {
    id: ticket.id,
    title: ticket.title,
    content: ticket.content,
    summary: ticket.summary,
    type: ticket.type,
    status: ticket.status,
    visibility: ticket.visibility,
    businessValue: ticket.businessValue,
    riskLevel: ticket.riskLevel,
    tags: parseJsonField(ticket.tags, []),
    createdByAgent: ticket.createdByAgent,
    agentProxyId: ticket.agentProxyId,
    approvedBy: ticket.approvedBy,
    approvedAt: ticket.approvedAt?.toISOString() || null,
    author: ticket.author,
    bridge: ticket.bridge,
    project: ticket.project,
    createdAt: ticket.createdAt.toISOString(),
    updatedAt: ticket.updatedAt.toISOString(),
  };
}

function serializeResponse(response) {
  return {
    id: response.id,
    content: response.content,
    position: response.position,
    createdByAgent: response.createdByAgent,
    agentProxyId: response.agentProxyId,
    approvedBy: response.approvedBy,
    approvedAt: response.approvedAt?.toISOString() || null,
    author: response.author,
    createdAt: response.createdAt.toISOString(),
    updatedAt: response.updatedAt.toISOString(),
    comments: response.comments.map((comment) => ({
      id: comment.id,
      content: comment.content,
      createdByAgent: comment.createdByAgent,
      agentProxyId: comment.agentProxyId,
      approvedBy: comment.approvedBy,
      approvedAt: comment.approvedAt?.toISOString() || null,
      author: comment.author,
      createdAt: comment.createdAt.toISOString(),
      updatedAt: comment.updatedAt.toISOString(),
    })),
  };
}

function serializeArtifact(artifact) {
  return {
    id: artifact.id,
    kind: artifact.kind,
    title: artifact.title,
    uri: artifact.uri,
    summary: artifact.summary,
    metadata: parseJsonField(artifact.metadata),
    provider: artifact.provider,
    model: artifact.model,
    inputTokens: artifact.inputTokens,
    outputTokens: artifact.outputTokens,
    contextSavedTokens: artifact.contextSavedTokens,
    costUsd: artifact.costUsd,
    createdBy: artifact.createdBy,
    createdAt: artifact.createdAt.toISOString(),
  };
}

function serializeAgentAction(action) {
  return {
    id: action.id,
    type: action.type,
    status: action.status,
    payload: parseJsonField(action.payload, { raw: action.payload }),
    resultId: action.resultId,
    agentProxy: action.agentProxy,
    createdAt: action.createdAt.toISOString(),
    resolvedAt: action.resolvedAt?.toISOString() || null,
  };
}

function serializeAuditLog(log) {
  return {
    id: log.id,
    actorUserId: log.actorUserId,
    action: log.action,
    entityType: log.entityType,
    entityId: log.entityId,
    metadata: parseJsonField(log.metadata),
    createdAt: log.createdAt.toISOString(),
  };
}

function summarize(ticket, agentActions, auditLogs) {
  const receiptArtifacts = ticket.artifacts.filter((artifact) => artifact.kind === "CONTEXTCLAW_RECEIPT");
  const totalCostUsd = ticket.artifacts.reduce(
    (sum, artifact) => sum + (typeof artifact.costUsd === "number" ? artifact.costUsd : 0),
    0
  );
  return {
    ticketId: ticket.id,
    title: ticket.title,
    status: ticket.status,
    artifactCount: ticket.artifacts.length,
    contextClawReceiptCount: receiptArtifacts.length,
    responseCount: ticket.responses.length,
    commentCount: ticket.responses.reduce((sum, response) => sum + response.comments.length, 0),
    agentActionCount: agentActions.length,
    auditEventCount: auditLogs.length,
    totalCostUsd: Number(totalCostUsd.toFixed(6)),
  };
}

function toMarkdown(bundle) {
  const lines = [];
  lines.push(`# ProofTicket Evidence Bundle`);
  lines.push("");
  lines.push(`Exported: ${bundle.exportedAt}`);
  lines.push(`Ticket: ${bundle.ticket.title}`);
  lines.push(`Ticket ID: ${bundle.ticket.id}`);
  lines.push(`Status: ${bundle.ticket.status}`);
  lines.push(`Type: ${bundle.ticket.type}`);
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  for (const [key, value] of Object.entries(bundle.summary)) {
    lines.push(`- ${key}: ${value}`);
  }
  lines.push("");
  lines.push("## Ticket");
  lines.push("");
  lines.push(bundle.ticket.content || "_No content._");
  lines.push("");
  lines.push("## Artifacts");
  lines.push("");
  if (bundle.artifacts.length === 0) {
    lines.push("_No artifacts._");
  } else {
    for (const artifact of bundle.artifacts) {
      lines.push(`### ${artifact.title}`);
      lines.push("");
      lines.push(`- kind: ${artifact.kind}`);
      if (artifact.uri) lines.push(`- uri: ${artifact.uri}`);
      if (artifact.provider) lines.push(`- provider: ${artifact.provider}`);
      if (artifact.model) lines.push(`- model: ${artifact.model}`);
      if (artifact.costUsd !== null && artifact.costUsd !== undefined) lines.push(`- costUsd: ${artifact.costUsd}`);
      if (artifact.summary) {
        lines.push("");
        lines.push(artifact.summary);
      }
      lines.push("");
    }
  }
  lines.push("## Responses");
  lines.push("");
  if (bundle.responses.length === 0) {
    lines.push("_No responses._");
  } else {
    for (const response of bundle.responses) {
      lines.push(`### ${response.position} - ${response.author?.email || response.author?.name || response.author?.id}`);
      lines.push("");
      lines.push(response.content);
      lines.push("");
      for (const comment of response.comments) {
        lines.push(`- comment by ${comment.author?.email || comment.author?.name || comment.author?.id}: ${comment.content}`);
      }
      lines.push("");
    }
  }
  lines.push("## Agent Actions");
  lines.push("");
  if (bundle.agentActions.length === 0) {
    lines.push("_No related agent actions._");
  } else {
    for (const action of bundle.agentActions) {
      lines.push(`- ${action.id}: ${action.status} ${action.type} -> ${action.resultId || "no result"}`);
    }
  }
  lines.push("");
  lines.push("## Audit Events");
  lines.push("");
  if (bundle.audit.length === 0) {
    lines.push("_No related audit events._");
  } else {
    for (const log of bundle.audit) {
      lines.push(`- ${log.createdAt}: ${log.action} (${log.entityType}:${log.entityId || "none"})`);
    }
  }
  return lines.join("\n");
}

function parseArgs(argv) {
  const parsed = { format: "all" };
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--stdout") parsed.stdout = true;
    else if (arg === "--ticket-id") parsed.ticketId = argv[++i];
    else if (arg === "--out-dir") parsed.outDir = argv[++i];
    else if (arg === "--format") parsed.format = argv[++i];
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  if (!["all", "json", "md", "markdown"].includes(parsed.format)) {
    console.error("--format must be all, json, md, or markdown.");
    process.exit(1);
  }
  return parsed;
}

function printHelp() {
  console.log(`Export a ProofTicket ticket evidence bundle from the local database.

Usage:
  npm run proofticket:evidence -- --ticket-id <ticket-id>
  npm run proofticket:evidence -- --ticket-id <ticket-id> --format json --stdout
  npm run proofticket:evidence -- --ticket-id <ticket-id> --out-dir outputs/evidence
`);
}
