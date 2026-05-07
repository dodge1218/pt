export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getPendingDeliveries } from "@/lib/smart-delivery";
import { InboxList } from "@/components/inbox-list";
import { redirect } from "next/navigation";

export default async function InboxPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const deliveries = await getPendingDeliveries(session.user.id);
  const responseIds = deliveries
    .filter((delivery) => delivery.type === "NEW_RESPONSE")
    .map((delivery) => delivery.contentId);
  const commentIds = deliveries
    .filter((delivery) => delivery.type === "NEW_COMMENT")
    .map((delivery) => delivery.contentId);

  const [responses, comments] = await Promise.all([
    prisma.response.findMany({
      where: { id: { in: responseIds } },
      select: { id: true, ticketId: true },
    }),
    prisma.comment.findMany({
      where: { id: { in: commentIds } },
      select: { id: true, response: { select: { ticketId: true } } },
    }),
  ]);

  const responseTicketById = new Map(responses.map((response) => [response.id, response.ticketId]));
  const commentTicketById = new Map(
    comments.map((comment) => [comment.id, comment.response.ticketId])
  );

  const serialized = deliveries.map((delivery) => {
    let href: string | null = null;
    if (delivery.type === "NEW_TICKET") href = `/tickets/${delivery.contentId}`;
    if (delivery.type === "NEW_RESPONSE") {
      const ticketId = responseTicketById.get(delivery.contentId);
      if (ticketId) href = `/tickets/${ticketId}`;
    }
    if (delivery.type === "NEW_COMMENT") {
      const ticketId = commentTicketById.get(delivery.contentId);
      if (ticketId) href = `/tickets/${ticketId}`;
    }
    if (delivery.type === "AGENT_ACTION_PENDING") href = "/agent/queue";
    if (delivery.type === "MATCH_SUGGESTION") href = "/matches";
    if (delivery.type === "FRIEND_REQUEST") href = "/friends";

    return {
      id: delivery.id,
      type: delivery.type,
      preview: delivery.preview,
      href,
      createdAt: delivery.createdAt.toISOString(),
      deliveredAt: delivery.deliveredAt?.toISOString() ?? null,
      scheduledFor: delivery.scheduledFor?.toISOString() ?? null,
    };
  });

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Inbox</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Delivered coordination items from tickets, agents, matches, and bridge activity.
        </p>
      </div>
      <InboxList deliveries={serialized} />
    </div>
  );
}
