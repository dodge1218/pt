import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import {
  getPendingDeliveries,
  markDeliveryRead,
  processDeliveryQueue,
} from "@/lib/smart-delivery";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const deliveries = await getPendingDeliveries(session.user.id);
  return NextResponse.json({ deliveries });
}

const patchSchema = z.object({
  deliveryId: z.string().min(1),
  action: z.literal("mark_read"),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const data = patchSchema.parse(await req.json());
    const result = await markDeliveryRead(data.deliveryId, session.user.id);
    await writeAuditLog({
      actorUserId: session.user.id,
      action: "delivery.mark_read",
      entityType: "smart_delivery",
      entityId: data.deliveryId,
      metadata: { updated: result.count },
      req,
    });
    return NextResponse.json({ updated: result.count });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const cronSecret = process.env.PROOFTICKET_CRON_SECRET;
  const authHeader = req.headers.get("authorization");
  const hasCronAuth = Boolean(
    cronSecret && authHeader === `Bearer ${cronSecret}`
  );

  let actorUserId: string | null = null;
  if (!hasCronAuth) {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    actorUserId = session.user.id;
  }

  const result = await processDeliveryQueue();
  await writeAuditLog({
    actorUserId,
    action: "delivery.process_queue",
    entityType: "smart_delivery",
    metadata: { ...result, source: hasCronAuth ? "cron" : "user" },
    req,
  });
  return NextResponse.json(result);
}
