import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { writeAuditLog } from "@/lib/audit";
import { z } from "zod";

const addMemberSchema = z.object({
  userId: z.string().min(1),
  role: z.enum(["MEMBER", "AGENT"]).default("MEMBER"),
});

const removeMemberSchema = z.object({
  userId: z.string().min(1),
});

async function requireBridgeOwner(bridgeId: string, userId: string) {
  return prisma.bridgeMember.findUnique({
    where: {
      userId_bridgeId: { userId, bridgeId },
    },
  }).then((membership) => membership?.role === "OWNER");
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bridgeId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await requireBridgeOwner(bridgeId, session.user.id))) {
    return NextResponse.json({ error: "Only bridge owners can add members" }, { status: 403 });
  }

  try {
    const data = addMemberSchema.parse(await req.json());
    if (data.userId === session.user.id) {
      return NextResponse.json({ error: "Owner is already a member" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true },
    });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const friendship = await prisma.friendship.findFirst({
      where: {
        status: "ACCEPTED",
        OR: [
          { requesterId: session.user.id, receiverId: data.userId },
          { requesterId: data.userId, receiverId: session.user.id },
        ],
      },
    });
    if (!friendship) {
      return NextResponse.json({ error: "Bridge members must be accepted friends" }, { status: 403 });
    }

    const member = await prisma.bridgeMember.upsert({
      where: {
        userId_bridgeId: { userId: data.userId, bridgeId },
      },
      update: { role: data.role },
      create: {
        userId: data.userId,
        bridgeId,
        role: data.role,
      },
    });

    await writeAuditLog({
      actorUserId: session.user.id,
      action: "bridge.member.add",
      entityType: "bridge",
      entityId: bridgeId,
      metadata: { memberUserId: data.userId, role: data.role },
      req,
    });

    return NextResponse.json(member, { status: 201 });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: bridgeId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!(await requireBridgeOwner(bridgeId, session.user.id))) {
    return NextResponse.json({ error: "Only bridge owners can remove members" }, { status: 403 });
  }

  try {
    const data = removeMemberSchema.parse(await req.json());
    const member = await prisma.bridgeMember.findUnique({
      where: {
        userId_bridgeId: { userId: data.userId, bridgeId },
      },
    });

    if (!member) {
      return NextResponse.json({ error: "Member not found" }, { status: 404 });
    }

    if (member.role === "OWNER") {
      const ownerCount = await prisma.bridgeMember.count({
        where: { bridgeId, role: "OWNER" },
      });
      if (ownerCount <= 1) {
        return NextResponse.json({ error: "Cannot remove the last owner" }, { status: 400 });
      }
    }

    await prisma.bridgeMember.delete({
      where: {
        userId_bridgeId: { userId: data.userId, bridgeId },
      },
    });

    await writeAuditLog({
      actorUserId: session.user.id,
      action: "bridge.member.remove",
      entityType: "bridge",
      entityId: bridgeId,
      metadata: { memberUserId: data.userId, role: member.role },
      req,
    });

    return NextResponse.json({ removed: true });
  } catch (e) {
    if (e instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: e.errors }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
