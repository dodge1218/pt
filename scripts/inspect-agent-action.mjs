#!/usr/bin/env node

import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "./lib/env.mjs";
import { parseJsonField, redact } from "./lib/redact.mjs";

loadLocalEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

if (!args.actionId) {
  console.error("--action-id is required.");
  process.exit(1);
}

const prisma = new PrismaClient();

try {
  const action = await prisma.agentAction.findUnique({
    where: { id: args.actionId },
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
  });

  if (!action) {
    console.error(`Agent action not found: ${args.actionId}`);
    process.exit(1);
  }

  const auditLogs = await prisma.auditLog.findMany({
    where: {
      entityType: "agent_action",
      entityId: action.id,
    },
    orderBy: { createdAt: "asc" },
  });

  const receipt = redact({
    id: action.id,
    type: action.type,
    status: action.status,
    resultId: action.resultId,
    createdAt: action.createdAt.toISOString(),
    resolvedAt: action.resolvedAt?.toISOString() || null,
    agent: action.agentProxy,
    payload: parseJsonField(action.payload, { raw: action.payload }),
    audit: auditLogs.map((log) => ({
      id: log.id,
      action: log.action,
      actorUserId: log.actorUserId,
      entityType: log.entityType,
      entityId: log.entityId,
      metadata: parseJsonField(log.metadata),
      createdAt: log.createdAt.toISOString(),
    })),
  });

  if (args.json) {
    console.log(JSON.stringify(receipt, null, 2));
  } else {
    printReceipt(receipt);
  }
} finally {
  await prisma.$disconnect();
}

function printReceipt(receipt) {
  console.log(`Agent action receipt: ${receipt.id}`);
  console.log(`  type:       ${receipt.type}`);
  console.log(`  status:     ${receipt.status}`);
  console.log(`  agent:      ${receipt.agent?.name || "unknown"} (${receipt.agent?.id || "unknown"})`);
  console.log(`  owner:      ${receipt.agent?.owner?.email || receipt.agent?.owner?.id || "unknown"}`);
  console.log(`  created:    ${receipt.createdAt}`);
  console.log(`  resolved:   ${receipt.resolvedAt || "pending"}`);
  if (receipt.resultId) console.log(`  result:     ${receipt.resultId}`);
  console.log("");
  console.log("Payload:");
  console.log(JSON.stringify(receipt.payload, null, 2));

  if (receipt.audit.length > 0) {
    console.log("");
    console.log("Audit:");
    for (const log of receipt.audit) {
      console.log(`  - ${log.createdAt} ${log.action}`);
      if (log.actorUserId) console.log(`    actor: ${log.actorUserId}`);
      if (Object.keys(log.metadata).length > 0) {
        console.log(`    metadata: ${JSON.stringify(log.metadata)}`);
      }
    }
  }
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--action-id") parsed.actionId = argv[++i];
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Inspect a ProofTicket agent action as a local receipt.

Usage:
  npm run proofticket:receipt -- --action-id <agent-action-id>
  npm run proofticket:receipt -- --action-id <agent-action-id> --json
`);
}
