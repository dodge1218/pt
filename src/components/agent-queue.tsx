"use client";

import { useRouter } from "next/navigation";

interface AgentAction {
  id: string;
  type: string;
  status: string;
  payload: string;
  createdAt: string;
  agentProxy: { name: string };
}

export function AgentQueue({ actions }: { actions: AgentAction[] }) {
  const router = useRouter();

  async function handleAction(actionId: string, action: "approve" | "reject") {
    await fetch("/api/agent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, actionId }),
    });
    router.refresh();
  }

  if (actions.length === 0) {
    return (
      <div className="text-center py-12 border border-dashed border-[hsl(var(--border))] rounded-lg">
        <p className="text-[hsl(var(--muted-foreground))]">No pending actions.</p>
        <p className="text-xs text-[hsl(var(--muted-foreground))] mt-1">Your agents are waiting for work.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {actions.map((action) => {
        let payload: Record<string, string> = {};
        try { payload = JSON.parse(action.payload); } catch {}

        return (
          <div key={action.id} className="p-5 rounded-lg border border-yellow-500/30 bg-yellow-500/5">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-purple-400 text-sm">🤖 {action.agentProxy.name}</span>
              <span className="text-xs text-[hsl(var(--muted-foreground))]">
                wants to {action.type.replace(/_/g, " ").toLowerCase()}
              </span>
              <span className="text-xs text-[hsl(var(--muted-foreground))] ml-auto">
                {new Date(action.createdAt).toLocaleString()}
              </span>
            </div>
            <div className="p-3 rounded-md bg-[hsl(var(--card))] border border-[hsl(var(--border))] mb-3">
              {payload.title && <h3 className="font-medium text-sm mb-1">{payload.title}</h3>}
              {payload.content && (
                <p className="text-xs text-[hsl(var(--muted-foreground))] line-clamp-4 whitespace-pre-wrap">
                  {payload.content.slice(0, 500)}
                </p>
              )}
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => handleAction(action.id, "approve")}
                className="px-4 py-1.5 rounded-md bg-green-600 text-white text-xs font-medium hover:bg-green-500 transition"
              >
                ✅ Approve
              </button>
              <button
                onClick={() => handleAction(action.id, "reject")}
                className="px-4 py-1.5 rounded-md border border-red-500/50 text-red-400 text-xs font-medium hover:bg-red-500/10 transition"
              >
                ❌ Reject
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
