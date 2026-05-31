import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { ProjectForm } from "@/components/project-form";

export const dynamic = "force-dynamic";

export default async function NewProjectPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Projects</p>
        <h1 className="text-2xl font-bold">New project</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
          Create a workspace for related tickets, agent receipts, and evidence.
        </p>
      </div>

      <ProjectForm />
    </div>
  );
}
