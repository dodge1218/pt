import { parseJsonArray } from "./utils";
/**
 * AI Inference Layer
 * 
 * Uses Groq for fast summaries and Gemini for deeper analysis (thinking profiles).
 * All AI calls are for assisting humans — never auto-posting.
 */

import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/**
 * Generate a 2-sentence summary of a ticket
 * Used for smart delivery previews and feed cards
 */
export async function summarizeTicket(title: string, content: string): Promise<string> {
  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content:
          "Summarize the following ticket in exactly 2 sentences. Be direct, no filler. Capture the core ask or information. Write like you're texting a friend who's busy.",
      },
      {
        role: "user",
        content: `Title: ${title}\n\n${content}`,
      },
    ],
    max_tokens: 150,
    temperature: 0.3,
  });

  return response.choices[0]?.message?.content || "No summary available.";
}

/**
 * Generate a suggested response to a ticket
 * Uses Voice Handshake: adapts to the RECIPIENT's communication preferences
 * Returns draft text for human review — never auto-posts
 */
export async function draftResponse(
  ticketTitle: string,
  ticketContent: string,
  userContext: string, // brief description of user's perspective/role
  position?: string,
  voiceInstructions?: string // from buildVoicePrompt() in voice.ts
): Promise<string> {
  const voiceBlock = voiceInstructions
    ? `\n\nIMPORTANT — Write this in the style the RECIPIENT prefers:\n${voiceInstructions}`
    : "";

  const response = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",
    messages: [
      {
        role: "system",
        content: `You're drafting a response to a ticket for a human to review and edit before posting. 
Write in their voice — direct, no corporate speak, no filler.
${position ? `Their position is: ${position}` : "Determine the most honest position."}
Keep it under 3 paragraphs. Be specific. If you need more info, say so.
This is a DRAFT. The human will edit it. Don't be perfect — be honest.${voiceBlock}`,
      },
      {
        role: "user",
        content: `Context about me: ${userContext}\n\nTicket: ${ticketTitle}\n\n${ticketContent}`,
      },
    ],
    max_tokens: 500,
    temperature: 0.5,
  });

  return response.choices[0]?.message?.content || "";
}

/**
 * Analyze a user's public tickets and responses to build a thinking profile
 * Used for cofounder matching
 */
export async function analyzeThinkingPattern(
  tickets: Array<{ title: string; content: string; type: string; tags: string }>,
  responses: Array<{ content: string; position: string }>
): Promise<{
  breadthScore: number;
  depthScore: number;
  synthesisScore: number;
  velocityScore: number;
  strategicAlignment: number;
  domains: string;
  bridges: string;
}> {
  // Use Gemini for deeper analysis (larger context, better reasoning)
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY required for thinking profile analysis");
  }

  const payload = {
    contents: [
      {
        parts: [
          {
            text: `Analyze this person's thinking patterns based on their tickets and responses.

TICKETS:
${tickets.map((t) => `[${t.type}] ${t.title} (tags: ${parseJsonArray(t.tags).join(", ")})\n${t.content}`).join("\n---\n")}

RESPONSES:
${responses.map((r) => `[${r.position}] ${r.content}`).join("\n---\n")}

Return a JSON object with:
- breadthScore (0-1): how many distinct domains they work across
- depthScore (0-1): how deep they go in each domain (evidence of expertise vs surface level)
- synthesisScore (0-1): ability to connect ideas across domains
- velocityScore (0-1): speed of ideation and execution (based on ticket volume and action-orientation)
- strategicAlignment (0-1): strategic timing orientation vs linear/chronological thinking
- domains: array of domain strings they operate in
- bridges: array of "domain1+domain2" cross-domain connections they make

Be rigorous. Low scores are fine. Only JSON, no explanation.`,
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.2,
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

  return JSON.parse(text);
}

/**
 * Score compatibility between two thinking profiles
 */
export function scoreMatch(
  profile1: {
    breadthScore: number;
    depthScore: number;
    synthesisScore: number;
    domains: string;
    bridges: string;
    passionIntensity?: number;
  },
  profile2: {
    breadthScore: number;
    depthScore: number;
    synthesisScore: number;
    domains: string;
    bridges: string;
    passionIntensity?: number;
  }
): {
  score: number;
  sharedDomains: string[];
  complementaryGaps: string[];
  thinkingOverlap: number;
  domainDiversity: number;
  rationale: string;
} {
  // Shared domains
  const d1 = parseJsonArray(profile1.domains);
  const d2 = parseJsonArray(profile2.domains);
  const shared = d1.filter((d) =>
    d2.includes(d)
  );

  // Complementary: domains one has that the other doesn't
  const only1 = d1.filter((d) => !d2.includes(d));
  const only2 = d2.filter((d) => !d1.includes(d));
  const complementary = [...only1, ...only2];

  // Thinking overlap: how similarly they approach problems
  const thinkingOverlap =
    1 -
    (Math.abs(profile1.breadthScore - profile2.breadthScore) +
      Math.abs(profile1.depthScore - profile2.depthScore) +
      Math.abs(profile1.synthesisScore - profile2.synthesisScore)) /
      3;

  // Domain diversity: high = very different backgrounds
  const allDomains = new Set([...profile1.domains, ...profile2.domains]);
  const domainDiversity = 1 - shared.length / allDomains.size;

  // Passion alignment: both have similar intensity levels
  const passionAlignment = 1 - Math.abs(
    (profile1.passionIntensity || 0.5) - (profile2.passionIntensity || 0.5)
  );

  // Best matches: similar thinking style + different domain expertise + passion alignment
  const score = Math.round(
    (thinkingOverlap * 35 + domainDiversity * 30 + (shared.length > 0 ? 20 : 0) + passionAlignment * 15) 
  );

  const rationale = generateMatchRationale(
    shared,
    complementary,
    thinkingOverlap,
    domainDiversity
  );

  return {
    score: Math.min(100, Math.max(0, score)),
    sharedDomains: shared,
    complementaryGaps: complementary,
    thinkingOverlap,
    domainDiversity,
    rationale,
  };
}

function generateMatchRationale(
  shared: string[],
  complementary: string[],
  overlap: number,
  diversity: number
): string {
  const parts: string[] = [];

  if (overlap > 0.7) {
    parts.push("You think about problems in very similar ways");
  } else if (overlap > 0.4) {
    parts.push("You have complementary thinking approaches");
  }

  if (shared.length > 0) {
    parts.push(`shared ground in ${shared.join(", ")}`);
  }

  if (diversity > 0.6 && complementary.length > 0) {
    parts.push(
      `they bring ${complementary.slice(0, 3).join(", ")} which you don't have`
    );
  }

  return parts.join(" — ") + ".";
}
