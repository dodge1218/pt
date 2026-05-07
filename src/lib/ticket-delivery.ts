import { queueDelivery } from "@/lib/smart-delivery";
import { prisma } from "@/lib/prisma";
import type { SmartDeliveryType } from "@prisma/client";

type DeliveryRecipient = {
  userId: string;
};

function previewFrom(title: string, content?: string | null) {
  const body = content?.replace(/\s+/g, " ").trim();
  if (!body) return title.slice(0, 240);
  return `${title}: ${body}`.slice(0, 240);
}

async function queueForRecipients(params: {
  recipients: DeliveryRecipient[];
  excludeUserId?: string;
  type: SmartDeliveryType;
  contentId: string;
  preview: string;
  urgency?: "low" | "normal" | "high";
}) {
  const uniqueRecipients = Array.from(
    new Set(
      params.recipients
        .map((recipient) => recipient.userId)
        .filter((userId) => userId && userId !== params.excludeUserId)
    )
  );

  const results = await Promise.allSettled(
    uniqueRecipients.map((recipientId) =>
      queueDelivery({
        recipientId,
        type: params.type,
        contentId: params.contentId,
        preview: params.preview,
        urgency: params.urgency,
      })
    )
  );

  return {
    attempted: uniqueRecipients.length,
    queued: results.filter((result) => result.status === "fulfilled").length,
  };
}

export async function queueTicketCreatedDeliveries(params: {
  ticketId: string;
  authorId: string;
  title: string;
  content: string;
  bridgeId?: string | null;
}) {
  if (!params.bridgeId) return { attempted: 0, queued: 0 };

  const members = await prisma.bridgeMember.findMany({
    where: { bridgeId: params.bridgeId },
    select: { userId: true },
  });

  return queueForRecipients({
    recipients: members,
    excludeUserId: params.authorId,
    type: "NEW_TICKET",
    contentId: params.ticketId,
    preview: previewFrom(params.title, params.content),
  });
}

export async function queueResponseCreatedDeliveries(params: {
  responseId: string;
  responderId: string;
  ticketId: string;
  ticketTitle: string;
  ticketAuthorId: string;
  bridgeId?: string | null;
  content: string;
}) {
  const recipients: DeliveryRecipient[] = [{ userId: params.ticketAuthorId }];

  if (params.bridgeId) {
    const bridgeMembers = await prisma.bridgeMember.findMany({
      where: { bridgeId: params.bridgeId },
      select: { userId: true },
    });
    recipients.push(...bridgeMembers);
  }

  return queueForRecipients({
    recipients,
    excludeUserId: params.responderId,
    type: "NEW_RESPONSE",
    contentId: params.responseId,
    preview: previewFrom(params.ticketTitle, params.content),
  });
}

export async function queueAgentActionPendingDelivery(params: {
  actionId: string;
  ownerId: string;
  agentName: string;
  actionType: string;
}) {
  return queueDelivery({
    recipientId: params.ownerId,
    type: "AGENT_ACTION_PENDING",
    contentId: params.actionId,
    preview: `${params.agentName} wants to ${params.actionType.replace(/_/g, " ").toLowerCase()}.`,
    urgency: "high",
  });
}
