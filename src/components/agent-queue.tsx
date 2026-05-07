"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface AgentAction {
  id: string;
  type: string;
  status: string;
  payload: string;
  resultId: string | null;
  createdAt: string;
  resolvedAt: string | null;
  agentProxy: { name: string; description: string | null };
}

function parsePayload(payload: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(payload);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function prettyPayload(payload: string) {
  try {
    return JSON.stringify(JSON.parse(payload), null, 2);
  } catch {
    return payload;
  }
}

function actionLabel(type: string) {
  return type.replace(/_/g, " ").toLowerCase();
}

function resultHref(action: AgentAction) {
  const payload = parsePayload(action.payload);
  if (action.type === "CREATE_TICKET" && action.resultId) return `/tickets/${action.resultId}`;
  if (action.type === "CREATE_RESPONSE" && typeof payload.ticketId === "string") {
    return `/tickets/${payload.ticketId}`;
  }
  return null;
}

function PendingActionCard({ action }: { action: AgentAction }) {
  const router = useRouter();
  const [draft, setDraft] = useState(prettyPayload(action.payload));
  const [loading, setLoading] = useState<"approve" | "reject" | null>(null);
  const payload = useMemo(() => parsePayload(draft), [draft]);

  async function resolve(nextAction: "approve" | "reject") {
    setLoading(nextAction);
    try {
      const body =
        nextAction === "approve"
          ? { action: "approve", actionId: action.id, payload: draft }
          : { action: "reject", actionId: action.id };
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || `Failed to ${nextAction} action`);
        return;
      }
      router.refresh();
    } finally {
      setLoading(null);
    }
  }

  return (
    <section className="rounded-lg border border-yellow-500/30 bg-yellow-500/5 p-5">
      <div className="mb-3 flex items-center gap-2">
        <span className="text-sm text-purple-400">🤖 {action.agentProxy.name}</span>
        <span className="text-xs text-[hsl(var(--muted-foreground))]">
          wants to {actionLabel(action.type)}
        </span>
        <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
          {new Date(action.createdAt).toLocaleString()}
        </span>
      </div>

      <div className="mb-3 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3">
        {typeof payload.title === "string" && (
          <h3 className="mb-1 text-sm font-medium">{payload.title}</h3>
        )}
        {typeof payload.position === "string" && (
          <p className="mb-1 text-xs text-blue-400">Position: {payload.position}</p>
        )}
        {typeof payload.content === "string" && (
          <p className="whitespace-pre-wrap text-xs text-[hsl(var(--muted-foreground))]">
            {payload.content.slice(0, 800)}
          </p>
        )}
      </div>

      <label className="mb-2 block text-xs font-medium">Review payload</label>
      <textarea
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        spellCheck={false}
        className="mb-3 min-h-56 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] p-3 font-mono text-xs focus:border-[hsl(var(--primary))] focus:outline-none"
      />

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => resolve("approve")}
          disabled={loading !== null}
          className="rounded-md bg-green-600 px-4 py-1.5 text-xs font-medium text-white transition hover:bg-green-500 disabled:opacity-50"
        >
          {loading === "approve" ? "Approving..." : "Approve revised payload"}
        </button>
        <button
          type="button"
          onClick={() => resolve("reject")}
          disabled={loading !== null}
          className="rounded-md border border-red-500/50 px-4 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10 disabled:opacity-50"
        >
          {loading === "reject" ? "Rejecting..." : "Reject"}
        </button>
        <button
          type="button"
          onClick={() => setDraft(prettyPayload(action.payload))}
          disabled={loading !== null}
          className="rounded-md border border-[hsl(var(--border))] px-4 py-1.5 text-xs text-[hsl(var(--muted-foreground))] disabled:opacity-50"
        >
          Reset
        </button>
      </div>
    </section>
  );
}

export function AgentQueue({ actions }: { actions: AgentAction[] }) {
  const pending = actions.filter((action) => action.status === "PENDING");
  const resolved = actions.filter((action) => action.status !== "PENDING");

  return (
    <>
      {pending.length > 0 ? (
        <div className="mb-10">
          <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <span className="h-2 w-2 rounded-full bg-yellow-400" />
            Pending ({pending.length})
          </h2>
          <div className="space-y-4">
            {pending.map((action) => (
              <PendingActionCard key={action.id} action={action} />
            ))}
          </div>
        </div>
      ) : (
        <div className="mb-10 rounded-lg border border-dashed border-[hsl(var(--border))] py-12 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">No pending actions.</p>
          <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
            Your agents are waiting for work.
          </p>
        </div>
      )}

      {resolved.length > 0 && (
        <div>
          <h2 className="mb-4 text-lg font-semibold">History</h2>
          <div className="space-y-2">
            {resolved.map((action) => {
              const payload = parsePayload(action.payload);
              const href = resultHref(action);
              return (
                <div
                  key={action.id}
                  className="flex items-center gap-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"
                >
                  <span className={action.status === "APPROVED" ? "text-green-400" : "text-red-400"}>
                    {action.status === "APPROVED" ? "Approved" : "Rejected"}
                  </span>
                  <span className="text-xs text-purple-400">🤖 {action.agentProxy.name}</span>
                  <span className="min-w-0 truncate text-xs">
                    {String(payload.title || payload.content || action.type)}
                  </span>
                  {href && (
                    <Link href={href} className="ml-auto text-xs text-[hsl(var(--primary))]">
                      Open result
                    </Link>
                  )}
                  {!href && action.resultId && (
                    <span className="ml-auto font-mono text-[10px] text-[hsl(var(--muted-foreground))]">
                      {action.resultId}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </>
  );
}
