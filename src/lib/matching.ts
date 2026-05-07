import { parseJsonArray } from "./utils";
/**
 * Cofounder Matching Engine
 * 
 * Matches builders based on thinking patterns (cognitive analysis), not just skills.
 * Uses public ticket analysis + explicit profile data.
 */

import { prisma } from "./prisma";
import { analyzeThinkingPattern, scoreMatch } from "./ai";

/**
 * Refresh a user's thinking profile based on their public tickets
 */
export async function refreshThinkingProfile(userId: string) {
  // Get user's public tickets and responses
  const tickets = await prisma.ticket.findMany({
    where: {
      authorId: userId,
      visibility: "PUBLIC",
      deletedAt: null,
    },
    select: {
      title: true,
      content: true,
      type: true,
      tags: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50, // Last 50 public tickets
  });

  const responses = await prisma.response.findMany({
    where: {
      authorId: userId,
      deletedAt: null,
      ticket: { visibility: "PUBLIC" },
    },
    select: {
      content: true,
      position: true,
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  if (tickets.length < 3) {
    // Not enough data to analyze
    return null;
  }

  // Run pattern-style analysis via Gemini
  const analysis = await analyzeThinkingPattern(tickets, responses);

  // Upsert thinking profile
  return prisma.thinkingProfile.upsert({
    where: { userId },
    create: {
      userId,
      ...analysis,
      rawAnalysis: JSON.stringify(analysis),
      analyzedAt: new Date(),
    },
    update: {
      ...analysis,
      rawAnalysis: JSON.stringify(analysis),
      analyzedAt: new Date(),
    },
  });
}

/**
 * Generate match suggestions for a user
 */
export async function generateMatches(userId: string, limit: number = 10) {
  const userProfile = await prisma.thinkingProfile.findUnique({
    where: { userId },
  });

  if (!userProfile) {
    throw new Error("No thinking profile. Need at least 3 public tickets.");
  }

  // Get all other users with thinking profiles
  const candidates = await prisma.thinkingProfile.findMany({
    where: {
      userId: { not: userId },
      analyzedAt: { not: null },
    },
    include: {
      user: {
        select: { id: true, name: true, headline: true, image: true },
      },
    },
  });

  // Score each candidate
  const scored = candidates
    .map((candidate) => {
      const matchResult = scoreMatch(
        {
          breadthScore: userProfile.breadthScore || 0,
          depthScore: userProfile.depthScore || 0,
          synthesisScore: userProfile.synthesisScore || 0,
          domains: JSON.stringify(parseJsonArray(userProfile.domains)),
          bridges: JSON.stringify(parseJsonArray(userProfile.bridges)),
        },
        {
          breadthScore: candidate.breadthScore || 0,
          depthScore: candidate.depthScore || 0,
          synthesisScore: candidate.synthesisScore || 0,
          domains: JSON.stringify(parseJsonArray(candidate.domains)),
          bridges: JSON.stringify(parseJsonArray(candidate.bridges)),
        }
      );

      return {
        user: candidate.user,
        ...matchResult,
      };
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);

  // Upsert match records
  for (const match of scored) {
    const [u1, u2] = [userId, match.user.id].sort();
    await prisma.match.upsert({
      where: { user1Id_user2Id: { user1Id: u1, user2Id: u2 } },
      create: {
        user1Id: u1,
        user2Id: u2,
        score: match.score,
        rationale: match.rationale,
        sharedDomains: JSON.stringify(match.sharedDomains),
        complementaryGaps: JSON.stringify(match.complementaryGaps),
        thinkingOverlap: match.thinkingOverlap,
        domainDiversity: match.domainDiversity,
      },
      update: {
        score: match.score,
        rationale: match.rationale,
        sharedDomains: JSON.stringify(match.sharedDomains),
        complementaryGaps: JSON.stringify(match.complementaryGaps),
        thinkingOverlap: match.thinkingOverlap,
        domainDiversity: match.domainDiversity,
      },
    });
  }

  return scored;
}
