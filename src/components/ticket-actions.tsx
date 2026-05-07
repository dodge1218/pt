"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = ["DECISION", "INFO", "PROPOSAL", "STATUS", "PUBLIC"] as const;
const STATUSES = ["OPEN", "IN_PROGRESS", "IN_MEDIATION", "RESOLVED", "ARCHIVED"] as const;
const VISIBILITIES = ["PRIVATE", "FRIENDS", "PUBLIC"] as const;

type TicketActionsProps = {
  ticket: {
    id: string;
    title: string;
    content: string;
    type: string;
    status: string;
    visibility: string;
  };
  initialTags: string[];
};

export function TicketActions({ ticket, initialTags }: TicketActionsProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [type, setType] = useState(ticket.type);
  const [status, setStatus] = useState(ticket.status);
  const [visibility, setVisibility] = useState(ticket.visibility);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);

    const fd = new FormData(e.currentTarget);
    const payload = {
      title: String(fd.get("title") || ""),
      content: String(fd.get("content") || ""),
      type,
      status,
      visibility: type === "PUBLIC" ? "PUBLIC" : visibility,
      tags: String(fd.get("tags") || "")
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    };

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to update ticket");
        return;
      }
      setEditing(false);
      router.refresh();
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!confirm("Archive this ticket? It will be removed from active lists.")) return;
    setDeleting(true);

    try {
      const res = await fetch(`/api/tickets/${ticket.id}`, { method: "DELETE" });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to archive ticket");
        setDeleting(false);
        return;
      }
      router.push("/tickets");
      router.refresh();
    } catch {
      alert("Network error");
      setDeleting(false);
    }
  }

  if (!editing) {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="px-3 py-1.5 rounded-md border border-[hsl(var(--border))] text-xs font-medium hover:bg-[hsl(var(--secondary))] transition"
        >
          Edit ticket
        </button>
        <button
          type="button"
          onClick={handleDelete}
          disabled={deleting}
          className="px-3 py-1.5 rounded-md border border-red-500/40 text-xs font-medium text-red-300 hover:bg-red-500/10 transition disabled:opacity-50"
        >
          {deleting ? "Archiving..." : "Archive"}
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-4 space-y-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
    >
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="block text-xs font-medium">
          Type
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          >
            {TYPES.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium">
          Status
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
          >
            {STATUSES.map((option) => (
              <option key={option} value={option}>
                {option.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
        <label className="block text-xs font-medium">
          Visibility
          <select
            value={type === "PUBLIC" ? "PUBLIC" : visibility}
            onChange={(e) => setVisibility(e.target.value)}
            disabled={type === "PUBLIC"}
            className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm disabled:opacity-60"
          >
            {VISIBILITIES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className="block text-xs font-medium">
        Title
        <input
          name="title"
          defaultValue={ticket.title}
          required
          maxLength={200}
          className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
        />
      </label>

      <label className="block text-xs font-medium">
        Content
        <textarea
          name="content"
          defaultValue={ticket.content}
          required
          rows={8}
          maxLength={10000}
          className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm resize-y"
        />
      </label>

      <label className="block text-xs font-medium">
        Tags
        <input
          name="tags"
          defaultValue={initialTags.join(", ")}
          className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-sm"
        />
      </label>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}
