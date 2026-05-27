import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/lib/auth";
import { writeAuditLog } from "@/lib/audit";
import { checkRateLimit } from "@/lib/rate-limit";
import { redactRecord } from "@/lib/redact";

const deletionRequestSchema = z.object({
  confirmation: z.string(),
  reason: z.string().max(1000).optional(),
});

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rateLimit = checkRateLimit(req, {
    bucket: "api:profile:deletion-request",
    identifier: session.user.id,
    limit: 3,
    windowMs: 60 * 60 * 1000,
  });
  if (rateLimit) return rateLimit;

  try {
    const body = deletionRequestSchema.parse(await req.json());
    if (body.confirmation.trim().toLowerCase() !== "delete my account") {
      return NextResponse.json(
        { error: "Confirmation must be: delete my account" },
        { status: 400 }
      );
    }

    const safeBody = redactRecord({
      reason: body.reason,
      requestedAt: new Date().toISOString(),
    });

    await writeAuditLog({
      actorUserId: session.user.id,
      action: "account.deletion_request",
      entityType: "user",
      entityId: session.user.id,
      metadata: safeBody,
      req,
    });

    return NextResponse.json({
      ok: true,
      message: "Deletion request recorded. An operator must process it manually for this alpha build.",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: error.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
