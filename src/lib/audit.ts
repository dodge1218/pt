import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

type AuditParams = {
  actorUserId?: string | null;
  action: string;
  entityType: string;
  entityId?: string | null;
  metadata?: Record<string, unknown>;
  req?: NextRequest;
};

export async function writeAuditLog({
  actorUserId,
  action,
  entityType,
  entityId,
  metadata = {},
  req,
}: AuditParams) {
  try {
    await prisma.auditLog.create({
      data: {
        actorUserId,
        action,
        entityType,
        entityId,
        metadata: JSON.stringify(metadata),
        ipAddress: req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null,
        userAgent: req?.headers.get("user-agent") || null,
      },
    });
  } catch (error) {
    console.error("Failed to write audit log", error);
  }
}

export function parseAuditMetadata(metadata: string): Record<string, unknown> {
  try {
    const parsed = JSON.parse(metadata);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed) ? parsed : {};
  } catch {
    return {};
  }
}
