"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function CommentForm({ responseId }: { responseId: string }) {
  const router = useRouter();
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = content.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/responses/${responseId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: trimmed }),
      });

      if (res.ok) {
        setContent("");
        router.refresh();
        return;
      }

      const err = await res.json();
      alert(err.error || "Failed to comment");
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mt-3 flex gap-2">
      <input
        value={content}
        onChange={(e) => setContent(e.target.value)}
        maxLength={5000}
        placeholder="Add a comment..."
        className="min-w-0 flex-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs focus:border-[hsl(var(--primary))] focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading || !content.trim()}
        className="shrink-0 rounded-md border border-[hsl(var(--border))] px-3 py-2 text-xs font-medium hover:bg-[hsl(var(--secondary))] disabled:opacity-50"
      >
        {loading ? "Posting..." : "Comment"}
      </button>
    </form>
  );
}
