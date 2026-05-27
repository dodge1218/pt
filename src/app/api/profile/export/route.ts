import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { buildAccountExport } from "@/lib/account-export";
import { writeAuditLog } from "@/lib/audit";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const bundle = await buildAccountExport(session.user.id);
  if (!bundle) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const body = JSON.stringify(bundle, null, 2);
  await writeAuditLog({
    actorUserId: session.user.id,
    action: "account.export",
    entityType: "user",
    entityId: session.user.id,
    metadata: { schema: bundle.schema, exportedAt: bundle.exportedAt },
    req,
  });

  return new NextResponse(`${body}\n`, {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="proofticket-account-export-${session.user.id}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
