#!/usr/bin/env node

import { loadLocalEnv } from "./lib/env.mjs";

loadLocalEnv();

const SERVER_NAME = "proofticket-mcp";
const SERVER_VERSION = "0.1.0";
const PROTOCOL_VERSION = "2024-11-05";

const baseUrl =
  process.env.PROOFTICKET_BASE_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";

if (process.argv.includes("--help") || process.argv.includes("-h")) {
  printHelp();
  process.exit(0);
}

const tools = [
  {
    name: "proofticket_create_action",
    description: "Create a pending ProofTicket agent action through POST /api/agent.",
    inputSchema: {
      type: "object",
      properties: {
        type: {
          type: "string",
          enum: ["CREATE_TICKET", "CREATE_RESPONSE", "CREATE_COMMENT"],
          description: "Action type to request.",
        },
        idempotencyKey: {
          type: "string",
          description: "Optional idempotency key for repeat-safe submissions.",
        },
        payload: {
          type: "object",
          description: "Payload accepted by the selected action type.",
          additionalProperties: true,
        },
        agentApiKey: {
          type: "string",
          description: "Optional override. Defaults to PROOFTICKET_AGENT_API_KEY.",
        },
      },
      required: ["type", "payload"],
      additionalProperties: false,
    },
  },
  {
    name: "proofticket_list_actions",
    description: "List agent actions through GET /api/webhooks/openclaw/agent-actions.",
    inputSchema: {
      type: "object",
      properties: {
        actorEmail: {
          type: "string",
          description: "Actor email used for scope filtering. Defaults to PROOFTICKET_ACTOR_EMAIL.",
        },
        actorUserId: {
          type: "string",
          description: "Actor user id used for scope filtering. Defaults to PROOFTICKET_ACTOR_USER_ID.",
        },
        status: {
          type: "string",
          description: "Action status filter.",
          default: "PENDING",
        },
        limit: {
          type: "integer",
          minimum: 1,
          maximum: 100,
          default: 20,
        },
        secret: {
          type: "string",
          description: "Optional override. Defaults to PROOFTICKET_AGENT_ACTION_SECRET.",
        },
      },
      additionalProperties: false,
    },
  },
  {
    name: "proofticket_resolve_action",
    description: "Approve or reject an action through POST /api/webhooks/openclaw/agent-actions.",
    inputSchema: {
      type: "object",
      properties: {
        actionId: { type: "string" },
        decision: { type: "string", enum: ["approve", "reject"] },
        actorEmail: {
          type: "string",
          description: "Approver email. Defaults to PROOFTICKET_ACTOR_EMAIL.",
        },
        actorUserId: {
          type: "string",
          description: "Approver user id. Defaults to PROOFTICKET_ACTOR_USER_ID.",
        },
        payload: {
          type: "object",
          description: "Optional revised payload for approvals.",
          additionalProperties: true,
        },
        secret: {
          type: "string",
          description: "Optional override. Defaults to PROOFTICKET_AGENT_ACTION_SECRET.",
        },
      },
      required: ["actionId", "decision"],
      additionalProperties: false,
    },
  },
  {
    name: "proofticket_attach_artifact",
    description: "Attach an artifact through POST /api/tickets/:id/artifacts using a session cookie.",
    inputSchema: {
      type: "object",
      properties: {
        ticketId: { type: "string" },
        artifact: {
          type: "object",
          properties: {
            kind: {
              type: "string",
              enum: ["LINK", "FILE", "NOTE", "CONTEXTCLAW_MANIFEST", "CONTEXTCLAW_RECEIPT"],
              default: "LINK",
            },
            title: { type: "string" },
            uri: { type: "string" },
            summary: { type: "string" },
            metadata: { type: "object", additionalProperties: true },
            provider: { type: "string" },
            model: { type: "string" },
            inputTokens: { type: "integer", minimum: 0 },
            outputTokens: { type: "integer", minimum: 0 },
            contextSavedTokens: { type: "integer", minimum: 0 },
            costUsd: { type: "number", minimum: 0 },
          },
          required: ["title"],
          additionalProperties: false,
        },
        sessionCookie: {
          type: "string",
          description: "Optional Cookie header value. Defaults to PROOFTICKET_SESSION_COOKIE.",
        },
      },
      required: ["ticketId", "artifact"],
      additionalProperties: false,
    },
  },
];

const toolHandlers = {
  proofticket_create_action: createAction,
  proofticket_list_actions: listActions,
  proofticket_resolve_action: resolveAction,
  proofticket_attach_artifact: attachArtifact,
};

let input = Buffer.alloc(0);
const keepAlive = setInterval(() => {}, 2 ** 30);
let processing = Promise.resolve();

process.stdin.on("data", (chunk) => {
  input = Buffer.concat([input, chunk]);
  scheduleProcess();
});

process.stdin.on("end", () => {
  processing.finally(() => setImmediate(() => clearInterval(keepAlive)));
});

process.stdin.resume();

function scheduleProcess() {
  processing = processing
    .then(() => processFrames())
    .catch((error) => {
      writeResponse(null, makeError(-32603, error instanceof Error ? error.message : "Internal error"));
    });
}

async function processFrames() {
  while (true) {
    const headerEnd = input.indexOf("\r\n\r\n");
    if (headerEnd === -1) return;

    const header = input.subarray(0, headerEnd).toString("utf8");
    const match = /^Content-Length:\s*(\d+)$/im.exec(header);
    if (!match) {
      input = input.subarray(headerEnd + 4);
      writeResponse(null, makeError(-32700, "Missing Content-Length header"));
      continue;
    }

    const contentLength = Number(match[1]);
    const bodyStart = headerEnd + 4;
    const bodyEnd = bodyStart + contentLength;
    if (input.length < bodyEnd) return;

    const body = input.subarray(bodyStart, bodyEnd).toString("utf8");
    input = input.subarray(bodyEnd);

    let message;
    try {
      message = JSON.parse(body);
    } catch {
      writeResponse(null, makeError(-32700, "Invalid JSON"));
      continue;
    }

    await handleMessage(message);
  }
}

async function handleMessage(message) {
  if (!isRecord(message) || message.jsonrpc !== "2.0" || typeof message.method !== "string") {
    writeResponse(message?.id ?? null, makeError(-32600, "Invalid request"));
    return;
  }

  const hasId = Object.hasOwn(message, "id");
  const id = message.id ?? null;

  try {
    if (message.method === "initialize") {
      writeResult(id, {
        protocolVersion: PROTOCOL_VERSION,
        capabilities: { tools: {} },
        serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
      });
      return;
    }

    if (message.method === "notifications/initialized") {
      return;
    }

    if (message.method === "tools/list") {
      writeResult(id, { tools });
      return;
    }

    if (message.method === "tools/call") {
      const result = await callTool(message.params);
      writeResult(id, result);
      return;
    }

    if (hasId) writeResponse(id, makeError(-32601, `Unknown method: ${message.method}`));
  } catch (error) {
    const details = error instanceof HttpError ? error.body : undefined;
    writeResult(id, {
      content: [
        {
          type: "text",
          text: JSON.stringify({
            ok: false,
            error: error instanceof Error ? error.message : String(error),
            details,
          }, null, 2),
        },
      ],
      isError: true,
    });
  }
}

async function callTool(params) {
  if (!isRecord(params) || typeof params.name !== "string") {
    throw new Error("tools/call requires params.name");
  }

  const handler = toolHandlers[params.name];
  if (!handler) throw new Error(`Unknown tool: ${params.name}`);

  const args = isRecord(params.arguments) ? params.arguments : {};
  const result = await handler(args);
  return {
    content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
    isError: false,
  };
}

async function createAction(args) {
  const agentApiKey = stringArg(args.agentApiKey) || process.env.PROOFTICKET_AGENT_API_KEY;
  if (!agentApiKey) throw new Error("PROOFTICKET_AGENT_API_KEY is required.");

  const type = stringArg(args.type);
  if (!["CREATE_TICKET", "CREATE_RESPONSE", "CREATE_COMMENT"].includes(type)) {
    throw new Error("type must be CREATE_TICKET, CREATE_RESPONSE, or CREATE_COMMENT.");
  }

  if (!isRecord(args.payload)) throw new Error("payload must be an object.");

  return httpJson("/api/agent", {
    method: "POST",
    body: compact({
      action: "create",
      agentApiKey,
      type,
      idempotencyKey: stringArg(args.idempotencyKey),
      payload: args.payload,
    }),
  });
}

async function listActions(args) {
  const secret = stringArg(args.secret) || process.env.PROOFTICKET_AGENT_ACTION_SECRET || process.env.PROOFTICKET_OPENCLAW_SECRET;
  if (!secret) throw new Error("PROOFTICKET_AGENT_ACTION_SECRET or PROOFTICKET_OPENCLAW_SECRET is required.");

  const actorEmail = stringArg(args.actorEmail) || process.env.PROOFTICKET_ACTOR_EMAIL;
  const actorUserId = stringArg(args.actorUserId) || process.env.PROOFTICKET_ACTOR_USER_ID;
  if (!actorEmail && !actorUserId) {
    throw new Error("actorEmail, actorUserId, PROOFTICKET_ACTOR_EMAIL, or PROOFTICKET_ACTOR_USER_ID is required.");
  }

  const query = new URLSearchParams();
  if (actorEmail) query.set("actorEmail", actorEmail);
  if (actorUserId) query.set("actorUserId", actorUserId);
  query.set("status", stringArg(args.status) || "PENDING");
  query.set("limit", String(numberArg(args.limit, 20)));

  return httpJson(`/api/webhooks/openclaw/agent-actions?${query.toString()}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${secret}` },
  });
}

async function resolveAction(args) {
  const secret = stringArg(args.secret) || process.env.PROOFTICKET_AGENT_ACTION_SECRET || process.env.PROOFTICKET_OPENCLAW_SECRET;
  if (!secret) throw new Error("PROOFTICKET_AGENT_ACTION_SECRET or PROOFTICKET_OPENCLAW_SECRET is required.");

  const decision = stringArg(args.decision);
  if (!["approve", "reject"].includes(decision)) throw new Error("decision must be approve or reject.");

  const actorEmail = stringArg(args.actorEmail) || process.env.PROOFTICKET_ACTOR_EMAIL;
  const actorUserId = stringArg(args.actorUserId) || process.env.PROOFTICKET_ACTOR_USER_ID;
  if (!actorEmail && !actorUserId) {
    throw new Error("actorEmail, actorUserId, PROOFTICKET_ACTOR_EMAIL, or PROOFTICKET_ACTOR_USER_ID is required.");
  }

  return httpJson("/api/webhooks/openclaw/agent-actions", {
    method: "POST",
    headers: { Authorization: `Bearer ${secret}` },
    body: compact({
      actionId: stringArg(args.actionId),
      decision,
      actorEmail,
      actorUserId,
      payload: isRecord(args.payload) ? args.payload : undefined,
    }),
  });
}

async function attachArtifact(args) {
  const ticketId = stringArg(args.ticketId);
  if (!ticketId) throw new Error("ticketId is required.");
  if (!isRecord(args.artifact)) throw new Error("artifact must be an object.");

  const sessionCookie = stringArg(args.sessionCookie) || process.env.PROOFTICKET_SESSION_COOKIE;
  if (!sessionCookie) throw new Error("PROOFTICKET_SESSION_COOKIE or sessionCookie is required for artifact attachment.");

  return httpJson(`/api/tickets/${encodeURIComponent(ticketId)}/artifacts`, {
    method: "POST",
    headers: { Cookie: sessionCookie },
    body: args.artifact,
  });
}

async function httpJson(path, options) {
  const url = new URL(path, baseUrl);
  const headers = {
    Accept: "application/json",
    ...options.headers,
  };

  const fetchOptions = {
    method: options.method,
    headers,
  };

  if (options.body !== undefined) {
    fetchOptions.headers["Content-Type"] = "application/json";
    fetchOptions.body = JSON.stringify(options.body);
  }

  const response = await fetch(url, fetchOptions);
  const text = await response.text();
  const body = parseMaybeJson(text);

  if (!response.ok) {
    throw new HttpError(`HTTP ${response.status} from ${url.pathname}`, response.status, body);
  }

  return {
    ok: true,
    status: response.status,
    body,
  };
}

function writeResult(id, result) {
  writeFrame({ jsonrpc: "2.0", id, result });
}

function writeResponse(id, error) {
  writeFrame({ jsonrpc: "2.0", id, error });
}

function writeFrame(message) {
  const body = JSON.stringify(message);
  process.stdout.write(`Content-Length: ${Buffer.byteLength(body, "utf8")}\r\n\r\n${body}`);
}

function makeError(code, message) {
  return { code, message };
}

function parseMaybeJson(text) {
  if (!text) return {};
  try {
    return JSON.parse(text);
  } catch {
    return { raw: text };
  }
}

function stringArg(value) {
  return typeof value === "string" && value.length > 0 ? value : undefined;
}

function numberArg(value, fallback) {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.floor(number) : fallback;
}

function isRecord(value) {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function compact(value) {
  return Object.fromEntries(
    Object.entries(value).filter(([, entry]) => entry !== undefined && entry !== null && entry !== "")
  );
}

function printHelp() {
  console.log(`Run the local ProofTicket MCP adapter over stdio.

Usage:
  npm run mcp:server

Required env depends on called tools:
  PROOFTICKET_BASE_URL=http://localhost:3000
  PROOFTICKET_AGENT_API_KEY=<agent-api-key>
  PROOFTICKET_AGENT_ACTION_SECRET=<shared-secret>
  PROOFTICKET_ACTOR_EMAIL=builder@example.com
  PROOFTICKET_SESSION_COOKIE=<browser-session-cookie>
`);
}

class HttpError extends Error {
  constructor(message, status, body) {
    super(message);
    this.name = "HttpError";
    this.status = status;
    this.body = body;
  }
}
