import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { getPlayAction } from "@/lib/providers";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getActiveProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 400 });

  const title = await prisma.title.findUnique({
    where: { id: params.id },
    include: { renditions: true, genres: { include: { genre: true } }, provider: true }
  });
  if (!title) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const watchlistEntry = await prisma.watchlistEntry.findUnique({
    where: { profileId_titleId: { profileId: profile.id, titleId: title.id } }
  });

  return NextResponse.json({
    ...title,
    genreNames: title.genres.map((g) => g.genre.name),
    inWatchlist: Boolean(watchlistEntry),
    play: title.status === "READY" ? getPlayAction(title) : null
  });
}
