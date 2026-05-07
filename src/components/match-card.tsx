"use client";

import { ThinkingRadar } from "./thinking-radar";
import { parseJsonArray } from "@/lib/utils";

interface MatchCardProps {
  match: {
    id: string;
    score: number;
    rationale: string;
    sharedDomains: string;
    complementaryGaps: string;
    thinkingOverlap: number;
    domainDiversity: number;
    status: string;
    otherUser: {
      id: string;
      name: string | null;
      image: string | null;
      github: string | null;
      headline?: string | null;
    };
  };
  userProfile?: {
    breadthScore?: number | null;
    depthScore?: number | null;
    synthesisScore?: number | null;
    velocityScore?: number | null;
    strategicAlignment?: number | null;
  } | null;
  otherProfile?: {
    breadthScore?: number | null;
    depthScore?: number | null;
    synthesisScore?: number | null;
    velocityScore?: number | null;
    strategicAlignment?: number | null;
  } | null;
  onConnect?: (matchId: string) => void;
  onDismiss?: (matchId: string) => void;
}

export function MatchCard({ match, userProfile, otherProfile, onConnect, onDismiss }: MatchCardProps) {
  const shared = parseJsonArray(match.sharedDomains);
  const gaps = parseJsonArray(match.complementaryGaps);

  return (
    <div className="p-5 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            {match.otherUser.image ? (
              <img src={match.otherUser.image} alt="" className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-[hsl(var(--secondary))] flex items-center justify-center">
                {(match.otherUser.name || "?")[0]}
              </div>
            )}
            <div>
              <h3 className="font-medium text-sm">{match.otherUser.name || match.otherUser.github}</h3>
              {match.otherUser.headline && (
                <p className="text-xs text-[hsl(var(--muted-foreground))]">{match.otherUser.headline}</p>
              )}
            </div>
            <div className="ml-auto text-right">
              <div className="text-2xl font-bold text-[hsl(var(--primary))]">{Math.round(match.score)}</div>
              <div className="text-[10px] text-[hsl(var(--muted-foreground))]">match score</div>
            </div>
          </div>

          <p className="text-sm text-[hsl(var(--muted-foreground))] mb-3">{match.rationale}</p>

          <div className="flex flex-wrap gap-3 mb-3">
            {shared.length > 0 && (
              <div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">Shared</span>
                <div className="flex gap-1 mt-0.5">
                  {shared.map((d) => (
                    <span key={d} className="px-2 py-0.5 rounded-full bg-green-500/10 text-green-400 text-[10px]">{d}</span>
                  ))}
                </div>
              </div>
            )}
            {gaps.length > 0 && (
              <div>
                <span className="text-[10px] text-[hsl(var(--muted-foreground))] uppercase">Complementary</span>
                <div className="flex gap-1 mt-0.5">
                  {gaps.map((g) => (
                    <span key={g} className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px]">{g}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {(userProfile || otherProfile) && (
          <div className="flex-shrink-0">
            <ThinkingRadar
              size={120}
              breadthScore={userProfile?.breadthScore}
              depthScore={userProfile?.depthScore}
              synthesisScore={userProfile?.synthesisScore}
              velocityScore={userProfile?.velocityScore}
              strategicAlignment={userProfile?.strategicAlignment}
              overlay={otherProfile ? {
                breadthScore: otherProfile.breadthScore,
                depthScore: otherProfile.depthScore,
                synthesisScore: otherProfile.synthesisScore,
                velocityScore: otherProfile.velocityScore,
                strategicAlignment: otherProfile.strategicAlignment,
              } : undefined}
            />
          </div>
        )}
      </div>

      {match.status === "SUGGESTED" && (
        <div className="flex gap-2 mt-3 pt-3 border-t border-[hsl(var(--border))]">
          <button
            onClick={() => onConnect?.(match.id)}
            className="px-4 py-1.5 rounded-md bg-[hsl(var(--primary))] text-white text-xs font-medium hover:opacity-90 transition"
          >
            Connect
          </button>
          <button
            onClick={() => onDismiss?.(match.id)}
            className="px-4 py-1.5 rounded-md border border-[hsl(var(--border))] text-xs text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition"
          >
            Dismiss
          </button>
        </div>
      )}
    </div>
  );
}
