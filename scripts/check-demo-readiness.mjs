#!/usr/bin/env node

import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { resolve } from "node:path";

const root = process.cwd();
const failures = [];

const requiredFiles = [
  "README.md",
  "NEXT_TICKETS.md",
  "docs/API.md",
  "docs/MCP.md",
  "docs/ALPHA-DEPLOYMENT.md",
  "docs/PUBLIC-RELEASE-CHECKLIST.md",
  "docs/DOCTRINE.md",
  "docs/AGENT-HANDOFF-PROOFTICKET.md",
  "docs/SUBMISSION-PACKET.md",
  "docs/DEVPOST-DRAFT.md",
  "docs/DEMO-ASSETS.md",
  "examples/five-minute-demo/README.md",
  "examples/five-minute-demo/agent-ticket-with-evidence.json",
  "examples/five-minute-demo/print-demo-commands.sh",
  "examples/github-webhook/pull-request-opened.json",
  "scripts/mcp-server.mjs",
  "scripts/smoke-mcp-server.mjs",
  "scripts/register-agent.mjs",
  "scripts/create-agent-action.mjs",
  "scripts/list-agent-actions.mjs",
  "scripts/resolve-agent-action.mjs",
  "scripts/inspect-agent-action.mjs",
  "scripts/export-ticket-evidence.mjs",
  "scripts/list-deletion-requests.mjs",
  "outputs/ui-screenshots/home.png",
  "outputs/ui-screenshots/home-mobile.png",
  "outputs/ui-screenshots/login.png",
];

const requiredScripts = [
  "setup:local",
  "setup:postgres",
  "health",
  "proofticket:agent-register",
  "proofticket:agent",
  "proofticket:actions",
  "proofticket:action",
  "proofticket:receipt",
  "proofticket:evidence",
  "proofticket:deletion-requests",
  "mcp:server",
  "mcp:smoke",
  "github:webhook:demo",
  "smoke:redaction",
  "preflight:production",
];

const requiredReadmePhrases = [
  "Structured handoffs and proof-of-work receipts",
  "Five-minute local workflow",
  "Run the local MCP adapter",
  "Hosted alpha runbook",
  "API reference",
];

const forbiddenPattern = new RegExp(
  [
    "Kairos",
    "kairos",
    "KAIROS",
    "Ryan",
    "Colin",
    "DNP",
    "/home/yin",
    "DreamSiteBuilders",
    "καιρός",
    "ancient Greek",
    "coordinate\\.dev",
    "coordinate</Link>",
    ">coordinate<",
    "no MCP/A2A protocol adapter yet",
    "MCP/A2A adapter$",
    "agent action receipts$",
    "context manifests$",
    "Docker compose deployment$",
    "Postgres production profile$",
  ].join("|"),
  "m"
);
const scanRoots = [
  "README.md",
  "docs",
  "examples",
  "scripts",
  "src",
  "prisma",
  "package.json",
  "NEXT_TICKETS.md",
  "outputs",
  ".env.example",
  ".env.postgres.example",
  ".github",
];
const ignoredDirectories = new Set(["node_modules", ".next", ".git"]);

for (const file of requiredFiles) {
  if (!existsSync(resolve(root, file))) failures.push(`Missing required file: ${file}`);
}

const packageJson = JSON.parse(readFileSync(resolve(root, "package.json"), "utf8"));
for (const script of requiredScripts) {
  if (!packageJson.scripts?.[script]) failures.push(`Missing package script: ${script}`);
}

const readme = readFileSync(resolve(root, "README.md"), "utf8");
for (const phrase of requiredReadmePhrases) {
  if (!readme.includes(phrase)) failures.push(`README missing phrase: ${phrase}`);
}

const nextTickets = readFileSync(resolve(root, "NEXT_TICKETS.md"), "utf8");
for (const ticket of Array.from({ length: 14 }, (_, index) => index + 1)) {
  const heading = `## Ticket ${ticket}:`;
  if (!nextTickets.includes(heading)) failures.push(`NEXT_TICKETS missing ${heading}`);
}

for (const file of listScanFiles()) {
  const text = readFileSync(resolve(root, file), "utf8");
  if (forbiddenPattern.test(text)) failures.push(`Forbidden private/stale string found in: ${file}`);
}

if (failures.length > 0) {
  console.error("Demo readiness failed:");
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      checkedFileCount: requiredFiles.length,
      checkedScriptCount: requiredScripts.length,
    },
    null,
    2
  )
);

function listScanFiles() {
  return scanRoots.flatMap((entry) => walk(entry));
}

function walk(entry) {
  const path = resolve(root, entry);
  if (!existsSync(path)) return [];

  const stat = statSync(path);
  if (stat.isDirectory()) {
    if (ignoredDirectories.has(entry.split("/").pop() || "")) return [];
    return readdirSync(path).flatMap((child) => walk(`${entry}/${child}`));
  }

  if (!stat.isFile()) return [];
  if (entry.endsWith(".tsbuildinfo")) return [];
  if (entry === "scripts/check-demo-readiness.mjs") return [];
  if (isLikelyBinary(entry)) return [];
  return [entry];
}

function isLikelyBinary(entry) {
  return /\.(png|jpg|jpeg|gif|webp|ico|pdf|sqlite|db)$/i.test(entry);
}
