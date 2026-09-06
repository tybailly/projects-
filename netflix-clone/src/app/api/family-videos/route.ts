import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getActiveProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 400 });

  const [videos, continueWatching] = await Promise.all([
    prisma.title.findMany({
      where: { source: "UPLOAD" },
      orderBy: { createdAt: "desc" }
    }),
    prisma.watchProgress.findMany({
      where: { profileId: profile.id, title: { source: "UPLOAD" } },
      include: { title: true },
      orderBy: { updatedAt: "desc" }
    })
  ]);

  return NextResponse.json({
    continueWatching: continueWatching.map((w) => ({ id: w.title.id, name: w.title.name, posterUrl: w.title.posterUrl })),
    videos: videos.map((v) => ({
      id: v.id,
      name: v.name,
      posterUrl: v.posterUrl,
      status: v.status
    }))
  });
}
