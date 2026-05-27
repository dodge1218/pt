import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { redactValue } from "@/lib/redact";

type JsonFallback = Record<string, unknown> | unknown[];
type AccountExportUser = Prisma.UserGetPayload<{
  select: {
    id: true;
    name: true;
    email: true;
    emailVerified: true;
    image: true;
    bio: true;
    headline: true;
    website: true;
    github: true;
    twitter: true;
    timezone: true;
    activeStart: true;
    activeEnd: true;
    deliveryMode: true;
    createdAt: true;
    updatedAt: true;
    voiceProfile: true;
    thinkingProfile: true;
  };
}>;

export async function buildAccountExport(userId: string) {
  const [
    user,
    tickets,
    responses,
    comments,
    artifacts,
    bridgeMemberships,
    projects,
    projectContributions,
    agents,
    deliveries,
    auditLogs,
    promptDumps,
    interests,
    matches,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        emailVerified: true,
        image: true,
        bio: true,
        headline: true,
        website: true,
        github: true,
        twitter: true,
        timezone: true,
        activeStart: true,
        activeEnd: true,
        deliveryMode: true,
        createdAt: true,
        updatedAt: true,
        voiceProfile: true,
        thinkingProfile: true,
      },
    }),
    prisma.ticket.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        title: true,
        content: true,
        summary: true,
        type: true,
        status: true,
        visibility: true,
        businessValue: true,
        riskLevel: true,
        tags: true,
        createdByAgent: true,
        agentProxyId: true,
        approvedBy: true,
        approvedAt: true,
        bridgeId: true,
        projectId: true,
        likes: true,
        bookmarks: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.response.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        position: true,
        createdByAgent: true,
        agentProxyId: true,
        approvedBy: true,
        approvedAt: true,
        ticketId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.comment.findMany({
      where: { authorId: userId },
      select: {
        id: true,
        content: true,
        createdByAgent: true,
        agentProxyId: true,
        approvedBy: true,
        approvedAt: true,
        responseId: true,
        createdAt: true,
        updatedAt: true,
        deletedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.ticketArtifact.findMany({
      where: { createdById: userId },
      select: {
        id: true,
        kind: true,
        title: true,
        uri: true,
        summary: true,
        metadata: true,
        provider: true,
        model: true,
        inputTokens: true,
        outputTokens: true,
        contextSavedTokens: true,
        costUsd: true,
        ticketId: true,
        createdAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.bridgeMember.findMany({
      where: { userId },
      select: {
        id: true,
        role: true,
        bridgeId: true,
        joinedAt: true,
        bridge: { select: { id: true, name: true, createdAt: true, updatedAt: true } },
      },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.project.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        status: true,
        repoUrl: true,
        websiteUrl: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.projectContributor.findMany({
      where: { userId },
      select: { id: true, role: true, projectId: true, joinedAt: true },
      orderBy: { joinedAt: "asc" },
    }),
    prisma.agentProxy.findMany({
      where: { ownerId: userId },
      select: {
        id: true,
        name: true,
        description: true,
        apiKey: true,
        canCreateTickets: true,
        canRespond: true,
        canComment: true,
        requiresApproval: true,
        createdAt: true,
        updatedAt: true,
        pendingActions: {
          select: {
            id: true,
            type: true,
            status: true,
            payload: true,
            resultId: true,
            createdAt: true,
            resolvedAt: true,
          },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "asc" },
    }),
    prisma.smartDelivery.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.auditLog.findMany({
      where: { actorUserId: userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.promptDump.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.userInterest.findMany({
      where: { userId },
      orderBy: { createdAt: "asc" },
    }),
    prisma.match.findMany({
      where: { OR: [{ user1Id: userId }, { user2Id: userId }] },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  if (!user) return null;

  const bundle = {
    schema: "proofticket.account_export.v1",
    exportedAt: new Date().toISOString(),
    user: serializeUser(user),
    tickets: tickets.map((ticket) => ({
      ...serializeDates(ticket),
      tags: parseJson(ticket.tags, []),
    })),
    responses: responses.map(serializeDates),
    comments: comments.map(serializeDates),
    artifacts: artifacts.map((artifact) => ({
      ...serializeDates(artifact),
      metadata: parseJson(artifact.metadata, {}),
    })),
    bridges: bridgeMemberships.map(serializeDates),
    projects: projects.map(serializeDates),
    projectContributions: projectContributions.map(serializeDates),
    agents: agents.map((agent) => ({
      ...serializeDates({
        ...agent,
        apiKeyDigestPrefix: agent.apiKey.slice(0, 12),
        apiKey: undefined,
        pendingActions: undefined,
      }),
      actions: agent.pendingActions.map((action) => ({
        ...serializeDates(action),
        payload: parseJson(action.payload, { raw: action.payload }),
      })),
    })),
    deliveries: deliveries.map(serializeDates),
    audit: auditLogs.map((log) => ({
      ...serializeDates(log),
      metadata: parseJson(log.metadata, {}),
    })),
    promptDumps: promptDumps.map((dump) => ({
      ...serializeDates(dump),
      domainBreakdown: parseJson(dump.domainBreakdown, {}),
      passionScores: parseJson(dump.passionScores, {}),
      thinkingPatterns: parseJson(dump.thinkingPatterns, {}),
      crossDomainLinks: parseJson(dump.crossDomainLinks, []),
    })),
    interests: interests.map(serializeDates),
    matches: matches.map((match) => ({
      ...serializeDates(match),
      sharedDomains: parseJson(match.sharedDomains, []),
      complementaryGaps: parseJson(match.complementaryGaps, []),
    })),
    summary: {
      ticketCount: tickets.length,
      responseCount: responses.length,
      commentCount: comments.length,
      artifactCount: artifacts.length,
      bridgeCount: bridgeMemberships.length,
      projectCount: projects.length,
      agentCount: agents.length,
      deliveryCount: deliveries.length,
      auditEventCount: auditLogs.length,
    },
  };

  return redactValue(bundle);
}

function serializeUser(user: AccountExportUser) {
  return {
    ...serializeDates(user),
    thinkingProfile: user.thinkingProfile
      ? {
          ...serializeDates(user.thinkingProfile),
          domains: parseJson(user.thinkingProfile.domains, []),
          bridges: parseJson(user.thinkingProfile.bridges, []),
          rawAnalysis: parseJson(user.thinkingProfile.rawAnalysis, {}),
        }
      : null,
  };
}

function serializeDates<T>(value: T): T {
  if (value instanceof Date) return value.toISOString() as T;
  if (Array.isArray(value)) return value.map(serializeDates) as T;
  if (!value || typeof value !== "object") return value;

  return Object.fromEntries(
    Object.entries(value)
      .filter(([, entry]) => entry !== undefined)
      .map(([key, entry]) => [key, serializeDates(entry)])
  ) as T;
}

function parseJson(value: string | null | undefined, fallback: JsonFallback) {
  if (!value) return fallback;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}
