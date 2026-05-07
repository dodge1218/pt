import { NextRequest } from "next/server";
import { ingestContextClawReceipt } from "@/lib/contextclaw-ingest";

export async function POST(req: NextRequest) {
  return ingestContextClawReceipt(req);
}
