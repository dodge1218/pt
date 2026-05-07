import Link from "next/link";

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col overflow-x-hidden">
      {/* Nav */}
      <header className="border-b border-[hsl(var(--border))] px-4 sm:px-6 py-4 flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-2">
          <span className="text-lg sm:text-xl font-bold tracking-tight">coordinate</span>
          <span className="text-xs text-[hsl(var(--muted-foreground))] mt-1">
            καιρός
          </span>
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
          Where builders
          <br />
          <span className="text-[hsl(var(--primary))]">coordinate</span>
        </h1>

        <p className="mt-5 sm:mt-6 w-full min-w-0 max-w-sm sm:max-w-2xl text-base sm:text-lg md:text-xl text-[hsl(var(--muted-foreground))]">
          Post what you&apos;re building. Find people who think like you. Let
          your agents handle the coordination. Not another chat app.
        </p>

        <div className="mt-8 sm:mt-10 flex w-full min-w-0 max-w-sm sm:max-w-md flex-col sm:flex-row gap-3 sm:gap-4">
          <Link
            href="/login"
            className="px-6 sm:px-8 py-3 rounded-md bg-[hsl(var(--primary))] text-white font-medium hover:opacity-90 transition text-base sm:text-lg"
          >
            Get started — it&apos;s free
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
              Every conversation has structure. Decisions, info posts, proposals
              — each with a lifecycle and a clear outcome.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">🤖</div>
            <h3 className="font-semibold text-lg mb-2">Agents are first-class</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Your agent reads everything, drafts responses, handles logistics.
              You approve what gets posted. Human decisions, agent speed.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">🧠</div>
            <h3 className="font-semibold text-lg mb-2">
              Find your cofounder
            </h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Matched by how you think, not your LinkedIn headline. We analyze
              what you build to find people with complementary brains.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">🌐</div>
            <h3 className="font-semibold text-lg mb-2">Public board</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Post what you care about. People comment, suggest, offer to build
              with you. Like tweets but with depth and follow-through.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">⏰</div>
            <h3 className="font-semibold text-lg mb-2">Smart delivery</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Signal arrives when you&apos;re ready, not when it&apos;s sent. No
              notification spam. No FOMO. Your rhythm, respected.
            </p>
          </div>

          <div className="min-w-0 p-6 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
            <div className="text-2xl mb-3">🔗</div>
            <h3 className="font-semibold text-lg mb-2">GitHub-native</h3>
            <p className="text-[hsl(var(--muted-foreground))] text-sm">
              Sign in with GitHub. Link repos. Get tickets when branches land.
              Your workflow, not ours.
            </p>
          </div>
        </div>

        {/* Social proof placeholder */}
        <div className="mt-24 mb-16">
          <p className="text-sm text-[hsl(var(--muted-foreground))]">
            Built by{" "}
            <a
              href="https://dreamsitebuilders.com"
              className="underline hover:text-[hsl(var(--foreground))]"
              target="_blank"
            >
              DreamSiteBuilders
            </a>
          </p>
        </div>
      </main>
    </div>
  );
}
