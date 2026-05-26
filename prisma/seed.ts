import { PrismaClient } from "@prisma/client";
import { createHash } from "crypto";

const prisma = new PrismaClient();
const demoAgentKey = "proofticket_demo_conductor_do_not_use_in_production";

function hashAgentApiKey(apiKey: string) {
  return createHash("sha256").update(apiKey).digest("hex");
}

async function main() {
  console.log("🌱 Seeding database...");

  // Create demo user (Builder One)
  const owner = await prisma.user.upsert({
    where: { email: "builder@example.com" },
    update: {},
    create: {
      name: "Builder One",
      email: "builder@example.com",
      github: "builder-demo",
      headline: "Coordinating async project work",
      bio: "Demo builder using scoped agent approvals and durable project tickets.",
      timezone: "America/New_York",
      activeStart: "14:30",
      activeEnd: "03:00",
    },
  });

  // Create demo user (Reviewer Two)
  const reviewer = await prisma.user.upsert({
    where: { email: "reviewer@example.com" },
    update: {},
    create: {
      name: "Reviewer Two",
      email: "reviewer@example.com",
      github: "reviewer-demo",
      headline: "Frontend architect. React 19 enthusiast.",
      bio: "Atomic design advocate. TypeScript purist. Builds accessible, maintainable UIs.",
      timezone: "America/New_York",
    },
  });

  console.log("  ✅ Users created");

  await prisma.friendship.upsert({
    where: {
      requesterId_receiverId: {
        requesterId: owner.id,
        receiverId: reviewer.id,
      },
    },
    update: { status: "ACCEPTED" },
    create: {
      requesterId: owner.id,
      receiverId: reviewer.id,
      status: "ACCEPTED",
    },
  });
  console.log("  ✅ Friendship created");

  // Create a bridge
  let bridge = await prisma.bridge.findFirst({
    where: {
      name: "Builder One + Reviewer Two — Demo Project",
      members: { some: { userId: owner.id } },
    },
  });
  if (!bridge) {
    bridge = await prisma.bridge.create({
      data: {
        name: "Builder One + Reviewer Two — Demo Project",
        members: {
          create: [
            { userId: owner.id, role: "OWNER" },
            { userId: reviewer.id, role: "MEMBER" },
          ],
        },
      },
    });
  } else {
    await prisma.bridgeMember.upsert({
      where: { userId_bridgeId: { userId: owner.id, bridgeId: bridge.id } },
      update: { role: "OWNER" },
      create: { userId: owner.id, bridgeId: bridge.id, role: "OWNER" },
    });
    await prisma.bridgeMember.upsert({
      where: { userId_bridgeId: { userId: reviewer.id, bridgeId: bridge.id } },
      update: { role: "MEMBER" },
      create: { userId: reviewer.id, bridgeId: bridge.id, role: "MEMBER" },
    });
  }

  console.log("  ✅ Bridge created");

  // Register an agent
  const existingAgent = await prisma.agentProxy.findFirst({
    where: {
      ownerId: owner.id,
      OR: [
        { name: "Conductor" },
        { apiKey: hashAgentApiKey(demoAgentKey) },
      ],
    },
  });
  const agent = existingAgent
    ? await prisma.agentProxy.update({
        where: { id: existingAgent.id },
        data: {
          name: "Conductor",
          description: "Builder One's orchestration agent. Reads docs, drafts responses, handles logistics.",
          apiKey: hashAgentApiKey(demoAgentKey),
          canCreateTickets: true,
          canRespond: true,
          canComment: true,
          requiresApproval: true,
        },
      })
    : await prisma.agentProxy.create({
        data: {
          name: "Conductor",
          description: "Builder One's orchestration agent. Reads docs, drafts responses, handles logistics.",
          ownerId: owner.id,
          apiKey: hashAgentApiKey(demoAgentKey),
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
      title: "[INFO] Demo project — weekly dependency updates found",
      content: `Found 12 dependency updates this week matching our target criteria:

- 4 Frontend package updates (React/TypeScript)
- 3 Full-stack dependency updates (Next.js preferred, startup stage)
- 2 Documentation updates (writing + coding)
- 3 Maintenance tasks (test and build pipeline focus)

All sourced from profile, package registries, and security advisories.

Next steps: Reviewer Two reviews the frontend updates, flags any worth reviewing. I'll handle the full-stack and maintenance ones.`,
      type: "INFO" as const,
      visibility: "PRIVATE" as const,
      tags: JSON.stringify(["dependencies", "weekly-update", "widget-agency"]),
      bridgeId: bridge.id,
      authorId: owner.id,
    },
    {
      title: "Should we use Next.js or Remix for the dashboard?",
      content: `Evaluating frameworks for the demo project dashboard. Key requirements:

1. SSR for SEO on public dependency notices
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
      authorId: owner.id,
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
      authorId: owner.id,
    },
    {
      title: "New branch: reviewer/widget-parser — review when you have 4 mins",
      content: `Reviewer Two pushed a new branch with the widget parser component.

**What changed:**
- \`src/components/widget-parser/\` — new Atomic-structured component
- Uses React 19 \`use()\` for data fetching (no useEffect!)
- Parses PDF widgets, extracts skills/experience into structured JSON
- TypeScript strict mode, full type coverage
- Unit tests passing (8/8)

**Branch:** \`reviewer/widget-parser\`
**PR:** Not yet — wanted your eyes on the architecture first.

Review when you have a few minutes. No rush — this is async.`,
      type: "STATUS" as const,
      visibility: "PRIVATE" as const,
      tags: JSON.stringify(["code-review", "branch", "widget-parser"]),
      bridgeId: bridge.id,
      authorId: reviewer.id,
    },
    {
      title: "Building a platform that matches collaborators by work patterns",
      content: `Hot take: profile-based matching is weak for finding collaborators.

Skills + industry + location tells you NOTHING about how someone thinks, what they're obsessed with, or whether they'll grind on a problem at 2am because they can't stop thinking about it.

What if you could match people based on:
- **What they actually build** (not what they say they know)
- **How deep they go** in each domain
- **Cross-domain connections** they make that others don't
- **Passion intensity** — measured by behavior, not self-reports

Working on something that does exactly this. Dev-first, async, agent-assisted.

If you've ever felt like the person who connects ideas across 5 different fields and can't find someone who gets it — this is for you.

What would you want in a collaborator matching tool?`,
      type: "PUBLIC" as const,
      visibility: "PUBLIC" as const,
      tags: JSON.stringify(["cofounders", "matching", "building-in-public"]),
      authorId: owner.id,
    },
    {
      title: "[PUBLIC] What's your most underrated dev tool right now?",
      content: `I'll go first: Groq for inference. Free tier, sub-second responses, multiple models. Perfect for agent pipelines where you need fast, cheap calls.

What's yours? Bonus points if it's free or has a generous free tier.`,
      type: "PUBLIC" as const,
      visibility: "PUBLIC" as const,
      tags: JSON.stringify(["dev-tools", "discussion", "community"]),
      authorId: owner.id,
    },
  ];

  const seededTickets = [];
  for (const ticketData of tickets) {
    const existing = await prisma.ticket.findFirst({
      where: {
        title: ticketData.title,
        authorId: ticketData.authorId,
        deletedAt: null,
      },
    });
    seededTickets.push(existing || await prisma.ticket.create({ data: ticketData }));
  }

  console.log(`  ✅ ${tickets.length} seed tickets created`);

  const dashboardDecisionTicket = seededTickets.find((ticket) =>
    ticket.title.includes("Next.js or Remix")
  );
  const branchReviewTicket = seededTickets.find((ticket) =>
    ticket.title.includes("widget-parser")
  );
  const weeklyJobsTicket = seededTickets.find((ticket) =>
    ticket.title.includes("weekly dependency updates")
  );

  if (dashboardDecisionTicket) {
    await prisma.ticketArtifact.upsert({
      where: { id: "seed-artifact-contextclaw-dashboard-manifest" },
      update: {
        ticketId: dashboardDecisionTicket.id,
        createdById: owner.id,
        title: "ContextClaw manifest — dashboard framework decision",
        summary: "Selected the minimum context for the Next.js vs Remix decision: requirements, deployment constraints, prior framework familiarity, and Reviewer Two's response.",
        metadata: JSON.stringify({
          missionId: "seed-mission-dashboard-framework",
          passId: "pass-001",
          contextManifestId: "manifest-dashboard-framework-001",
          includedArtifactIds: ["ticket:framework-options", "response:reviewer-agree"],
          excludedArtifactIds: ["full-chat-history", "unrelated-cofounder-notes"],
          budgetDecision: "send-summary-only",
          qualityRiskNote: "Low risk: decision criteria are explicit in ticket body.",
        }),
        inputTokens: 4200,
        outputTokens: 900,
        costUsd: 0.021,
      },
      create: {
        id: "seed-artifact-contextclaw-dashboard-manifest",
        kind: "CONTEXTCLAW_MANIFEST",
        title: "ContextClaw manifest — dashboard framework decision",
        summary: "Selected the minimum context for the Next.js vs Remix decision: requirements, deployment constraints, prior framework familiarity, and Reviewer Two's response.",
        metadata: JSON.stringify({
          missionId: "seed-mission-dashboard-framework",
          passId: "pass-001",
          contextManifestId: "manifest-dashboard-framework-001",
          includedArtifactIds: ["ticket:framework-options", "response:reviewer-agree"],
          excludedArtifactIds: ["full-chat-history", "unrelated-cofounder-notes"],
          budgetDecision: "send-summary-only",
          qualityRiskNote: "Low risk: decision criteria are explicit in ticket body.",
        }),
        inputTokens: 4200,
        outputTokens: 900,
        costUsd: 0.021,
        ticketId: dashboardDecisionTicket.id,
        createdById: owner.id,
      },
    });

    await prisma.ticketArtifact.upsert({
      where: { id: "seed-artifact-contextclaw-dashboard-receipt" },
      update: {
        ticketId: dashboardDecisionTicket.id,
        createdById: owner.id,
        title: "ContextClaw receipt — dashboard framework decision",
        summary: "Model pass reviewed the framework decision using the manifest instead of replaying the full project chat.",
        metadata: JSON.stringify({
          missionId: "seed-mission-dashboard-framework",
          passId: "pass-001",
          receiptId: "receipt-dashboard-framework-001",
          estimatedInputTokens: 4500,
          estimatedOutputTokens: 1000,
          estimatedCostUsd: 0.024,
          priceSnapshot: { provider: "openai", model: "gpt-demo", capturedAt: "2026-05-07" },
          budgetDecision: "approved",
          qualityRiskNote: "Matched ticket evidence; no raw transcript required.",
        }),
        provider: "openai",
        model: "gpt-demo",
        inputTokens: 4380,
        outputTokens: 812,
        contextSavedTokens: 28500,
        costUsd: 0.0224,
      },
      create: {
        id: "seed-artifact-contextclaw-dashboard-receipt",
        kind: "CONTEXTCLAW_RECEIPT",
        title: "ContextClaw receipt — dashboard framework decision",
        summary: "Model pass reviewed the framework decision using the manifest instead of replaying the full project chat.",
        metadata: JSON.stringify({
          missionId: "seed-mission-dashboard-framework",
          passId: "pass-001",
          receiptId: "receipt-dashboard-framework-001",
          estimatedInputTokens: 4500,
          estimatedOutputTokens: 1000,
          estimatedCostUsd: 0.024,
          priceSnapshot: { provider: "openai", model: "gpt-demo", capturedAt: "2026-05-07" },
          budgetDecision: "approved",
          qualityRiskNote: "Matched ticket evidence; no raw transcript required.",
        }),
        provider: "openai",
        model: "gpt-demo",
        inputTokens: 4380,
        outputTokens: 812,
        contextSavedTokens: 28500,
        costUsd: 0.0224,
        ticketId: dashboardDecisionTicket.id,
        createdById: owner.id,
      },
    });
  }

  if (branchReviewTicket) {
    await prisma.ticketArtifact.upsert({
      where: { id: "seed-artifact-openclaw-branch-handoff" },
      update: {
        ticketId: branchReviewTicket.id,
        createdById: reviewer.id,
        title: "OpenClaw handoff — widget parser review",
        uri: "artifact://openclaw/session/widget-parser/pass-002",
        summary: "Terminal manager captured the branch, files touched, test result, and requested review state.",
        metadata: JSON.stringify({
          source: "openclaw",
          missionId: "seed-mission-widget-parser",
          passId: "pass-002",
          terminalSessionId: "terminal-widget-parser-002",
          files: ["src/components/widget-parser", "tests/widget-parser.test.ts"],
        }),
      },
      create: {
        id: "seed-artifact-openclaw-branch-handoff",
        kind: "LINK",
        title: "OpenClaw handoff — widget parser review",
        uri: "artifact://openclaw/session/widget-parser/pass-002",
        summary: "Terminal manager captured the branch, files touched, test result, and requested review state.",
        metadata: JSON.stringify({
          source: "openclaw",
          missionId: "seed-mission-widget-parser",
          passId: "pass-002",
          terminalSessionId: "terminal-widget-parser-002",
          files: ["src/components/widget-parser", "tests/widget-parser.test.ts"],
        }),
        ticketId: branchReviewTicket.id,
        createdById: reviewer.id,
      },
    });
  }

  if (weeklyJobsTicket) {
    await prisma.ticketArtifact.upsert({
      where: { id: "seed-artifact-contextclaw-dependency-scan-receipt" },
      update: {
        ticketId: weeklyJobsTicket.id,
        createdById: owner.id,
        title: "ContextClaw receipt — weekly dependency scan",
        summary: "Routed a cheap extraction pass over dependency notices and saved the larger raw listing set as external artifact context.",
        metadata: JSON.stringify({
          missionId: "seed-mission-weekly-dependency-scan",
          passId: "pass-003",
          receiptId: "receipt-weekly-dependency-scan-003",
          budgetDecision: "approved-cheap-route",
          includedArtifactIds: ["artifact:dependency-summary"],
          excludedArtifactIds: ["raw-dependency-html", "duplicated-source-cache"],
        }),
        provider: "groq",
        model: "llama-demo-fast",
        inputTokens: 6200,
        outputTokens: 740,
        contextSavedTokens: 44100,
        costUsd: 0.0038,
      },
      create: {
        id: "seed-artifact-contextclaw-dependency-scan-receipt",
        kind: "CONTEXTCLAW_RECEIPT",
        title: "ContextClaw receipt — weekly dependency scan",
        summary: "Routed a cheap extraction pass over dependency notices and saved the larger raw listing set as external artifact context.",
        metadata: JSON.stringify({
          missionId: "seed-mission-weekly-dependency-scan",
          passId: "pass-003",
          receiptId: "receipt-weekly-dependency-scan-003",
          budgetDecision: "approved-cheap-route",
          includedArtifactIds: ["artifact:dependency-summary"],
          excludedArtifactIds: ["raw-dependency-html", "duplicated-source-cache"],
        }),
        provider: "groq",
        model: "llama-demo-fast",
        inputTokens: 6200,
        outputTokens: 740,
        contextSavedTokens: 44100,
        costUsd: 0.0038,
        ticketId: weeklyJobsTicket.id,
        createdById: owner.id,
      },
    });
  }

  console.log("  ✅ ContextClaw/OpenClaw demo artifacts created");

  // Add a response from Reviewer Two
  const decisionTicket = await prisma.ticket.findFirst({
    where: { title: { contains: "Next.js or Remix" } },
  });

  if (decisionTicket) {
    const existingResponse = await prisma.response.findFirst({
      where: {
        ticketId: decisionTicket.id,
        authorId: reviewer.id,
        deletedAt: null,
      },
    });

    if (!existingResponse) {
      await prisma.response.create({
        data: {
          content: `Agree — Next.js 15 is the move.

The App Router has matured significantly. Server Components + Server Actions give us most of what made Remix's loaders/actions compelling, but within the ecosystem we already know.

Additional points:
1. shadcn/ui integration is seamless with Next.js
2. Vercel's Image Optimization is free and useful for dependency notice thumbnails
3. The middleware API handles auth redirects cleanly

One thing to watch: the App Router caching behavior can be surprising. I'd suggest we set \`revalidate: 0\` on dynamic pages initially and optimize later.

Let's go with Next.js 15. I can scaffold the Atomic component structure this weekend.`,
          position: "AGREE",
          authorId: reviewer.id,
          ticketId: decisionTicket.id,
        },
      });
    }

    console.log("  ✅ Response from Reviewer Two added");
  }

  // Add an agent-created action (pending approval)
  const pendingPayload = {
    title: "[INFO] CI pipeline configured — GitHub Actions running on push",
    content: "Set up the GitHub Actions workflow:\n\n- Prisma client generation\n- Prisma schema validation\n- Production build\n- Production dependency audit\n\nRuns on every push to main and all PRs.\n\nWorkflow file: `.github/workflows/ci.yml`",
    type: "INFO",
    visibility: "PRIVATE",
    tags: ["ci", "github-actions", "devops"],
    bridgeId: bridge.id,
    _proofticket: { idempotencyKey: "seed-ci-pipeline-ticket" },
  };
  let pendingAction = await prisma.agentAction.findFirst({
    where: {
      agentProxyId: agent.id,
      type: "CREATE_TICKET",
      payload: { contains: "seed-ci-pipeline-ticket" },
    },
  });
  if (!pendingAction) {
    pendingAction = await prisma.agentAction.create({
      data: {
        type: "CREATE_TICKET",
        payload: JSON.stringify(pendingPayload),
        agentProxyId: agent.id,
      },
    });
  }

  await prisma.smartDelivery.upsert({
    where: { id: `seed-delivery-${pendingAction.id}` },
    update: {
      deliveredAt: new Date(),
      readAt: null,
      preview: "Conductor wants approval for the CI pipeline status ticket.",
    },
    create: {
      id: `seed-delivery-${pendingAction.id}`,
      type: "AGENT_ACTION_PENDING",
      contentId: pendingAction.id,
      preview: "Conductor wants approval for the CI pipeline status ticket.",
      userId: owner.id,
      scheduledFor: new Date(),
      deliveredAt: new Date(),
    },
  });

  await prisma.auditLog.upsert({
    where: { id: "seed-demo-audit" },
    update: {
      actorUserId: owner.id,
      metadata: JSON.stringify({
        tickets: seededTickets.length,
        bridgeId: bridge.id,
        agentProxyId: agent.id,
        artifactIds: [
          "seed-artifact-contextclaw-dashboard-manifest",
          "seed-artifact-contextclaw-dashboard-receipt",
          "seed-artifact-openclaw-branch-handoff",
          "seed-artifact-contextclaw-dependency-scan-receipt",
        ],
      }),
    },
    create: {
      id: "seed-demo-audit",
      actorUserId: owner.id,
      action: "seed.demo",
      entityType: "seed",
      metadata: JSON.stringify({
        tickets: seededTickets.length,
        bridgeId: bridge.id,
        agentProxyId: agent.id,
        artifactIds: [
          "seed-artifact-contextclaw-dashboard-manifest",
          "seed-artifact-contextclaw-dashboard-receipt",
          "seed-artifact-openclaw-branch-handoff",
          "seed-artifact-contextclaw-dependency-scan-receipt",
        ],
      }),
    },
  });

  console.log("  ✅ Pending agent action created");
  console.log("\n🎉 Seed complete!");
  console.log(`   Users: ${owner.name}, ${reviewer.name}`);
  console.log(`   Bridge: ${bridge.name}`);
  console.log(`   Agent: ${agent.name} (demo API key: ${demoAgentKey})`);
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
