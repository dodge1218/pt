/**
 * Prompt Dump Analyzer
 * 
 * "The more data you give us, the better we can match you 
 *  with a cofounder that has your amount of passion about what you do."
 * 
 * Analyzes ChatGPT/Claude exports to extract:
 * - Domain distribution (what they care about)
 * - Passion intensity (how MUCH they care — frequency × depth)
 * - Cross-domain links (how they connect ideas)
 * - Thinking velocity (how fast they iterate)
 * 
 * We analyze patterns, not content. Raw prompts are NEVER stored.
 */

import { prisma } from "./prisma";

interface PromptEntry {
  role: "user" | "assistant";
  content: string;
  timestamp?: string;
}

interface ChatGPTExport {
  title: string;
  mapping: Record<string, { message?: { content?: { parts?: string[] }; author?: { role?: string }; create_time?: number } }>;
}

interface AnalysisResult {
  totalPrompts: number;
  dateRange: string;
  domainBreakdown: Record<string, number>;
  passionScores: Record<string, number>;
  crossDomainLinks: Array<{ from: string; to: string; count: number }>;
  overallPassionIntensity: number;
}

/**
 * Parse ChatGPT export JSON into prompt entries
 */
export function parseChatGPTExport(data: ChatGPTExport[]): PromptEntry[] {
  const entries: PromptEntry[] = [];

  for (const conversation of data) {
    if (!conversation.mapping) continue;

    for (const node of Object.values(conversation.mapping)) {
      const msg = node?.message;
      if (!msg?.content?.parts || msg.author?.role !== "user") continue;

      const content = msg.content.parts.join("\n");
      if (content.length < 10) continue; // Skip tiny messages

      entries.push({
        role: "user",
        content,
        timestamp: msg.create_time
          ? new Date(msg.create_time * 1000).toISOString()
          : undefined,
      });
    }
  }

  return entries;
}

/**
 * Analyze prompt entries using Gemini for domain classification
 * Returns patterns, never stores raw content
 */
export async function analyzePromptDump(
  entries: PromptEntry[]
): Promise<AnalysisResult> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) throw new Error("GEMINI_API_KEY required");

  // Sample if too many (keep analysis fast + cheap)
  const sampled = entries.length > 200
    ? entries.sort(() => Math.random() - 0.5).slice(0, 200)
    : entries;

  // Build analysis prompt — we send content for analysis but DON'T store it
  const promptSummaries = sampled.map((e, i) =>
    `[${i + 1}] (${e.timestamp?.split("T")[0] || "unknown date"}) ${e.content.substring(0, 300)}`
  ).join("\n");

  const payload = {
    contents: [{
      parts: [{
        text: `Analyze these ${sampled.length} user prompts (sampled from ${entries.length} total) to extract PATTERNS about the person's thinking. Do NOT store or reproduce the prompts.

PROMPTS:
${promptSummaries}

Return JSON:
{
  "domainBreakdown": {"domain_name": count, ...},  // How many prompts per domain (ML, web dev, crypto, health, etc.)
  "passionScores": {"domain_name": 0.0-1.0, ...},  // Passion = frequency × depth × recurrence. 1.0 = deeply obsessed.
  "crossDomainLinks": [{"from": "domain1", "to": "domain2", "count": N}, ...],  // When a single prompt bridges two domains
  "overallPassionIntensity": 0.0-1.0  // How intense is this person overall? Daily heavy user = 0.9+, casual = 0.2
}

Be rigorous. Only JSON.`
      }]
    }],
    generationConfig: {
      temperature: 0.1,
      responseMimeType: "application/json",
    },
  };

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }
  );

  const data = await res.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) throw new Error("No response from Gemini");

  const analysis = JSON.parse(text);

  // Compute date range
  const dates = entries
    .filter((e) => e.timestamp)
    .map((e) => e.timestamp!)
    .sort();
  const dateRange = dates.length > 0
    ? `${dates[0].split("T")[0]} to ${dates[dates.length - 1].split("T")[0]}`
    : "unknown";

  return {
    totalPrompts: entries.length,
    dateRange,
    ...analysis,
  };
}

/**
 * Process an uploaded prompt dump for a user
 * Analyzes patterns, stores results, discards raw content
 */
export async function processPromptDump(
  dumpId: string,
  entries: PromptEntry[]
) {
  // Mark as analyzing
  await prisma.promptDump.update({
    where: { id: dumpId },
    data: { status: "ANALYZING" },
  });

  try {
    const analysis = await analyzePromptDump(entries);

    // Store ONLY the analysis — never the raw prompts
    await prisma.promptDump.update({
      where: { id: dumpId },
      data: {
        status: "COMPLETE",
        totalPrompts: analysis.totalPrompts,
        dateRange: analysis.dateRange,
        domainBreakdown: JSON.stringify(analysis.domainBreakdown),
        passionScores: JSON.stringify(analysis.passionScores),
        crossDomainLinks: JSON.stringify(analysis.crossDomainLinks),
        rawStored: false, // NEVER true in production
        analyzedAt: new Date(),
      },
    });

    // Update user's thinking profile with passion intensity
    const dump = await prisma.promptDump.findUnique({
      where: { id: dumpId },
      select: { userId: true },
    });

    if (dump) {
      await prisma.thinkingProfile.upsert({
        where: { userId: dump.userId },
        create: {
          userId: dump.userId,
          passionIntensity: analysis.overallPassionIntensity,
          domains: JSON.stringify(Object.keys(analysis.domainBreakdown)),
          bridges: JSON.stringify(analysis.crossDomainLinks.map(
            (l) => `${l.from}+${l.to}`
          )),
        },
        update: {
          passionIntensity: analysis.overallPassionIntensity,
          domains: JSON.stringify(Object.keys(analysis.domainBreakdown)),
                    bridges: JSON.stringify(analysis.crossDomainLinks.map(
            (l) => `${l.from}+${l.to}`
          )),
          updatedAt: new Date(),
        },
      });
    }

    return analysis;
  } catch (error) {
    await prisma.promptDump.update({
      where: { id: dumpId },
      data: { status: "FAILED" },
    });
    throw error;
  }
}
