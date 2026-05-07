import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/profile — Current user profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    include: {
      voiceProfile: true,
      interests: true,
      thinkingProfile: {
        select: {
          breadthScore: true,
          depthScore: true,
          synthesisScore: true,
          domains: true,
          bridges: true,
          projectCount: true,
          agentUsage: true,
          analyzedAt: true,
        },
      },
      agentProxies: {
        select: { id: true, name: true, description: true, canCreateTickets: true, canRespond: true, requiresApproval: true },
      },
      _count: {
        select: { tickets: true, responses: true, promptDumps: true },
      },
    },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json(user);
}

// PATCH /api/profile — Update profile
const updateProfileSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  headline: z.string().max(200).optional(),
  bio: z.string().max(2000).optional(),
  website: z.string().url().optional().or(z.literal("")),
  twitter: z.string().max(50).optional(),
  timezone: z.string().optional(),
  activeStart: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  activeEnd: z.string().regex(/^\d{2}:\d{2}$/).optional(),
  deliveryMode: z.enum(["SMART", "IMMEDIATE", "DIGEST"]).optional(),
});

export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = updateProfileSchema.parse(body);

    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data,
      select: {
        id: true, name: true, headline: true, bio: true, website: true,
        twitter: true, timezone: true, activeStart: true, activeEnd: true,
        deliveryMode: true,
      },
    });

    return NextResponse.json(updated);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
