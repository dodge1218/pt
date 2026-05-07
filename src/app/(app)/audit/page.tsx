export const dynamic = "force-dynamic";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { parseAuditMetadata } from "@/lib/audit";
import { redirect } from "next/navigation";

export default async function AuditPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const logs = await prisma.auditLog.findMany({
    where: { actorUserId: session.user.id },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="mx-auto max-w-4xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Audit Log</h1>
        <p className="mt-1 text-sm text-[hsl(var(--muted-foreground))]">
          Recent agent, bridge, and delivery control-plane actions.
        </p>
      </div>

      {logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-[hsl(var(--border))] py-12 text-center">
          <p className="text-[hsl(var(--muted-foreground))]">No audit events yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {logs.map((log) => {
            const metadata = parseAuditMetadata(log.metadata);
            return (
              <section
                key={log.id}
                className="rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] p-3"
              >
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs text-[hsl(var(--primary))]">{log.action}</span>
                  <span className="text-xs text-[hsl(var(--muted-foreground))]">
                    {log.entityType}
                    {log.entityId ? `:${log.entityId.slice(0, 8)}` : ""}
                  </span>
                  <span className="ml-auto text-xs text-[hsl(var(--muted-foreground))]">
                    {log.createdAt.toLocaleString()}
                  </span>
                </div>
                {Object.keys(metadata).length > 0 && (
                  <pre className="mt-2 max-h-32 overflow-auto rounded-md bg-[hsl(var(--background))] p-2 text-[10px] text-[hsl(var(--muted-foreground))]">
                    {JSON.stringify(metadata, null, 2)}
                  </pre>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
