import { NextRequest, NextResponse } from "next/server";
import {
  contextClawManifestSchema,
  contextClawReceiptSchema,
  ingestContextClawManifest,
  ingestContextClawReceipt,
} from "@/lib/contextclaw-ingest";
import { z } from "zod";

const webhookSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("receipt"),
    payload: contextClawReceiptSchema,
  }),
  z.object({
    type: z.literal("manifest"),
    payload: contextClawManifestSchema,
  }),
]);

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = webhookSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", details: parsed.error.errors },
      { status: 400 }
    );
  }

  const forwarded = new NextRequest(req.url, {
    method: "POST",
    headers: req.headers,
    body: JSON.stringify(parsed.data.payload),
  });

  return parsed.data.type === "receipt"
    ? ingestContextClawReceipt(forwarded)
    : ingestContextClawManifest(forwarded);
}
