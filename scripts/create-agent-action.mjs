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
  process.env.KAIROS_BASE_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";
const agentApiKey = args.agentApiKey || process.env.KAIROS_AGENT_API_KEY;
const stdinPayload = await readStdinJson();
const type = args.type || stdinPayload.type;

if (!agentApiKey) {
  console.error("KAIROS_AGENT_API_KEY is required to create a Kairos agent action.");
  process.exit(1);
}

if (!["CREATE_TICKET", "CREATE_RESPONSE", "CREATE_COMMENT"].includes(type)) {
  console.error("--type must be CREATE_TICKET, CREATE_RESPONSE, or CREATE_COMMENT.");
  process.exit(1);
}

const payload = buildPayload(type, args, stdinPayload);
const missing = missingRequired(type, payload);
if (missing.length > 0) {
  console.error(`Missing required input: ${missing.join(", ")}`);
  process.exit(1);
}

const endpoint = new URL("/api/agent", baseUrl);

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(compact({
      action: "create",
      agentApiKey,
      type,
      idempotencyKey: args.idempotencyKey || stdinPayload.idempotencyKey,
      payload,
    })),
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
  console.error(JSON.stringify({
    ok: false,
    error: error instanceof Error ? error.message : String(error),
    endpoint: endpoint.toString(),
  }, null, 2));
  process.exit(1);
}

function buildPayload(type, args, stdinPayload) {
  const sourcePayload = isRecord(stdinPayload.payload) ? stdinPayload.payload : stdinPayload;

  if (type === "CREATE_TICKET") {
    return compact({
      ...sourcePayload,
      title: args.title || sourcePayload.title,
      content: args.content || sourcePayload.content,
      type: args.ticketType || sourcePayload.ticketType || ticketTypeFromPayload(sourcePayload.type) || "INFO",
      visibility: args.visibility || sourcePayload.visibility || "PRIVATE",
      businessValue: args.businessValue || sourcePayload.businessValue,
      riskLevel: args.riskLevel || sourcePayload.riskLevel,
      tags: args.tags || sourcePayload.tags,
      bridgeId: args.bridgeId || sourcePayload.bridgeId,
      projectId: args.projectId || sourcePayload.projectId,
      artifacts: sourcePayload.artifacts,
    });
  }

  if (type === "CREATE_RESPONSE") {
    return compact({
      ...sourcePayload,
      ticketId: args.ticketId || sourcePayload.ticketId,
      content: args.content || sourcePayload.content,
      position: args.position || sourcePayload.position || "NEUTRAL",
    });
  }

  return compact({
    ...sourcePayload,
    responseId: args.responseId || sourcePayload.responseId,
    content: args.content || sourcePayload.content,
  });
}

function missingRequired(type, payload) {
  const missing = [];
  if (type === "CREATE_TICKET") {
    if (!payload.title) missing.push("--title");
    if (!payload.content) missing.push("--content or JSON stdin content");
  } else if (type === "CREATE_RESPONSE") {
    if (!payload.ticketId) missing.push("--ticket-id");
    if (!payload.content) missing.push("--content or JSON stdin content");
  } else {
    if (!payload.responseId) missing.push("--response-id");
    if (!payload.content) missing.push("--content or JSON stdin content");
  }
  return missing;
}

function parseArgs(argv) {
  const parsed = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--help" || arg === "-h") parsed.help = true;
    else if (arg === "--url") parsed.url = argv[++i];
    else if (arg === "--agent-api-key") parsed.agentApiKey = argv[++i];
    else if (arg === "--type") parsed.type = argv[++i];
    else if (arg === "--idempotency-key") parsed.idempotencyKey = argv[++i];
    else if (arg === "--title") parsed.title = argv[++i];
    else if (arg === "--content") parsed.content = argv[++i];
    else if (arg === "--ticket-type") parsed.ticketType = argv[++i];
    else if (arg === "--visibility") parsed.visibility = argv[++i];
    else if (arg === "--business-value") parsed.businessValue = argv[++i];
    else if (arg === "--risk-level") parsed.riskLevel = argv[++i];
    else if (arg === "--tags") parsed.tags = argv[++i].split(",").map((tag) => tag.trim()).filter(Boolean);
    else if (arg === "--bridge-id") parsed.bridgeId = argv[++i];
    else if (arg === "--project-id") parsed.projectId = argv[++i];
    else if (arg === "--ticket-id") parsed.ticketId = argv[++i];
    else if (arg === "--position") parsed.position = argv[++i];
    else if (arg === "--response-id") parsed.responseId = argv[++i];
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
    if (!isRecord(parsed)) throw new Error("stdin JSON must be an object");
    return parsed;
  } catch (error) {
    console.error(error instanceof Error ? error.message : "Invalid stdin JSON");
    process.exit(1);
  }
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compact(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== "")
  );
}

function ticketTypeFromPayload(value) {
  return ["DECISION", "INFO", "PROPOSAL", "STATUS", "PUBLIC"].includes(value) ? value : undefined;
}

function printHelp() {
  console.log(`Create a Kairos agent action with an agent API key.

Usage:
  npm run kairos:agent -- --type CREATE_TICKET \\
    --idempotency-key demo-agent:ticket:001 \\
    --title "Review migration risk" \\
    --content "Agent found a risky migration path." \\
    --tags agent,review

  npm run kairos:agent -- --type CREATE_RESPONSE \\
    --ticket-id <ticket-id> \\
    --content "I agree; hold merge until the migration is checked." \\
    --position AGREE

JSON stdin is supported for payloads and ticket artifacts:
  echo '{"artifacts":[{"kind":"NOTE","title":"Evidence","summary":"Relevant trace."}]}' \\
    | npm run kairos:agent -- --type CREATE_TICKET \\
      --idempotency-key demo-agent:ticket:002 \\
      --title "Agent evidence" \\
      --content "Evidence attached."

Required env:
  KAIROS_AGENT_API_KEY=<kairos_...>

Optional env:
  KAIROS_BASE_URL=http://localhost:3000
`);
}
