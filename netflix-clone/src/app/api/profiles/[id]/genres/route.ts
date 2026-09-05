import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const bodySchema = z.object({ genreIds: z.array(z.string()) });

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await prisma.profile.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  await prisma.$transaction([
    prisma.profileGenre.deleteMany({ where: { profileId: profile.id } }),
    prisma.profileGenre.createMany({
      data: parsed.data.genreIds.map((genreId) => ({ profileId: profile.id, genreId })),
      skipDuplicates: true
    })
  ]);

  return NextResponse.json({ ok: true });
}
