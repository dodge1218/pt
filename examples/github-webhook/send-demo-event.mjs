#!/usr/bin/env node

import { createHmac } from "node:crypto";
import { readFileSync } from "node:fs";

const secret = process.env.PROOFTICKET_GITHUB_WEBHOOK_SECRET;
const actorEmail = process.env.PROOFTICKET_ACTOR_EMAIL || process.env.PROOFTICKET_GITHUB_ACTOR_EMAIL;
const baseUrl = process.env.PROOFTICKET_BASE_URL || "http://localhost:3000";

if (!secret) {
  console.error("PROOFTICKET_GITHUB_WEBHOOK_SECRET is required.");
  process.exit(1);
}
if (!actorEmail) {
  console.error("PROOFTICKET_ACTOR_EMAIL or PROOFTICKET_GITHUB_ACTOR_EMAIL is required.");
  process.exit(1);
}

const body = readFileSync("examples/github-webhook/pull-request-opened.json", "utf8");
const signature = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
const delivery = `demo-${Date.now()}`;
const url = new URL("/api/webhooks/github", baseUrl);
url.searchParams.set("actorEmail", actorEmail);

const response = await fetch(url, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-github-event": "pull_request",
    "x-github-delivery": delivery,
    "x-hub-signature-256": signature,
  },
  body,
});

const text = await response.text();
let parsed;
try {
  parsed = text ? JSON.parse(text) : {};
} catch {
  parsed = { raw: text };
}

console.log(JSON.stringify({ status: response.status, body: parsed }, null, 2));
if (!response.ok) process.exit(1);
