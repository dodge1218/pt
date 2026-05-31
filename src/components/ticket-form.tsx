"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const TYPES = [
  { value: "DECISION", label: "🔀 Decision", desc: "Requires positions" },
  { value: "INFO", label: "ℹ️ Info", desc: "One-way update" },
  { value: "PROPOSAL", label: "📋 Proposal", desc: "Needs approval" },
  { value: "STATUS", label: "📊 Status", desc: "Progress update" },
  { value: "PUBLIC", label: "🌐 Public", desc: "Anyone can reply" },
];

interface TicketFormProps {
  projectId?: string;
}

export function TicketForm({ projectId }: TicketFormProps) {
  const router = useRouter();
  const [type, setType] = useState("DECISION");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const form = e.currentTarget;
    const fd = new FormData(form);
    const data = {
      title: fd.get("title") as string,
      content: fd.get("content") as string,
      type,
      visibility: type === "PUBLIC" ? "PUBLIC" : "PRIVATE",
      tags: (fd.get("tags") as string)?.split(",").map((t) => t.trim()).filter(Boolean) || [],
      projectId,
    };

    try {
      const res = await fetch("/api/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        const ticket = await res.json();
        router.push(`/tickets/${ticket.id}`);
      } else {
        const err = await res.json();
        alert(err.error || "Failed to create ticket");
        setLoading(false);
      }
    } catch {
      alert("Network error");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium mb-2">Type</label>
        <div className="grid grid-cols-5 gap-2">
          {TYPES.map((t) => (
            <button
              key={t.value}
              type="button"
              onClick={() => setType(t.value)}
              className={`p-3 rounded-lg border text-center text-xs transition ${
                type === t.value
                  ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                  : "border-[hsl(var(--border))] bg-[hsl(var(--card))]"
              }`}
            >
              <div className="text-lg">{t.label.split(" ")[0]}</div>
              <div className="mt-1 font-medium">{t.label.split(" ").slice(1).join(" ")}</div>
            </button>
          ))}
        </div>
      </div>

      <div>
        <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
        <input
          id="title" name="title" type="text" required maxLength={200}
          placeholder="What's this about?"
          className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none"
        />
      </div>

      <div>
        <label htmlFor="content" className="block text-sm font-medium mb-2">Content</label>
        <textarea
          id="content" name="content" required rows={8} maxLength={10000}
          placeholder="Share your thoughts..."
          className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none resize-y"
        />
      </div>

      <div>
        <label htmlFor="tags" className="block text-sm font-medium mb-2">
          Tags <span className="text-[hsl(var(--muted-foreground))] font-normal">(comma-separated)</span>
        </label>
        <input
          id="tags" name="tags" type="text"
          placeholder="e.g. architecture, frontend, urgent"
          className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none"
        />
      </div>

      <div className="flex items-center justify-between pt-4">
        <button type="button" onClick={() => router.back()} className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
          Cancel
        </button>
        <button type="submit" disabled={loading}
          className="px-6 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
        >
          {loading ? "Sending..." : "Send ticket"}
        </button>
      </div>
    </form>
  );
}
