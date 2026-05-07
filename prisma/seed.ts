import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user (Ryan)
  const ryan = await prisma.user.upsert({
    where: { email: "ryan@dreamsitebuilders.com" },
    update: {},
    create: {
      name: "Ryan",
      email: "ryan@dreamsitebuilders.com",
      github: "dodge1218",
      headline: "Building 6 things at once",
      bio: "Full-stack dev. Running DreamSiteBuilders. Building tools for builders who use AI as core workflow.",
      timezone: "America/New_York",
      activeStart: "14:30",
      activeEnd: "03:00",
    },
  });

  // Create demo user (Colin)
  const colin = await prisma.user.upsert({
    where: { email: "colin@example.com" },
    update: {},
    create: {
      name: "Colin",
      email: "colin@example.com",
      github: "c-birdwell",
      headline: "Frontend architect. React 19 enthusiast.",
      bio: "Atomic design advocate. TypeScript purist. Builds accessible, maintainable UIs.",
      timezone: "America/New_York",
    },
  });

  console.log("  ✅ Users created");

  // Create a bridge
  const bridge = await prisma.bridge.create({
    data: {
      name: "Ryan + Colin — Resume Agency",
      members: {
        create: [
          { userId: ryan.id, role: "OWNER" },
          { userId: colin.id, role: "MEMBER" },
        ],
      },
    },
  });

  console.log("  ✅ Bridge created");

  // Register an agent
  const agent = await prisma.agentProxy.create({
    data: {
      name: "Conductor",
      description: "Ryan's orchestration agent. Reads docs, drafts responses, handles logistics.",
      ownerId: ryan.id,
      canCreateTickets: true,
      canRespond: true,
      canComment: true,
      requiresApproval: true,
    },
  });

  console.log("  ✅ Agent registered");

  // Seed tickets — professional Bridge tone
  const tickets = [
    {
      title: "[INFO] Resume agency — weekly job matches found",
      content: `Found 12 new listings this week matching our target criteria:

- 4 Senior Frontend roles (React/TypeScript, remote, $150K+)
- 3 Full-Stack positions (Next.js preferred, startup stage)
- 2 DevRel/Developer Advocate roles (writing + coding)
- 3 Contract/Freelance gigs (1-3 month, web dev focus)

All sourced from LinkedIn, AngelList, and HN Who's Hiring.

Next steps: Colin reviews the frontend roles, flags any worth applying to. I'll handle the full-stack and freelance ones.`,
      type: "INFO" as const,
      visibility: "PRIVATE" as const,
      tags: JSON.stringify(["jobs", "weekly-update", "resume-agency"]),
      bridgeId: bridge.id,
      authorId: ryan.id,
    },
    {
      title: "Should we use Next.js or Remix for the dashboard?",
      content: `Evaluating frameworks for the resume agency dashboard. Key requirements:

1. SSR for SEO on public job listings
2. API routes for backend logic (no separate server)
3. Auth integration (GitHub OAuth)
4. Good DX with TypeScript
5. Vercel deployment (free tier matters right now)

**Next.js 15:**
- We both know it well
- App Router is stable now
- Vercel native = zero config deploy
- Huge ecosystem, shadcn/ui works perfectly

**Remix:**
- Better data loading patterns (loaders/actions)
- Less "magic" — more explicit
- Newer, less ecosystem support
- Can deploy to Vercel but not as native

My lean: Next.js 15. We know it, it deploys for free, and the App Router handles everything we need. Remix is interesting but switching costs aren't worth it for this project.

What's your take?`,
      type: "DECISION" as const,
      visibility: "PRIVATE" as const,
      tags: JSON.stringify(["architecture", "frontend", "decision"]),
      bridgeId: bridge.id,
      authorId: ryan.id,
    },
    {
      title: "[INFO] Free API credits you can use right now",
      content: `Compiled a list of free API tiers that are useful for our projects:

| Service | Free Tier | Useful For |
|---------|-----------|-----------|
| Groq | 6K RPM, multiple models | Fast inference, summaries |
| Google Gemini | 1.5M tokens/day per auth | Analysis, embeddings |
| Vercel | 100GB bandwidth/mo | Hosting |
| Supabase | 500MB DB, 50K auth users | Database + auth |
| GitHub Actions | 2K min/mo (private) | CI/CD |
| Resend | 3K emails/mo | Notifications |

All of these are production-quality. Combined, they give us a full stack for $0/mo until we hit real scale.`,
      type: "INFO" as const,
      visibility: "PRIVATE" as const,
      tags: JSON.stringify(["resources", "cost-optimization"]),
      bridgeId: bridge.id,
      authorId: ryan.id,
    },
    {
      title: "New branch: colin/resume-parser — review when you have 4 mins",
      content: `Colin pushed a new branch with the resume parser component.

**What changed:**
- \`src/components/resume-parser/\` — new Atomic-structured component
- Uses React 19 \`use()\` for data fetching (no useEffect!)
- Parses PDF resumes, extracts skills/experience into structured JSON
- TypeScript strict mode, full type coverage
- Unit tests passing (8/8)

**Branch:** \`colin/resume-parser\`
**PR:** Not yet — wanted your eyes on the architecture first.

Review when you have a few minutes. No rush — this is async.`,
      type: "STATUS" as const,
      visibility: "PRIVATE" as const,
      tags: JSON.stringify(["code-review", "branch", "resume-parser"]),
      bridgeId: bridge.id,
      authorId: colin.id,
    },
    {
      title: "Building a platform that matches cofounders by thinking patterns, not resumes",
      content: `Hot take: LinkedIn-style matching is fundamentally broken for finding cofounders.

Skills + industry + location tells you NOTHING about how someone thinks, what they're obsessed with, or whether they'll grind on a problem at 2am because they can't stop thinking about it.

What if you could match people based on:
- **What they actually build** (not what they say they know)
- **How deep they go** in each domain
- **Cross-domain connections** they make that others don't
- **Passion intensity** — measured by behavior, not self-reports

Working on something that does exactly this. Dev-first, async, agent-assisted.

If you've ever felt like the person who connects ideas across 5 different fields and can't find someone who gets it — this is for you.

What would you want in a cofounder matching tool?`,
      type: "PUBLIC" as const,
      visibility: "PUBLIC" as const,
      tags: JSON.stringify(["cofounders", "matching", "building-in-public"]),
      authorId: ryan.id,
    },
    {
      title: "[PUBLIC] What's your most underrated dev tool right now?",
      content: `I'll go first: Groq for inference. Free tier, sub-second responses, multiple models. Perfect for agent pipelines where you need fast, cheap calls.

What's yours? Bonus points if it's free or has a generous free tier.`,
      type: "PUBLIC" as const,
      visibility: "PUBLIC" as const,
      tags: JSON.stringify(["dev-tools", "discussion", "community"]),
      authorId: ryan.id,
    },
  ];

  for (const ticketData of tickets) {
    await prisma.ticket.create({ data: ticketData });
  }

  console.log(`  ✅ ${tickets.length} seed tickets created`);

  // Add a response from Colin
  const decisionTicket = await prisma.ticket.findFirst({
    where: { title: { contains: "Next.js or Remix" } },
  });

  if (decisionTicket) {
    await prisma.response.create({
      data: {
        content: `Agree — Next.js 15 is the move.

The App Router has matured significantly. Server Components + Server Actions give us most of what made Remix's loaders/actions compelling, but within the ecosystem we already know.

Additional points:
1. shadcn/ui integration is seamless with Next.js
2. Vercel's Image Optimization is free and useful for job listing thumbnails
3. The middleware API handles auth redirects cleanly

One thing to watch: the App Router caching behavior can be surprising. I'd suggest we set \`revalidate: 0\` on dynamic pages initially and optimize later.

Let's go with Next.js 15. I can scaffold the Atomic component structure this weekend.`,
        position: "AGREE",
        authorId: colin.id,
        ticketId: decisionTicket.id,
      },
    });

    console.log("  ✅ Response from Colin added");
  }

  // Add an agent-created action (pending approval)
  await prisma.agentAction.create({
    data: {
      type: "CREATE_TICKET",
      payload: JSON.stringify({
        title: "[INFO] CI pipeline configured — GitHub Actions running on push",
        content: "Set up the GitHub Actions workflow:\n\n- Lint (ESLint + Prettier)\n- Type check (tsc --noEmit)\n- Unit tests (Vitest)\n- Build check (next build)\n\nRuns on every push to main and all PRs. Free for public repos, 2K min/mo for private.\n\nWorkflow file: `.github/workflows/ci.yml`",
        type: "INFO",
        visibility: "PRIVATE",
        tags: JSON.stringify(["ci", "github-actions", "devops"]),
        bridgeId: bridge.id,
      }),
      agentProxyId: agent.id,
    },
  });

  console.log("  ✅ Pending agent action created");
  console.log("\n🎉 Seed complete!");
  console.log(`   Users: ${ryan.name}, ${colin.name}`);
  console.log(`   Bridge: ${bridge.name}`);
  console.log(`   Agent: ${agent.name} (API key: ${agent.apiKey})`);
  console.log(`   Tickets: ${tickets.length}`);
  console.log(`   Pending actions: 1`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
