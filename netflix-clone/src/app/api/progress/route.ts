import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({
  titleId: z.string(),
  positionSeconds: z.number().int().min(0),
  durationSeconds: z.number().int().min(0).optional()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getActiveProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 400 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const progress = await prisma.watchProgress.upsert({
    where: { profileId_titleId: { profileId: profile.id, titleId: parsed.data.titleId } },
    update: {
      positionSeconds: parsed.data.positionSeconds,
      durationSeconds: parsed.data.durationSeconds
    },
    create: {
      profileId: profile.id,
      titleId: parsed.data.titleId,
      positionSeconds: parsed.data.positionSeconds,
      durationSeconds: parsed.data.durationSeconds
    }
  });

  return NextResponse.json(progress);
}
