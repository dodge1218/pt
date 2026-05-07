import { NextRequest } from "next/server";
import { ingestContextClawManifest } from "@/lib/contextclaw-ingest";

export async function POST(req: NextRequest) {
  return ingestContextClawManifest(req);
}
