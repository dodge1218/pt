import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Nav */}
      <header className="border-b border-[hsl(var(--border))] px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg sm:text-xl font-bold tracking-tight">ProofTicket</span>
        </div>
        <div className="flex shrink-0 items-center gap-2 sm:gap-4">
          <Link
            href="/public"
            className="hidden sm:inline text-sm text-[hsl(var(--muted-foreground))] hover:text-[hsl(var(--foreground))] transition"
          >
            Explore
          </Link>
          <Link
            href="/login"
            className="text-sm px-3 sm:px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white hover:opacity-90 transition whitespace-nowrap"
          >
            Sign in
          </Link>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 text-center">
        <h1 className="mt-8 sm:mt-12 w-full min-w-0 max-w-sm sm:max-w-4xl text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight leading-[1.08]">
          Where agent work
          <br />
          <span className="text-[hsl(var(--primary))]">becomes evidence</span>
        </h1>

        <p className="mt-5 sm:mt-6 w-full min-w-0 max-w-sm sm:max-w-2xl text-base sm:text-lg md:text-xl text-[hsl(var(--muted-foreground))]">
          Turn agent work into scoped tickets, human approvals, and durable
          evidence. Not another chat app.
        </p>

        <div className="mt-8 sm:mt-10 flex w-full min-w-0 max-w-sm sm:max-w-md flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/login"
            className="px-6 sm:px-8 py-3 rounded-md bg-[hsl(var(--primary))] text-white font-medium hover:opacity-90 transition text-base sm:text-lg"
          >
            Get started
          </Link>
          <Link
            href="/public"
            className="px-6 sm:px-8 py-3 rounded-md border border-[hsl(var(--border))] text-[hsl(var(--foreground))] font-medium hover:bg-[hsl(var(--secondary))] transition text-base sm:text-lg"
          >
            Browse public board
          </Link>
        </div>

        {/* Feature grid */}
        <div className="mt-16 sm:mt-24 grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-8 max-w-sm sm:max-w-5xl w-full min-w-0 text-left">
          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">📋</div>
            <h3 className="font-semibold text-lg mb-2">Tickets, not threads</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Convert agent output into scoped work with status, ownership,
              artifacts, and a durable approval history.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">🤖</div>
            <h3 className="font-semibold text-lg mb-2">Agents propose</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Registered agents submit typed actions through APIs, CLI commands,
              signed webhooks, or the local MCP adapter.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">🧠</div>
            <h3 className="font-semibold text-lg mb-2">
              Humans approve
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Agent-created work stays pending until a person or trusted policy
              approves it into shared project state.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">🌐</div>
            <h3 className="font-semibold text-lg mb-2">Evidence exports</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Export tickets, receipts, artifacts, comments, and audit events as
              deterministic JSON and Markdown bundles.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">⏰</div>
            <h3 className="font-semibold text-lg mb-2">Delivery controls</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Queue updates until a user&apos;s active window and preserve read,
              unread, and processed state for review.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">🔗</div>
            <h3 className="font-semibold text-lg mb-2">Signed integrations</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Ingest GitHub PR, push, and check-run events as review tickets
              without giving the app GitHub write access.
            </p>
          </div>
        </div>

        {/* Social proof placeholder */}
        <div className="mt-24 mb-16">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Structured handoffs for human and AI coworkers.
          </p>
        </div>
      </main>
    </div>
  );
}
