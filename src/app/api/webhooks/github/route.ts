import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { queueTicketCreatedDeliveries } from "@/lib/ticket-delivery";

type GitHubPayload = {
  action?: string;
  ref?: string;
  after?: string;
  repository?: {
    full_name?: string;
    html_url?: string;
    default_branch?: string;
  };
  sender?: {
    login?: string;
    html_url?: string;
  };
  pull_request?: {
    number?: number;
    title?: string;
    html_url?: string;
    head?: { ref?: string; sha?: string };
    base?: { ref?: string };
  };
  check_run?: {
    name?: string;
    conclusion?: string | null;
    status?: string;
    html_url?: string;
    head_sha?: string;
  };
  head_commit?: {
    id?: string;
    message?: string;
    url?: string;
  };
};

type MappedGitHubEvent = {
  kind: string;
  type: "PROPOSAL" | "STATUS";
  title: string;
  content: string;
  artifacts: Array<{ title: string; uri?: string; summary?: string | null } | null>;
};

export async function POST(req: NextRequest) {
  const rateLimit = checkRateLimit(req, {
    bucket: "api:webhooks:github",
    limit: 120,
    windowMs: 60_000,
  });
  if (rateLimit) return rateLimit;

  const secret = process.env.PROOFTICKET_GITHUB_WEBHOOK_SECRET;
  if (!secret) return NextResponse.json({ error: "GitHub webhook secret is not configured" }, { status: 401 });

  const rawBody = await req.text();
  if (!(await isValidSignature(rawBody, secret, req.headers.get("x-hub-signature-256")))) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const actor = await resolveActor(
    req.nextUrl.searchParams.get("actorUserId") || process.env.PROOFTICKET_GITHUB_ACTOR_USER_ID || undefined,
    req.nextUrl.searchParams.get("actorEmail") || process.env.PROOFTICKET_GITHUB_ACTOR_EMAIL || undefined
  );
  if (!actor) {
    return NextResponse.json(
      { error: "actorUserId/actorEmail or PROOFTICKET_GITHUB_ACTOR_* must identify an existing user" },
      { status: 400 }
    );
  }

  let payload: GitHubPayload;
  try {
    payload = JSON.parse(rawBody) as GitHubPayload;
  } catch {
    return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
  }

  const event = req.headers.get("x-github-event") || "unknown";
  const delivery = req.headers.get("x-github-delivery") || `${event}:${Date.now()}`;
  const mapped = mapGitHubEvent(event, payload);
  if (!mapped) {
    return NextResponse.json({ status: "ignored", event });
  }

  const idempotencyKey = `github:${delivery}`;
  const existing = await prisma.auditLog.findFirst({
    where: {
      action: "github.event.ticket.create",
      metadata: { contains: `"idempotencyKey":"${idempotencyKey}"` },
    },
    select: { entityId: true },
    orderBy: { createdAt: "desc" },
  });
  if (existing?.entityId) {
    return NextResponse.json({
      id: existing.entityId,
      idempotent: true,
      message: "Duplicate delivery; returning existing ticket.",
    });
  }

  const ticket = await prisma.ticket.create({
    data: {
      title: mapped.title,
      content: mapped.content,
      type: mapped.type,
      visibility: "PRIVATE",
      tags: JSON.stringify(["github", event, mapped.kind]),
      createdByAgent: true,
      approvedBy: actor.id,
      approvedAt: new Date(),
      authorId: actor.id,
    },
  });

  await prisma.ticketArtifact.createMany({
    data: mapped.artifacts.filter(isArtifact).map((artifact) => ({
      kind: "LINK",
      title: artifact.title,
      uri: artifact.uri,
      summary: artifact.summary,
      metadata: JSON.stringify({
        source: "github",
        event,
        delivery,
        repository: payload.repository?.full_name,
      }),
      ticketId: ticket.id,
      createdById: actor.id,
    })),
  });

  await queueTicketCreatedDeliveries({
    ticketId: ticket.id,
    authorId: actor.id,
    title: ticket.title,
    content: ticket.content,
    bridgeId: null,
  });

  await writeAuditLog({
    actorUserId: actor.id,
    action: "github.event.ticket.create",
    entityType: "ticket",
    entityId: ticket.id,
    metadata: {
      idempotencyKey,
      event,
      delivery,
      repository: payload.repository?.full_name,
      action: payload.action,
      kind: mapped.kind,
    },
    req,
  });

  return NextResponse.json({ id: ticket.id, status: "created", event }, { status: 201 });
}

function mapGitHubEvent(event: string, payload: GitHubPayload): MappedGitHubEvent | null {
  const repo = payload.repository?.full_name || "unknown repository";
  const repoUrl = payload.repository?.html_url;
  const sender = payload.sender?.login || "GitHub";

  if (event === "pull_request" && payload.pull_request) {
    const pr = payload.pull_request;
    return {
      kind: "pull_request",
      type: "PROPOSAL",
      title: `Review PR #${pr.number}: ${pr.title || "Untitled pull request"}`,
      content: [
        `${sender} ${payload.action || "updated"} a pull request in ${repo}.`,
        "",
        `Branch: ${pr.head?.ref || "unknown"} -> ${pr.base?.ref || "unknown"}`,
        pr.head?.sha ? `Head SHA: ${pr.head.sha}` : null,
        "",
        "Review this when you have time and decide whether it should move forward.",
      ].filter(Boolean).join("\n"),
      artifacts: [
        { title: `Pull request #${pr.number}`, uri: pr.html_url, summary: pr.title || null },
        repoUrl ? { title: "Repository", uri: repoUrl, summary: repo } : null,
      ].filter(isArtifact),
    };
  }

  if (event === "check_run" && payload.check_run) {
    const check = payload.check_run;
    return {
      kind: "check_run",
      type: check.conclusion === "failure" ? "PROPOSAL" : "STATUS",
      title: `GitHub check ${check.conclusion || check.status || "updated"}: ${check.name || repo}`,
      content: [
        `GitHub reported a check update in ${repo}.`,
        "",
        `Check: ${check.name || "unknown"}`,
        `Status: ${check.status || "unknown"}`,
        `Conclusion: ${check.conclusion || "none"}`,
        check.head_sha ? `Head SHA: ${check.head_sha}` : null,
      ].filter(Boolean).join("\n"),
      artifacts: [
        { title: check.name || "Check run", uri: check.html_url, summary: check.conclusion || check.status || null },
        repoUrl ? { title: "Repository", uri: repoUrl, summary: repo } : null,
      ].filter(isArtifact),
    };
  }

  if (event === "push") {
    const branch = payload.ref?.replace(/^refs\/heads\//, "") || "unknown branch";
    return {
      kind: "push",
      type: "STATUS",
      title: `Branch pushed: ${repo}/${branch}`,
      content: [
        `${sender} pushed to ${branch} in ${repo}.`,
        payload.after ? `After SHA: ${payload.after}` : null,
        payload.head_commit?.message ? `Latest commit: ${payload.head_commit.message}` : null,
      ].filter(Boolean).join("\n"),
      artifacts: [
        payload.head_commit?.url
          ? { title: "Head commit", uri: payload.head_commit.url, summary: payload.head_commit.message || null }
          : null,
        repoUrl ? { title: "Repository", uri: repoUrl, summary: repo } : null,
      ].filter(isArtifact),
    };
  }

  return null;
}

function isArtifact(value: unknown): value is { title: string; uri?: string; summary?: string | null } {
  return Boolean(
    value &&
      typeof value === "object" &&
      "title" in value &&
      typeof (value as { title?: unknown }).title === "string"
  );
}

async function resolveActor(actorUserId?: string, actorEmail?: string) {
  if (actorUserId) {
    const user = await prisma.user.findUnique({ where: { id: actorUserId }, select: { id: true } });
    if (user) return user;
  }

  if (actorEmail) {
    const user = await prisma.user.findUnique({ where: { email: actorEmail }, select: { id: true } });
    if (user) return user;
  }

  return null;
}

async function isValidSignature(body: string, secret: string, signature: string | null) {
  if (!signature?.startsWith("sha256=")) return false;

  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const digest = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  const expected = `sha256=${Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("")}`;

  return constantTimeEqual(expected, signature);
}

function constantTimeEqual(left: string, right: string) {
  if (left.length !== right.length) return false;

  let result = 0;
  for (let index = 0; index < left.length; index += 1) {
    result |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return result === 0;
}
