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
const secret = args.secret || process.env.KAIROS_OPENCLAW_SECRET;

if (!secret) {
  console.error("KAIROS_OPENCLAW_SECRET is required to create an OpenClaw/Hermes ticket.");
  process.exit(1);
}

const stdinPayload = await readStdinJson();
const payload = {
  ...stdinPayload,
  source: args.source || stdinPayload.source || "openclaw",
  idempotencyKey: args.idempotencyKey || stdinPayload.idempotencyKey,
  actorEmail: args.actorEmail || stdinPayload.actorEmail,
  actorUserId: args.actorUserId || stdinPayload.actorUserId,
  title: args.title || stdinPayload.title,
  content: args.content || stdinPayload.content,
  type: args.type || stdinPayload.type || "STATUS",
  visibility: args.visibility || stdinPayload.visibility || "PRIVATE",
  tags: args.tags || stdinPayload.tags,
  bridgeId: args.bridgeId || stdinPayload.bridgeId,
  projectId: args.projectId || stdinPayload.projectId,
  missionId: args.missionId || stdinPayload.missionId,
  passId: args.passId || stdinPayload.passId,
  terminalSessionId: args.terminalSessionId || stdinPayload.terminalSessionId,
  artifacts: stdinPayload.artifacts,
  metadata: stdinPayload.metadata,
};

const missing = [];
if (!payload.idempotencyKey) missing.push("--idempotency-key");
if (!payload.actorEmail && !payload.actorUserId) missing.push("--actor-email or --actor-user-id");
if (!payload.title) missing.push("--title");
if (!payload.content) missing.push("--content or JSON stdin content");

if (missing.length > 0) {
  console.error(`Missing required input: ${missing.join(", ")}`);
  process.exit(1);
}

const endpoint = new URL("/api/webhooks/openclaw", baseUrl);

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
    else if (arg === "--source") parsed.source = argv[++i];
    else if (arg === "--idempotency-key") parsed.idempotencyKey = argv[++i];
    else if (arg === "--actor-email") parsed.actorEmail = argv[++i];
    else if (arg === "--actor-user-id") parsed.actorUserId = argv[++i];
    else if (arg === "--title") parsed.title = argv[++i];
    else if (arg === "--content") parsed.content = argv[++i];
    else if (arg === "--type") parsed.type = argv[++i];
    else if (arg === "--visibility") parsed.visibility = argv[++i];
    else if (arg === "--tags") parsed.tags = argv[++i].split(",").map((tag) => tag.trim()).filter(Boolean);
    else if (arg === "--bridge-id") parsed.bridgeId = argv[++i];
    else if (arg === "--project-id") parsed.projectId = argv[++i];
    else if (arg === "--mission-id") parsed.missionId = argv[++i];
    else if (arg === "--pass-id") parsed.passId = argv[++i];
    else if (arg === "--terminal-session-id") parsed.terminalSessionId = argv[++i];
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
  console.log(`Create a Kairos ticket through the signed OpenClaw/Hermes webhook.

Usage:
  npm run openclaw:ticket -- --idempotency-key session:pass:handoff \\
    --actor-email builder@example.com \\
    --title "Agent pass blocked" \\
    --content "Summary..." \\
    --source hermes

JSON stdin is also supported for artifacts and metadata:
  echo '{"artifacts":[{"kind":"NOTE","title":"trace","summary":"..."}]}' \\
    | npm run openclaw:ticket -- --idempotency-key session:pass:handoff \\
      --actor-email builder@example.com --title "Handoff" --content "Summary"
`);
}
