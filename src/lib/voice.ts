/**
 * Voice Handshake System
 * 
 * When two people collaborate, the system adapts HOW it presents information
 * based on the RECIPIENT's preferences — not the sender's style.
 * 
 * "Not how do I talk — how does my collaborator want to hear things."
 */

import { prisma } from "./prisma";
import type { CommLength, CommStructure, Formality } from "@prisma/client";

interface VoicePreferences {
  prefersLength: CommLength;
  prefersStructure: CommStructure;
  prefersBottomLine: boolean;
  prefersContext: boolean;
  prefersFormality: Formality;
  customNotes: string | null;
}

/**
 * Get the voice preferences to use when writing FROM one user TO another.
 * Returns the recipient's preferences, with any pair-specific overrides applied.
 */
export async function getVoiceForPair(
  fromUserId: string,
  toUserId: string
): Promise<VoicePreferences> {
  // Get recipient's base voice preferences
  const recipientVoice = await prisma.voiceProfile.findUnique({
    where: { userId: toUserId },
  });

  // Get pair-specific overrides
  const pairVoice = await prisma.collaborationVoice.findUnique({
    where: {
      forUserId_fromUserId: {
        forUserId: toUserId,
        fromUserId: fromUserId,
      },
    },
  });

  // Defaults if no voice profile exists
  const defaults: VoicePreferences = {
    prefersLength: "MEDIUM",
    prefersStructure: "MIXED",
    prefersBottomLine: true,
    prefersContext: true,
    prefersFormality: "CASUAL",
    customNotes: null,
  };

  if (!recipientVoice) return defaults;

  // Apply pair-specific overrides on top of recipient preferences
  return {
    prefersLength: pairVoice?.overrideLength || recipientVoice.prefersLength,
    prefersStructure: pairVoice?.overrideStructure || recipientVoice.prefersStructure,
    prefersBottomLine: recipientVoice.prefersBottomLine,
    prefersContext: recipientVoice.prefersContext,
    prefersFormality: pairVoice?.overrideFormality || recipientVoice.prefersFormality,
    customNotes: pairVoice?.customInstructions || recipientVoice.customNotes,
  };
}

/**
 * Build a system prompt for the AI when drafting content for a specific recipient.
 * This makes the agent write in the way the recipient WANTS to receive information.
 */
export function buildVoicePrompt(prefs: VoicePreferences): string {
  const parts: string[] = [];

  // Length
  switch (prefs.prefersLength) {
    case "SHORT":
      parts.push("Keep it extremely brief — 1-3 sentences max. No context unless asked.");
      break;
    case "LONG":
      parts.push("Include full context and reasoning. They want to understand the WHY, not just the WHAT.");
      break;
    default:
      parts.push("1-2 short paragraphs. Enough context to understand, not so much it's overwhelming.");
  }

  // Structure
  switch (prefs.prefersStructure) {
    case "BULLETS":
      parts.push("Use bullet points and lists. They scan, not read.");
      break;
    case "PROSE":
      parts.push("Write in flowing paragraphs. No bullet points — they find them impersonal.");
      break;
    default:
      parts.push("Mix prose and bullets as needed.");
  }

  // Bottom line
  if (prefs.prefersBottomLine) {
    parts.push("Lead with the conclusion/recommendation. Supporting details after.");
  } else {
    parts.push("Build up to the conclusion. Context first, then recommendation.");
  }

  // Context
  if (!prefs.prefersContext) {
    parts.push("Skip the reasoning unless they ask. Just the action items.");
  }

  // Formality
  switch (prefs.prefersFormality) {
    case "FORMAL":
      parts.push("Professional tone. Complete sentences. No slang or emoji.");
      break;
    case "CASUAL":
      parts.push("Casual and direct. Write like texting a smart friend.");
      break;
    case "MATCH_MINE":
      parts.push("Match the tone of the message you're responding to.");
      break;
  }

  // Custom notes
  if (prefs.customNotes) {
    parts.push(`Additional preferences: ${prefs.customNotes}`);
  }

  return parts.join("\n");
}

/**
 * Run the introduction handshake for two new collaborators.
 * Returns the questions to ask each person.
 */
export function getHandshakeQuestions(): Array<{
  id: string;
  question: string;
  options: Array<{ value: string; label: string }>;
}> {
  return [
    {
      id: "length",
      question: "How much detail do you want in messages from collaborators?",
      options: [
        { value: "SHORT", label: "Just the headlines — 1-3 sentences" },
        { value: "MEDIUM", label: "Enough context to decide — a few paragraphs" },
        { value: "LONG", label: "Full context with reasoning — I want to understand everything" },
      ],
    },
    {
      id: "structure",
      question: "How do you prefer information organized?",
      options: [
        { value: "BULLETS", label: "Bullet points and lists — easy to scan" },
        { value: "PROSE", label: "Written out in paragraphs — feels more natural" },
        { value: "MIXED", label: "Whatever fits the content" },
      ],
    },
    {
      id: "bottomLine",
      question: "Where should the main point go?",
      options: [
        { value: "true", label: "Lead with it — tell me the answer first" },
        { value: "false", label: "Build up to it — I want the context first" },
      ],
    },
    {
      id: "formality",
      question: "What tone works best for you?",
      options: [
        { value: "FORMAL", label: "Professional and structured" },
        { value: "CASUAL", label: "Casual and direct — like texting a friend" },
        { value: "MATCH_MINE", label: "Mirror my style — match what I send you" },
      ],
    },
  ];
}

/**
 * Process handshake responses and create/update voice profile
 */
export async function processHandshake(
  userId: string,
  responses: Record<string, string>
) {
  return prisma.voiceProfile.upsert({
    where: { userId },
    create: {
      userId,
      prefersLength: (responses.length as CommLength) || "MEDIUM",
      prefersStructure: (responses.structure as CommStructure) || "MIXED",
      prefersBottomLine: responses.bottomLine === "true",
      prefersContext: true,
      prefersFormality: (responses.formality as Formality) || "CASUAL",
    },
    update: {
      prefersLength: (responses.length as CommLength) || undefined,
      prefersStructure: (responses.structure as CommStructure) || undefined,
      prefersBottomLine: responses.bottomLine ? responses.bottomLine === "true" : undefined,
      prefersFormality: (responses.formality as Formality) || undefined,
    },
  });
}
