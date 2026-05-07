import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

// GET /api/profile/voice — Get voice profile
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.voiceProfile.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json(profile || { exists: false });
}

// PUT /api/profile/voice — Create or update voice handshake
const voiceSchema = z.object({
  prefersLength: z.enum(["SHORT", "MEDIUM", "LONG"]).optional(),
  prefersStructure: z.enum(["BULLETS", "PROSE", "MIXED"]).optional(),
  prefersBottomLine: z.boolean().optional(),
  prefersContext: z.boolean().optional(),
  prefersFormality: z.enum(["FORMAL", "CASUAL", "MATCH_MINE"]).optional(),
  customNotes: z.string().max(2000).optional(),
});

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const data = voiceSchema.parse(body);

    const profile = await prisma.voiceProfile.upsert({
      where: { userId: session.user.id },
      update: data,
      create: {
        userId: session.user.id,
        ...data,
      },
    });

    return NextResponse.json(profile);
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
