"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const POSITIONS = [
  { value: "AGREE", icon: "✅", label: "Agree" },
  { value: "DISAGREE", icon: "❌", label: "Disagree" },
  { value: "COUNTER_PROPOSAL", icon: "🔄", label: "Counter" },
  { value: "NEUTRAL", icon: "➖", label: "Neutral" },
  { value: "QUESTION", icon: "❓", label: "Question" },
];

export function ResponseForm({ ticketId }: { ticketId: string }) {
  const router = useRouter();
  const [position, setPosition] = useState("NEUTRAL");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch(`/api/tickets/${ticketId}/responses`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: fd.get("content"), position }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        const err = await res.json();
        alert(err.error || "Failed to submit");
      }
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {POSITIONS.map((p) => (
          <button
            key={p.value}
            type="button"
            onClick={() => setPosition(p.value)}
            className={`px-3 py-1.5 rounded-md border text-xs transition ${
              position === p.value
                ? "border-[hsl(var(--primary))] bg-[hsl(var(--primary))]/10"
                : "border-[hsl(var(--border))]"
            }`}
          >
            {p.icon} {p.label}
          </button>
        ))}
      </div>
      <textarea
        name="content"
        required
        rows={4}
        placeholder="Share your position..."
        className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none resize-y"
      />
      <button
        type="submit"
        disabled={loading}
        className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition disabled:opacity-50"
      >
        {loading ? "Submitting..." : "Submit Response"}
      </button>
    </form>
  );
}
