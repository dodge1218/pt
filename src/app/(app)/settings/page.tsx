export const dynamic = "force-dynamic";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      voiceProfile: true,
      agentProxies: { select: { id: true, name: true, apiKey: true, requiresApproval: true, canCreateTickets: true, canRespond: true } },
    },
  });

  if (!user) redirect("/login");

  return (
    <div className="min-h-screen bg-[hsl(var(--background))]">
      <header className="border-b border-[hsl(var(--border))] px-6 py-3 flex items-center gap-6">
        <Link href="/dashboard" className="text-lg font-bold tracking-tight">ProofTicket</Link>
        <span className="text-sm text-[hsl(var(--muted-foreground))]">/ Settings</span>
      </header>

      <main className="max-w-2xl mx-auto px-6 py-8 space-y-10">
        {/* Profile */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Profile</h2>
          <form id="profile-form" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Name</label>
                <input name="name" defaultValue={user.name || ""} className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Headline</label>
                <input name="headline" defaultValue={user.headline || ""} placeholder="What are you building?" className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Bio</label>
              <textarea name="bio" defaultValue={user.bio || ""} rows={3} className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm resize-y" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Website</label>
                <input name="website" defaultValue={user.website || ""} placeholder="https://" className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Twitter</label>
                <input name="twitter" defaultValue={user.twitter || ""} placeholder="@handle" className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition">Save Profile</button>
          </form>
          <script dangerouslySetInnerHTML={{ __html: `
            document.getElementById('profile-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const f = e.target;
              const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  name: f.name.value, headline: f.headline.value,
                  bio: f.bio.value, website: f.website.value, twitter: f.twitter.value
                })
              });
              alert(res.ok ? 'Saved!' : 'Error saving');
            });
          `}} />
        </section>

        {/* Smart Delivery */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Delivery Timing</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
            Control when notifications reach you. Smart mode delivers at the right moment, not just the first moment.
          </p>
          <form id="delivery-form" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              {[
                { value: "SMART", label: "⏳ Smart", desc: "Right-time delivery" },
                { value: "IMMEDIATE", label: "⚡ Immediate", desc: "Real-time" },
                { value: "DIGEST", label: "📋 Digest", desc: "Daily batch" },
              ].map((mode) => (
                <label key={mode.value} className="cursor-pointer">
                  <input type="radio" name="deliveryMode" value={mode.value} className="peer hidden" defaultChecked={user.deliveryMode === mode.value} />
                  <div className="p-3 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-center text-xs peer-checked:border-[hsl(var(--primary))] peer-checked:bg-[hsl(var(--primary))]/10 transition">
                    <div className="text-lg">{mode.label.split(" ")[0]}</div>
                    <div className="mt-1 font-medium">{mode.label.split(" ").slice(1).join(" ")}</div>
                    <div className="text-[hsl(var(--muted-foreground))] mt-0.5">{mode.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Timezone</label>
                <input name="timezone" defaultValue={user.timezone} className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Active start</label>
                <input name="activeStart" type="time" defaultValue={user.activeStart} className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Active end</label>
                <input name="activeEnd" type="time" defaultValue={user.activeEnd} className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm" />
              </div>
            </div>
            <button type="submit" className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition">Save Delivery</button>
          </form>
          <script dangerouslySetInnerHTML={{ __html: `
            document.getElementById('delivery-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const f = e.target;
              const res = await fetch('/api/profile', {
                method: 'PATCH',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  deliveryMode: f.querySelector('input[name="deliveryMode"]:checked')?.value,
                  timezone: f.timezone.value,
                  activeStart: f.activeStart.value,
                  activeEnd: f.activeEnd.value,
                })
              });
              alert(res.ok ? 'Saved!' : 'Error saving');
            });
          `}} />
        </section>

        {/* Voice Handshake */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Voice Handshake</h2>
          <p className="text-xs text-[hsl(var(--muted-foreground))] mb-4">
            Tell people (and their agents) how you prefer to communicate.
          </p>
          <form id="voice-form" className="space-y-4">
            <div className="grid grid-cols-3 gap-2">
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Length</label>
                <select name="prefersLength" defaultValue={user.voiceProfile?.prefersLength || "MEDIUM"} className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm">
                  <option value="SHORT">Short (1-3 sentences)</option>
                  <option value="MEDIUM">Medium (1-2 paragraphs)</option>
                  <option value="LONG">Long (full context)</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Structure</label>
                <select name="prefersStructure" defaultValue={user.voiceProfile?.prefersStructure || "MIXED"} className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm">
                  <option value="BULLETS">Bullet points</option>
                  <option value="PROSE">Flowing paragraphs</option>
                  <option value="MIXED">Whatever fits</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Formality</label>
                <select name="prefersFormality" defaultValue={user.voiceProfile?.prefersFormality || "CASUAL"} className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm">
                  <option value="FORMAL">Formal</option>
                  <option value="CASUAL">Casual</option>
                  <option value="MATCH_MINE">Mirror my style</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1 text-[hsl(var(--muted-foreground))]">Custom notes</label>
              <textarea name="customNotes" defaultValue={user.voiceProfile?.customNotes || ""} rows={2} placeholder="Any specific communication preferences..." className="w-full px-3 py-2 rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] text-sm resize-y" />
            </div>
            <button type="submit" className="px-4 py-2 rounded-md bg-[hsl(var(--primary))] text-white text-sm font-medium hover:opacity-90 transition">Save Voice</button>
          </form>
          <script dangerouslySetInnerHTML={{ __html: `
            document.getElementById('voice-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const f = e.target;
              const res = await fetch('/api/profile/voice', {
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  prefersLength: f.prefersLength.value,
                  prefersStructure: f.prefersStructure.value,
                  prefersFormality: f.prefersFormality.value,
                  customNotes: f.customNotes.value,
                })
              });
              alert(res.ok ? 'Saved!' : 'Error saving');
            });
          `}} />
        </section>

        {/* Agents */}
        <section>
          <h2 className="text-lg font-semibold mb-4">Your Agents</h2>
          {user.agentProxies.length === 0 ? (
            <p className="text-sm text-[hsl(var(--muted-foreground))]">No agents registered yet.</p>
          ) : (
            <div className="space-y-3">
              {user.agentProxies.map((agent) => (
                <div key={agent.id} className="p-4 rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))]">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium text-sm">🤖 {agent.name}</h3>
                    <span className={`text-xs ${agent.requiresApproval ? "text-yellow-400" : "text-green-400"}`}>
                      {agent.requiresApproval ? "Manual approval" : "Auto-approve"}
                    </span>
                  </div>
                  <div className="text-xs text-[hsl(var(--muted-foreground))] mt-1 font-mono">
                    Key digest: {agent.apiKey.slice(0, 8)}...
                  </div>
                  <div className="flex gap-2 mt-2 text-xs text-[hsl(var(--muted-foreground))]">
                    {agent.canCreateTickets && <span className="px-2 py-0.5 rounded bg-[hsl(var(--secondary))]">tickets</span>}
                    {agent.canRespond && <span className="px-2 py-0.5 rounded bg-[hsl(var(--secondary))]">responses</span>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* Data Controls */}
        <section>
          <h2 className="text-lg font-semibold mb-2">Data Controls</h2>
          <p className="mb-4 text-xs text-[hsl(var(--muted-foreground))]">
            Export your own profile, tickets, responses, comments, artifacts, agent metadata, deliveries, and audit events as redacted JSON.
          </p>
          <a
            href="/api/profile/export"
            className="inline-flex rounded-md border border-[hsl(var(--border))] px-4 py-2 text-sm font-medium transition hover:bg-[hsl(var(--secondary))]"
          >
            Export account data
          </a>
          <form id="deletion-request-form" className="mt-6 space-y-3 rounded-lg border border-[hsl(var(--border))] p-4">
            <div>
              <h3 className="text-sm font-semibold">Request account deletion</h3>
              <p className="mt-1 text-xs text-[hsl(var(--muted-foreground))]">
                This records a manual deletion request for the alpha. It does not immediately remove shared records.
              </p>
            </div>
            <label className="block text-xs font-medium">
              Confirmation
              <input
                name="confirmation"
                placeholder="delete my account"
                className="mt-1 w-full rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
              />
            </label>
            <label className="block text-xs font-medium">
              Reason
              <textarea
                name="reason"
                rows={2}
                className="mt-1 w-full resize-y rounded-md border border-[hsl(var(--border))] bg-[hsl(var(--card))] px-3 py-2 text-sm"
              />
            </label>
            <button type="submit" className="rounded-md border border-red-500/50 px-4 py-2 text-sm font-medium text-red-500 transition hover:bg-red-500/10">
              Record deletion request
            </button>
          </form>
          <script dangerouslySetInnerHTML={{ __html: `
            document.getElementById('deletion-request-form').addEventListener('submit', async (e) => {
              e.preventDefault();
              const f = e.target;
              const res = await fetch('/api/profile/deletion-request', {
                method: 'POST',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify({
                  confirmation: f.confirmation.value,
                  reason: f.reason.value,
                })
              });
              const body = await res.json().catch(() => ({}));
              alert(res.ok ? 'Deletion request recorded.' : (body.error || 'Error recording deletion request'));
              if (res.ok) f.reset();
            });
          `}} />
        </section>
      </main>
    </div>
  );
}
