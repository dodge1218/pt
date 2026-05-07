"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const KINDS = [
  { value: "LINK", label: "Link" },
  { value: "FILE", label: "File" },
  { value: "NOTE", label: "Note" },
  { value: "CONTEXTCLAW_MANIFEST", label: "ContextClaw manifest" },
  { value: "CONTEXTCLAW_RECEIPT", label: "ContextClaw receipt" },
];

export function ArtifactForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState("LINK");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);

    let metadata: Record<string, unknown> = {};
    const metadataText = String(fd.get("metadata") || "").trim();
    if (metadataText) {
      try {
        const parsed = JSON.parse(metadataText);
        if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
          throw new Error("Metadata must be an object");
        }
        metadata = parsed;
      } catch {
        alert("Metadata must be valid JSON object syntax.");
        setLoading(false);
        return;
      }
    }

    const numberOrUndefined = (name: string) => {
      const value = String(fd.get(name) || "").trim();
      return value ? Number(value) : undefined;
    };

    const payload = {
      kind,
      title: String(fd.get("title") || ""),
      uri: String(fd.get("uri") || "") || undefined,
      summary: String(fd.get("summary") || "") || undefined,
      provider: String(fd.get("provider") || "") || undefined,
      model: String(fd.get("model") || "") || undefined,
      inputTokens: numberOrUndefined("inputTokens"),
      outputTokens: numberOrUndefined("outputTokens"),
      contextSavedTokens: numberOrUndefined("contextSavedTokens"),
      costUsd: numberOrUndefined("costUsd"),
      metadata,
    };

    try {
      const res = await fetch(`/api/tickets/${ticketId}/artifacts`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to attach artifact");
        return;
      }

      form.reset();
      setKind("LINK");
      setOpen(false);
      router.refresh();
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-xs font-medium hover:bg-[hsl(var(--secondary))]"
      >
        Attach artifact
      </button>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="text-xs font-medium">
          Kind
          <select
            value={kind}
            onChange={(e) => setKind(e.target.value)}
            className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          >
            {KINDS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
        <label className="text-xs font-medium">
          Title
          <input
            name="title"
            required
            maxLength={200}
            className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          />
        </label>
      </div>

      <label className="block text-xs font-medium">
        URI or local path
        <input
          name="uri"
          maxLength={2000}
          placeholder="https://..., artifact://..., /workspace/..."
          className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-xs font-medium">
        Summary
        <textarea
          name="summary"
          rows={3}
          maxLength={2000}
          className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-y"
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-5">
        <input name="provider" placeholder="provider" className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs" />
        <input name="model" placeholder="model" className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs" />
        <input name="inputTokens" type="number" min="0" placeholder="input tokens" className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs" />
        <input name="outputTokens" type="number" min="0" placeholder="output tokens" className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs" />
        <input name="costUsd" type="number" min="0" step="0.000001" placeholder="cost USD" className="rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs" />
      </div>

      <input
        name="contextSavedTokens"
        type="number"
        min="0"
        placeholder="context saved tokens"
        className="w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs"
      />

      <label className="block text-xs font-medium">
        Metadata JSON
        <textarea
          name="metadata"
          rows={3}
          placeholder='{"missionId":"...", "passId":"..."}'
          className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 font-mono text-xs resize-y"
        />
      </label>

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
        >
          {loading ? "Attaching..." : "Attach"}
        </button>
      </div>
    </form>
  );
}
