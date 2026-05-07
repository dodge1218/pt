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
const endpoint = new URL("/api/health", baseUrl);

try {
  const response = await fetch(endpoint);
  const text = await response.text();
  let body;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text };
  }

  if (!response.ok || body.ok !== true) {
    console.error(JSON.stringify({ ok: false, status: response.status, body }, null, 2));
    process.exit(1);
  }

  if (args.json) {
    console.log(JSON.stringify({ ok: true, status: response.status, body }, null, 2));
  } else {
    console.log(`Kairos health ok: database=${body.database}, latency=${body.latencyMs}ms`);
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
    else {
      console.error(`Unknown argument: ${arg}`);
      process.exit(1);
    }
  }
  return parsed;
}

function printHelp() {
  console.log(`Check Kairos runtime health.

Usage:
  npm run health
  npm run health -- --url http://localhost:3030
  npm run health -- --url http://localhost:3030 --json

Optional env:
  KAIROS_BASE_URL=http://localhost:3000
`);
}
