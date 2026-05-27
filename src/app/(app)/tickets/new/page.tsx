import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function NewTicketPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-[hsl(var(--border))] px-6 py-3 flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">ProofTicket</Link>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">/ New Ticket</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8">
        <h1 className="text-2xl font-bold mb-6">Create Ticket</h1>

        <form id="ticket-form" className="space-y-6">
          {/* Type */}
          <div>
            <label className="block text-sm font-medium mb-2">Type</label>
            <div className="grid grid-cols-5 gap-2">
              {[
                { value: "DECISION", label: "🔀 Decision", desc: "Requires positions" },
                { value: "INFO", label: "ℹ️ Info", desc: "One-way update" },
                { value: "PROPOSAL", label: "📋 Proposal", desc: "Needs approval" },
                { value: "STATUS", label: "📊 Status", desc: "Progress update" },
                { value: "PUBLIC", label: "🌐 Public", desc: "Anyone can reply" },
              ].map((t) => (
                <label key={t.value} className="cursor-pointer">
                  <input type="radio" name="type" value={t.value} className="peer hidden" defaultChecked={t.value === "DECISION"} />
                  <div className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center text-xs peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))]/10 transition">
                    <div className="text-lg">{t.label.split(" ")[0]}</div>
                    <div className="mt-1 font-medium">{t.label.split(" ")[1]}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-sm font-medium mb-2">Title</label>
            <input
              id="title"
              name="title"
              type="text"
              required
              maxLength={200}
              placeholder="What's this about?"
              className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none transition"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-sm font-medium mb-2">Content</label>
            <textarea
              id="content"
              name="content"
              required
              rows={8}
              maxLength={10000}
              placeholder="Share your thoughts, question, update, or proposal..."
              className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none transition resize-y"
            />
          </div>

          {/* Tags */}
          <div>
            <label htmlFor="tags" className="block text-sm font-medium mb-2">Tags <span className="text-[hsl(var(--muted-foreground))] font-normal">(comma-separated)</span></label>
            <input
              id="tags"
              name="tags"
              type="text"
              placeholder="e.g. architecture, frontend, urgent"
              className="w-full px-4 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm focus:border-[hsl(var(--primary))] focus:outline-none transition"
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-between pt-4">
            <Link href="/dashboard" className="text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))]">
              Cancel
            </Link>
            <button
              type="submit"
              className="px-6 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition"
            >
              Create Ticket
            </button>
          </div>
        </form>

        <script
          dangerouslySetInnerHTML={{
            __html: `
              document.getElementById('ticket-form').addEventListener('submit', async (e) => {
                e.preventDefault();
                const form = e.target;
                const data = {
                  title: form.title.value,
                  content: form.content.value,
                  type: form.querySelector('input[name="type"]:checked')?.value || 'DECISION',
                  visibility: form.querySelector('input[name="type"]:checked')?.value === 'PUBLIC' ? 'PUBLIC' : 'PRIVATE',
                  tags: form.tags.value ? form.tags.value.split(',').map(t => t.trim()).filter(Boolean) : [],
                };
                
                const btn = form.querySelector('button[type="submit"]');
                btn.disabled = true;
                btn.textContent = 'Creating...';
                
                try {
                  const res = await fetch('/api/tickets', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(data),
                  });
                  
                  if (res.ok) {
                    const ticket = await res.json();
                    window.location.href = '/tickets/' + ticket.id;
                  } else {
                    const err = await res.json();
                    alert(err.error || 'Failed to create ticket');
                    btn.disabled = false;
                    btn.textContent = 'Create Ticket';
                  }
                } catch (e) {
                  alert('Network error');
                  btn.disabled = false;
                  btn.textContent = 'Create Ticket';
                }
              });
            `,
          }}
        />
      </main>
    </div>
  );
}
