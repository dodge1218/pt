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

const prisma = new PrismaClient();

try {
  const limit = Number.isFinite(args.limit) ? args.limit : 50;
  const logs = await prisma.auditLog.findMany({
    where: { action: "account.deletion_request" },
    orderBy: { createdAt: "desc" },
    take: limit,
  });

  const actorIds = [...new Set(logs.map((log) => log.actorUserId).filter(Boolean))];
  const users = await prisma.user.findMany({
    where: { id: { in: actorIds } },
    select: { id: true, name: true, email: true, github: true },
  });
  const userById = new Map(users.map((user) => [user.id, user]));

  const requests = logs.map((log) => {
    const user = log.actorUserId ? userById.get(log.actorUserId) : null;
    return redact({
      id: log.id,
      requestedAt: log.createdAt.toISOString(),
      user: user
        ? { id: user.id, name: user.name, email: user.email, github: user.github }
        : { id: log.actorUserId },
      metadata: parseJsonField(log.metadata),
    });
  });

  if (args.json) {
    console.log(JSON.stringify({ requests }, null, 2));
    process.exit(0);
  }

  if (requests.length === 0) {
    console.log("No account deletion requests found.");
    process.exit(0);
  }

  for (const request of requests) {
    const user = request.user || {};
    console.log(`${request.requestedAt}  ${request.id}`);
    console.log(`  user: ${user.email || user.github || user.name || user.id || "unknown"}`);
    if (request.metadata?.reason) console.log(`  reason: ${request.metadata.reason}`);
  }
} finally {
  await prisma.$disconnect();
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--limit") parsed.limit = Number(argv[++i]);
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`List account deletion requests from the local ProofTicket database.

Usage:
  npm run proofticket:deletion-requests
  npm run proofticket:deletion-requests -- --json
  npm run proofticket:deletion-requests -- --limit 100

This is an alpha operator tool. It reads account.deletion_request audit events and does not delete data.
`);
}
