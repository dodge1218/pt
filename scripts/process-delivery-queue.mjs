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

const baseUrl =
  process.env.KAIROS_BASE_URL ||
  process.env.AUTH_URL ||
  process.env.NEXTAUTH_URL ||
  "http://localhost:3000";
const cronSecret = process.env.KAIROS_CRON_SECRET;

if (!cronSecret) {
  console.error("KAIROS_CRON_SECRET is required to process the delivery queue.");
  process.exit(1);
}

const endpoint = new URL("/api/kairos/queue", baseUrl);

try {
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cronSecret}`,
      "Content-Type": "application/json",
    },
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
