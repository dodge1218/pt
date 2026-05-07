/**
 * Smart Delivery Engine
 * 
 * Determines the optimal time to deliver notifications/updates to a user
 * based on their activity patterns and preferences.
 * 
 * Named after καιρός — the right, critical, or opportune moment.
 */

import { prisma } from "./prisma";
import type { DeliveryMode, SmartDeliveryType } from "@prisma/client";

interface DeliveryWindow {
  start: string; // HH:mm
  end: string;   // HH:mm
  timezone: string;
}

/**
 * Check if current time falls within a user's active window
 */
export function isInActiveWindow(window: DeliveryWindow): boolean {
  const now = new Date();
  const formatter = new Intl.DateTimeFormat("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: window.timezone,
  });
  const currentTime = formatter.format(now);
  return currentTime >= window.start && currentTime <= window.end;
}

/**
 * Calculate next delivery time for a user
 * - IMMEDIATE: now
 * - KAIROS: next active window start (or now if currently active)
 * - DIGEST: next digest time (end of active window)
 */
export function getNextDeliveryTime(
  mode: DeliveryMode,
  window: DeliveryWindow
): Date {
  const now = new Date();

  switch (mode) {
    case "IMMEDIATE":
      return now;

    case "SMART":
      if (isInActiveWindow(window)) return now;
      // Schedule for next active window start
      return getNextWindowStart(window);

    case "DIGEST":
      return getNextDigestTime(window);

    default:
      return now;
  }
}

/**
 * Queue a delivery for a user
 */
export async function queueDelivery(params: {
  userId: string;
  type: SmartDeliveryType;
  contentId: string;
  preview: string;
}) {
  const user = await prisma.user.findUnique({
    where: { id: params.userId },
    select: {
      deliveryMode: true,
      timezone: true,
      activeStart: true,
      activeEnd: true,
    },
  });

  if (!user) return null;

  const window: DeliveryWindow = {
    start: user.activeStart,
    end: user.activeEnd,
    timezone: user.timezone,
  };

  const scheduledFor = getNextDeliveryTime(user.deliveryMode, window);

  return prisma.smartDelivery.create({
    data: {
      userId: params.userId,
      type: params.type,
      contentId: params.contentId,
      preview: params.preview,
      scheduledFor,
    },
  });
}

/**
 * Get pending deliveries ready to send
 */
export async function getPendingDeliveries(userId?: string) {
  const now = new Date();
  return prisma.smartDelivery.findMany({
    where: {
      ...(userId ? { userId } : {}),
      scheduledFor: { lte: now },
      deliveredAt: null,
    },
    orderBy: { scheduledFor: "asc" },
    include: { user: { select: { name: true, email: true } } },
  });
}

// Helper: get next window start time
function getNextWindowStart(window: DeliveryWindow): Date {
  const now = new Date();
  const [hours, minutes] = window.start.split(":").map(Number);

  // Create date in user's timezone
  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  // If we're past today's start, schedule for tomorrow
  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}

// Helper: get next digest time (end of active window)
function getNextDigestTime(window: DeliveryWindow): Date {
  const now = new Date();
  const [hours, minutes] = window.end.split(":").map(Number);

  const next = new Date(now);
  next.setHours(hours, minutes, 0, 0);

  if (next <= now) {
    next.setDate(next.getDate() + 1);
  }

  return next;
}
