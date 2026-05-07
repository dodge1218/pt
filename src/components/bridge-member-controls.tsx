"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type FriendOption = {
  id: string;
  name: string | null;
  github: string | null;
};

export function BridgeMemberControls({
  bridgeId,
  friends,
}: {
  bridgeId: string;
  friends: FriendOption[];
}) {
  const router = useRouter();
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(false);

  async function addMember(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!userId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bridges/${bridgeId}/members`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        setUserId("");
        router.refresh();
        return;
      }

      const err = await res.json();
      alert(err.error || "Failed to add member");
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  if (friends.length === 0) {
    return (
      <p className="text-xs text-[hsl(var(--muted-foreground))]">
        Add accepted friends before inviting bridge members.
      </p>
    );
  }

  return (
    <form onSubmit={addMember} className="flex gap-2">
      <select
        value={userId}
        onChange={(e) => setUserId(e.target.value)}
        className="min-w-0 flex-1 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--background))] px-3 py-2 text-xs focus:border-[hsl(var(--primary))] focus:outline-none"
      >
        <option value="">Add friend...</option>
        {friends.map((friend) => (
          <option key={friend.id} value={friend.id}>
            {friend.name || friend.github || friend.id}
          </option>
        ))}
      </select>
      <button
        type="submit"
        disabled={loading || !userId}
        className="rounded-md bg-[hsl(var(--primary))] px-3 py-2 text-xs font-medium text-white disabled:opacity-50"
      >
        {loading ? "Adding..." : "Add"}
      </button>
    </form>
  );
}

export function RemoveBridgeMemberButton({
  bridgeId,
  userId,
}: {
  bridgeId: string;
  userId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  async function removeMember() {
    if (!confirm("Remove this bridge member?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/bridges/${bridgeId}/members`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId }),
      });

      if (res.ok) {
        router.refresh();
        return;
      }

      const err = await res.json();
      alert(err.error || "Failed to remove member");
    } catch {
      alert("Network error");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={removeMember}
      disabled={loading}
      className="text-[10px] text-red-400 hover:text-red-300 disabled:opacity-50"
    >
      {loading ? "Removing..." : "Remove"}
    </button>
  );
}
