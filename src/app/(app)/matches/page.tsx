"use client";
export const dynamic = "force-dynamic";

import { useEffect, useState } from "react";
import { MatchCard } from "@/components/match-card";

interface MatchData {
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
}

export default function MatchesPage() {
  const [matches, setMatches] = useState<MatchData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/matches")
      .then((r) => r.json())
      .then((data) => {
        setMatches(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  async function handleAction(matchId: string, action: "connect" | "dismiss") {
    await fetch("/api/matches", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId, action }),
    });
    setMatches((prev) =>
      prev.map((m) =>
        m.id === matchId
          ? { ...m, status: action === "connect" ? "CONNECTED" : "DISMISSED" }
          : m
      )
    );
  }

  const active = matches.filter((m) => m.status === "SUGGESTED" || m.status === "VIEWED");
  const connected = matches.filter((m) => m.status === "CONNECTED");

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold mb-2">Matches</h1>
      <p className="text-sm text-[hsl(var(--muted-foreground))] mb-6">
        People matched by thinking patterns, not profile blurbs.
      </p>

      {loading ? (
        <div className="text-center py-12 text-[hsl(var(--muted-foreground))]">Loading...</div>
      ) : active.length === 0 && connected.length === 0 ? (
        <div className="text-center py-16 border border-dashed border-[hsl(var(--border))] rounded-lg">
          <p className="text-[hsl(var(--muted-foreground))]">No matches yet.</p>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mt-2">
            Upload a prompt dump to generate your thinking profile and find matches.
          </p>
          <button className="mt-4 px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition">
            Upload prompt dump
          </button>
        </div>
      ) : (
        <>
          {active.length > 0 && (
            <div className="space-y-4 mb-8">
              {active.map((m) => (
                <MatchCard
                  key={m.id}
                  match={m}
                  onConnect={(id) => handleAction(id, "connect")}
                  onDismiss={(id) => handleAction(id, "dismiss")}
                />
              ))}
            </div>
          )}
          {connected.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-3">Connected</h2>
              <div className="space-y-4">
                {connected.map((m) => (
                  <MatchCard key={m.id} match={m} />
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
