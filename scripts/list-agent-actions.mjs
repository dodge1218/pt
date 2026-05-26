#!/usr/bin/env node

import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

for (const file of [".env", ".env.local"]) {
  const path = resolve(process.cwd(), file);
  if (!existsSync(path)) continue;
  const lines = readFileSync(path, "utf8").split(/\r?\n/);
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#") || !trimmed.includes("=")) continue;
    const index = trimmed.indexOf("=");
    const key = trimmed.slice(0, index).trim();
    const value = trimmed
      .slice(index + 1)
      .trim()
      .replace(/^["']|["']$/g, "");
    if (!process.env[key]) process.env[key] = value;
  }
}

const args = parseArgs(process.argv.slice(2));

if (args.help) {
  printHelp();
  process.exit(0);
}

const baseUrl =
  args.url ||
  process.env.PROOFTICKET_BASE_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";
const secret = args.secret || process.env.PROOFTICKET_AGENT_ACTION_SECRET || process.env.PROOFTICKET_OPENCLAW_SECRET;
const actorEmail = args.actorEmail || process.env.PROOFTICKET_ACTOR_EMAIL;
const actorUserId = args.actorUserId || process.env.PROOFTICKET_ACTOR_USER_ID;
const status = args.status || "PENDING";
const limit = args.limit || "20";

if (!secret) {
  console.error("PROOFTICKET_AGENT_ACTION_SECRET or PROOFTICKET_OPENCLAW_SECRET is required to list agent actions.");
  process.exit(1);
}
if (!actorEmail && !actorUserId) {
  console.error("--actor-email, --actor-user-id, PROOFTICKET_ACTOR_EMAIL, or PROOFTICKET_ACTOR_USER_ID is required.");
  process.exit(1);
}

const endpoint = new URL("/api/webhooks/openclaw/agent-actions", baseUrl);
if (actorEmail) endpoint.searchParams.set("actorEmail", actorEmail);
if (actorUserId) endpoint.searchParams.set("actorUserId", actorUserId);
endpoint.searchParams.set("status", status);
endpoint.searchParams.set("limit", limit);

try {
  const response = await fetch(endpoint, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });

  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok) {
    console.error(JSON.stringify({ ok: false, status: response.status, body }, null, 2));
    process.exit(1);
  }

  if (args.json) {
    console.log(JSON.stringify({ ok: true, status: response.status, body }, null, 2));
    process.exit(0);
  }

  const actions = Array.isArray(body.actions) ? body.actions : [];
  if (actions.length === 0) {
    console.log(`No ${status.toLowerCase()} agent actions.`);
    process.exit(0);
  }

  for (const action of actions) {
    const payload = isRecord(action.payload) ? action.payload : {};
    const title = typeof payload.title === "string"
      ? payload.title
      : typeof payload.content === "string"
        ? payload.content.slice(0, 80)
        : action.type;
    console.log(`${action.id}  ${action.status}  ${action.type}  ${action.agentProxy?.name || "agent"}`);
    console.log(`  ${title}`);
    if (action.resultId) console.log(`  result: ${action.resultId}`);
  }
} catch (error) {
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    endpoint: endpoint.toString(),
  }, null, 2));
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--json") parsed.json = true;
    else if (arg === "--url") parsed.url = argv[++i];
    else if (arg === "--secret") parsed.secret = argv[++i];
    else if (arg === "--actor-email") parsed.actorEmail = argv[++i];
    else if (arg === "--actor-user-id") parsed.actorUserId = argv[++i];
    else if (arg === "--status") parsed.status = argv[++i];
    else if (arg === "--limit") parsed.limit = argv[++i];
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return parsed;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function printHelp() {
  console.log(`List ProofTicket agent actions through the signed terminal endpoint.

Usage:
  npm run proofticket:actions -- --actor-email builder@example.com
  npm run proofticket:actions -- --actor-email builder@example.com --status ALL --limit 50
  npm run proofticket:actions -- --actor-email builder@example.com --json

Required env:
  PROOFTICKET_AGENT_ACTION_SECRET=<shared-secret>

Fallback env:
  PROOFTICKET_OPENCLAW_SECRET=<shared-secret>

Optional env:
  PROOFTICKET_BASE_URL=http://localhost:3000
  PROOFTICKET_ACTOR_EMAIL=builder@example.com
`);
}
