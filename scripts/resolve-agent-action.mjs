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
const commandName = process.env.npm_lifecycle_event === "kairos:action" ? "kairos:action" : "openclaw:action";

if (args.help) {
  printHelp();
  process.exit(0);
}

const baseUrl =
  args.url ||
  process.env.KAIROS_BASE_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";
const secret = args.secret || process.env.KAIROS_AGENT_ACTION_SECRET || process.env.KAIROS_OPENCLAW_SECRET;
if (!secret) {
  console.error("KAIROS_AGENT_ACTION_SECRET or KAIROS_OPENCLAW_SECRET is required to resolve an agent action.");
  process.exit(1);
}

const stdinPayload = await readStdinJson();
const payload = {
  ...stdinPayload,
  decision: args.decision || stdinPayload.decision,
  actionId: args.actionId || stdinPayload.actionId,
  actorEmail: args.actorEmail || stdinPayload.actorEmail,
  actorUserId: args.actorUserId || stdinPayload.actorUserId,
  payload: stdinPayload.payload,
};

const missing = [];
if (!payload.decision) missing.push("--decision approve|reject");
if (!payload.actionId) missing.push("--action-id");
if (!payload.actorEmail && !payload.actorUserId) missing.push("--actor-email or --actor-user-id");
if (!["approve", "reject"].includes(payload.decision)) missing.push("--decision must be approve or reject");

if (missing.length > 0) {
  console.error(`Missing or invalid input: ${missing.join(", ")}`);
  process.exit(1);
}

const endpoint = new URL("/api/webhooks/openclaw/agent-actions", baseUrl);

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${secret}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(compact(payload)),
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

  console.log(JSON.stringify({ ok: true, status: response.status, body }, null, 2));
} catch (error) {
  console.error(
    JSON.stringify(
      {
        ok: false,
        error: error instanceof Error ? error.message : String(error),
        endpoint: endpoint.toString(),
      },
      null,
      2
    )
  );
  process.exit(1);
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--url") parsed.url = argv[++i];
    else if (arg === "--secret") parsed.secret = argv[++i];
    else if (arg === "--decision") parsed.decision = argv[++i];
    else if (arg === "--action-id") parsed.actionId = argv[++i];
    else if (arg === "--actor-email") parsed.actorEmail = argv[++i];
    else if (arg === "--actor-user-id") parsed.actorUserId = argv[++i];
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return parsed;
}

async function readStdinJson() {
  if (process.stdin.isTTY) return {};

  const chunks = [];
  for await (const chunk of process.stdin) chunks.push(chunk);
  const text = Buffer.concat(chunks).toString("utf8").trim();
  if (!text) return {};

  try {
    const parsed = JSON.parse(text);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
      throw new Error("stdin JSON must be an object");
    }
    return parsed;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid stdin JSON");
    process.exit(1);
  }
}

function compact(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== "")
  );
}

function printHelp() {
  console.log(`Approve or reject a pending Kairos agent action through the signed terminal endpoint.

Usage:
  npm run ${commandName} -- --decision approve --action-id <id> --actor-email builder@example.com
  npm run ${commandName} -- --decision reject --action-id <id> --actor-email builder@example.com

Revised approval payload can be supplied on stdin:
  echo '{"payload":{"title":"Revised","content":"...","type":"INFO"}}' \\
    | npm run ${commandName} -- --decision approve --action-id <id> --actor-email builder@example.com

Required env:
  KAIROS_AGENT_ACTION_SECRET=<shared-secret>

Fallback env:
  KAIROS_OPENCLAW_SECRET=<shared-secret>
`);
}
