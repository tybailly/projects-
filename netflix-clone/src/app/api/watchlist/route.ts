import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ titleId: z.string() });

async function requireProfile() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };

  const profile = await getActiveProfile(session.user.id);
  if (!profile) return { error: NextResponse.json({ error: "No active profile" }, { status: 400 }) };

  return { profile };
}

export async function GET() {
  const { profile, error } = await requireProfile();
  if (error) return error;

  const entries = await prisma.watchlistEntry.findMany({
    where: { profileId: profile!.id },
    include: { title: true },
    orderBy: { addedAt: "desc" }
  });
  return NextResponse.json(entries);
}

export async function POST(request: Request) {
  const { profile, error } = await requireProfile();
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const entry = await prisma.watchlistEntry.upsert({
    where: { profileId_titleId: { profileId: profile!.id, titleId: parsed.data.titleId } },
    update: {},
    create: { profileId: profile!.id, titleId: parsed.data.titleId }
  });
  return NextResponse.json(entry, { status: 201 });
}

export async function DELETE(request: Request) {
  const { profile, error } = await requireProfile();
  if (error) return error;

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await prisma.watchlistEntry
    .delete({
      where: { profileId_titleId: { profileId: profile!.id, titleId: parsed.data.titleId } }
    })
    .catch(() => null);

  return NextResponse.json({ ok: true });
}
