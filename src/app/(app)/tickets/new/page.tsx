import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { TicketForm } from "@/components/ticket-form";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <p className="text-sm text-[hsl(var(--muted-foreground))]">Tickets</p>
        <h1 className="text-2xl font-bold">Send ticket</h1>
        <p className="text-sm text-[hsl(var(--muted-foreground))] mt-2">
          Create a scoped handoff, proposal, status update, or public ticket.
        </p>
      </div>

      <TicketForm />
    </div>
  );
}
