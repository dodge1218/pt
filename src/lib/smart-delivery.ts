/**
 * Smart Delivery Engine
 * 
 * Smart timing for notifications. Respects user's active windows,
 * delivery preferences, and content urgency.
 * 
 * Smart timing for delivery — right-time vs clock-time.
 * 
 * Cognitive insight: People make better decisions when information arrives
 * during their natural thinking windows, not when the sender hits "post."
 */

import { prisma } from "@/lib/prisma";

interface DeliveryItem {
  type: "NEW_TICKET" | "NEW_RESPONSE" | "NEW_COMMENT" | "MATCH_SUGGESTION" | "AGENT_ACTION_PENDING" | "FRIEND_REQUEST";
  contentId: string;
  preview: string;
  recipientId: string;
  urgency?: "low" | "normal" | "high";
}

/**
 * Queue a delivery for smart timing.
 * If user prefers IMMEDIATE, delivers now.
 * If SMART, schedules for next active window.
 * If DIGEST, batches for daily digest.
 */
export async function queueDelivery(item: DeliveryItem) {
  const user = await prisma.user.findUnique({
    where: { id: item.recipientId },
    select: {
      deliveryMode: true,
      timezone: true,
      activeStart: true,
      activeEnd: true,
    },
  });

  if (!user) return null;

  // High urgency always delivers immediately (agent actions pending, etc.)
  if (item.urgency === "high" || user.deliveryMode === "IMMEDIATE") {
    return prisma.smartDelivery.create({
      data: {
        type: item.type,
        contentId: item.contentId,
        preview: item.preview,
        userId: item.recipientId,
        scheduledFor: new Date(),
        deliveredAt: new Date(),
      },
    });
  }

  // DIGEST mode — schedule for next digest window (default: 9 AM user time)
  if (user.deliveryMode === "DIGEST") {
    const digestTime = getNextDigestTime(user.timezone, user.activeStart);
    return prisma.smartDelivery.create({
      data: {
        type: item.type,
        contentId: item.contentId,
        preview: item.preview,
        userId: item.recipientId,
        scheduledFor: digestTime,
      },
    });
  }

  // SMART mode — schedule for next active window
  const smartTime = getNextSmartWindow(
    user.timezone,
    user.activeStart,
    user.activeEnd,
    item.type
  );

  return prisma.smartDelivery.create({
    data: {
      type: item.type,
      contentId: item.contentId,
      preview: item.preview,
      userId: item.recipientId,
      scheduledFor: smartTime,
    },
  });
}

/**
 * Get next time within user's active window.
 * If currently in window, return now.
 * If outside, return start of next window.
 */
function getNextSmartWindow(
  timezone: string,
  activeStart: string,
  activeEnd: string,
  type: string
): Date {
  const now = new Date();

  try {
    // Get current time in user's timezone
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const [startH, startM] = activeStart.split(":").map(Number);
    const [endH, endM] = activeEnd.split(":").map(Number);

    const currentMinutes = userTime.getHours() * 60 + userTime.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    // Handle overnight windows (e.g., 14:30 to 03:00)
    const isInWindow = endMinutes > startMinutes
      ? currentMinutes >= startMinutes && currentMinutes <= endMinutes
      : currentMinutes >= startMinutes || currentMinutes <= endMinutes;

    if (isInWindow) {
      // Add small stagger to avoid notification burst
      const stagger = Math.floor(Math.random() * 5) * 60 * 1000; // 0-5 min
      return new Date(now.getTime() + stagger);
    }

    // Schedule for next active window start
    const tomorrow = new Date(now);
    if (currentMinutes > startMinutes) {
      tomorrow.setDate(tomorrow.getDate() + 1);
    }
    tomorrow.setHours(startH, startM + Math.floor(Math.random() * 15), 0, 0);
    return tomorrow;
  } catch {
    // Fallback: deliver now if timezone parsing fails
    return now;
  }
}

/**
 * Get next digest time (start of active window).
 */
function getNextDigestTime(timezone: string, activeStart: string): Date {
  const now = new Date();
  try {
    const [h, m] = activeStart.split(":").map(Number);
    const userTime = new Date(now.toLocaleString("en-US", { timeZone: timezone }));
    const currentMinutes = userTime.getHours() * 60 + userTime.getMinutes();
    const targetMinutes = h * 60 + m;

    const result = new Date(now);
    if (currentMinutes >= targetMinutes) {
      result.setDate(result.getDate() + 1);
    }
    result.setHours(h, m, 0, 0);
    return result;
  } catch {
    const result = new Date(now);
    result.setDate(result.getDate() + 1);
    result.setHours(9, 0, 0, 0);
    return result;
  }
}

/**
 * Get pending deliveries for a user (for polling or SSE).
 */
export async function getPendingDeliveries(userId: string) {
  return prisma.smartDelivery.findMany({
    where: {
      userId,
      deliveredAt: { not: null },
      readAt: null,
      scheduledFor: { lte: new Date() },
    },
    orderBy: { scheduledFor: "desc" },
    take: 20,
  });
}

/**
 * Mark a delivery as read.
 */
export async function markDeliveryRead(deliveryId: string, userId: string) {
  return prisma.smartDelivery.updateMany({
    where: { id: deliveryId, userId },
    data: { readAt: new Date() },
  });
}

/**
 * Process pending deliveries — called by cron or API.
 * Finds all deliveries scheduled for now or earlier that haven't been delivered.
 */
export async function processDeliveryQueue() {
  const pending = await prisma.smartDelivery.findMany({
    where: {
      scheduledFor: { lte: new Date() },
      deliveredAt: null,
    },
    take: 100,
    orderBy: { scheduledFor: "asc" },
  });

  const delivered = await Promise.all(
    pending.map((d) =>
      prisma.smartDelivery.update({
        where: { id: d.id },
        data: { deliveredAt: new Date() },
      })
    )
  );

  return { processed: delivered.length };
}
