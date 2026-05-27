#!/usr/bin/env node

import { randomBytes, createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { loadLocalEnv } from "./lib/env.mjs";

loadLocalEnv();

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const prisma = new PrismaClient();

try {
  const owner = await resolveOwner(args);
  const rawApiKey = generateAgentApiKey();
  const agent = await prisma.agentProxy.create({
    data: {
      name: args.name || "Local Demo Agent",
      description: args.description || "Registered from the local ProofTicket CLI.",
      apiKey: hashAgentApiKey(rawApiKey),
      ownerId: owner.id,
      canCreateTickets: args.canCreateTickets,
      canRespond: args.canRespond,
      canComment: args.canComment,
      requiresApproval: args.requiresApproval,
    },
  });

  await prisma.auditLog.create({
    data: {
      actorUserId: owner.id,
      action: "agent.register.local_cli",
      entityType: "agent_proxy",
      entityId: agent.id,
      metadata: JSON.stringify({
        name: agent.name,
        canCreateTickets: agent.canCreateTickets,
        canRespond: agent.canRespond,
        canComment: agent.canComment,
        requiresApproval: agent.requiresApproval,
      }),
    },
  });

  const response = {
    id: agent.id,
    name: agent.name,
    owner: {
      id: owner.id,
      email: owner.email,
      name: owner.name,
    },
    apiKey: rawApiKey,
    permissions: {
      canCreateTickets: agent.canCreateTickets,
      canRespond: agent.canRespond,
      canComment: agent.canComment,
      requiresApproval: agent.requiresApproval,
    },
    message: "Agent registered. Store this apiKey now; only its SHA-256 digest is retained.",
  };

  if (args.json) {
    console.log(JSON.stringify(response, null, 2));
  } else {
    console.log("Agent registered.");
    console.log(`  id:          ${response.id}`);
    console.log(`  name:        ${response.name}`);
    console.log(`  owner:       ${response.owner.email || response.owner.id}`);
    console.log(`  apiKey:      ${response.apiKey}`);
    console.log("  stored:      SHA-256 digest only");
    console.log(`  approval:    ${response.permissions.requiresApproval ? "required" : "auto-approve"}`);
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
} finally {
  await prisma.$disconnect();
}

async function resolveOwner(parsed) {
  if (!parsed.ownerEmail && !parsed.ownerId) {
    throw new Error("--owner-email or --owner-id is required.");
  }

  const owner = parsed.ownerId
    ? await prisma.user.findUnique({
        where: { id: parsed.ownerId },
        select: { id: true, email: true, name: true },
      })
    : await prisma.user.findUnique({
        where: { email: parsed.ownerEmail },
        select: { id: true, email: true, name: true },
      });

  if (!owner) {
    throw new Error("Owner user not found. Run npm run setup:local first or pass an existing owner.");
  }

  return owner;
}

function generateAgentApiKey() {
  return `proofticket_${randomBytes(32).toString("base64url")}`;
}

function hashAgentApiKey(apiKey) {
  return createHash("sha256").update(apiKey).digest("hex");
}

function parseArgs(argv) {
  const parsed = {
    canCreateTickets: true,
    canRespond: true,
    canComment: true,
    requiresApproval: true,
  };

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--owner-email") parsed.ownerEmail = argv[++i];
    else if (arg === "--owner-id") parsed.ownerId = argv[++i];
    else if (arg === "--name") parsed.name = argv[++i];
    else if (arg === "--description") parsed.description = argv[++i];
    else if (arg === "--no-create-tickets") parsed.canCreateTickets = false;
    else if (arg === "--no-respond") parsed.canRespond = false;
    else if (arg === "--no-comment") parsed.canComment = false;
    else if (arg === "--auto-approve") parsed.requiresApproval = false;
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }

  return parsed;
}

function printHelp() {
  console.log(`Register a local ProofTicket agent and print its one-time API key.

Usage:
  npm run proofticket:agent-register -- --owner-email builder@example.com --name "Local Demo Agent"
  npm run proofticket:agent-register -- --owner-email builder@example.com --name "Fast Bot" --auto-approve --json

Options:
  --owner-email <email>    Existing local user email.
  --owner-id <id>          Existing local user id.
  --name <name>            Agent display name. Defaults to "Local Demo Agent".
  --description <text>     Agent description.
  --no-create-tickets      Disable ticket creation.
  --no-respond             Disable response creation.
  --no-comment             Disable comment creation.
  --auto-approve           Let the agent execute without human approval.
  --json                   Print machine-readable JSON.

Notes:
  - This is a local/demo registration path.
  - Production registration should stay authenticated through the app/API.
  - The raw API key is printed once. Only its SHA-256 digest is stored.
`);
}
