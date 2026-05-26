"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type InboxItem = {
  id: string;
  type: string;
  preview: string;
  href: string | null;
  createdAt: string;
  deliveredAt: string | null;
  scheduledFor: string | null;
};

function typeLabel(type: string) {
  return type.replace(/_/g, " ").toLowerCase();
}

export function InboxList({ deliveries }: { deliveries: InboxItem[] }) {
  const router = useRouter();
  const [loadingId, setLoadingId] = useState<string | null>(null);

  async function markRead(deliveryId: string) {
    setLoadingId(deliveryId);
    try {
      const res = await fetch("/api/proofticket/queue", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "mark_read", deliveryId }),
      });
      if (!res.ok) {
        const err = await res.json();
        alert(err.error || "Failed to mark read");
        return;
      }
      router.refresh();
    } finally {
      setLoadingId(null);
    }
  }

  if (deliveries.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-[hsl(var(--border))] py-12 text-center">
        <p className="text-[hsl(var(--muted-foreground))]">Inbox is clear.</p>
        <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
          Delivered tickets, responses, comments, matches, and agent approvals will appear here.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {deliveries.map((delivery) => (
        <section
          key={delivery.id}
          className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <span className="text-xs uppercase tracking-wide text-[hsl(var(--muted-foreground))]">
              {typeLabel(delivery.type)}
            </span>
            <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
              {new Date(delivery.deliveredAt || delivery.scheduledFor || delivery.createdAt).toLocaleString()}
            </span>
          </div>
          <p className="mb-3 whitespace-pre-wrap text-sm">{delivery.preview}</p>
          <div className="flex flex-wrap gap-2">
            {delivery.href && (
              <Link
                href={delivery.href}
                className="rounded-md bg-[hsl(var(--primary))] px-3 py-1.5 text-xs font-medium text-white"
              >
                Open
              </Link>
            )}
            <button
              type="button"
              onClick={() => markRead(delivery.id)}
              disabled={loadingId === delivery.id}
              className="rounded-md border border-[hsl(var(--border))] px-3 py-1.5 text-xs text-[hsl(var(--muted-foreground))] disabled:opacity-50"
            >
              {loadingId === delivery.id ? "Marking..." : "Mark read"}
            </button>
          </div>
        </section>
      ))}
    </div>
  );
}
