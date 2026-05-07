"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function BridgeForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function createBridge(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;

    setLoading(true);
    try {
      const res = await fetch("/api/bridges", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: trimmed, memberIds: [] }),
      });

      if (res.ok) {
        setName("");
        router.refresh();
        return;
      }

      const err = await res.json();
      alert(err.error || "Failed to create bridge");
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={createBridge} className="flex gap-2">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        maxLength={200}
        placeholder="New bridge name"
        className="min-w-0 flex-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm focus:border-[hsl(var(--primary))] focus:outline-none"
      />
      <button
        type="submit"
        disabled={loading || !name.trim()}
        className="rounded-md bg-[hsl(var(--primary))] px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Creating..." : "Create"}
      </button>
    </form>
  );
}
