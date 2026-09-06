import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { resolveMediaUrl } from "@/lib/media";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getActiveProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 400 });

  const title = await prisma.title.findUnique({ where: { id: params.id } });
  if (!title || title.status !== "READY") return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (title.source === "TRAILER") {
    if (!title.trailerKey) return NextResponse.json({ error: "Not found" }, { status: 404 });
    return NextResponse.json({
      source: "TRAILER",
      title: title.name,
      trailerKey: title.trailerKey
    });
  }

  if (!title.hlsManifestKey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const progress = await prisma.watchProgress.findUnique({
    where: { profileId_titleId: { profileId: profile.id, titleId: title.id } }
  });

  return NextResponse.json({
    source: title.source,
    title: title.name,
    manifestUrl: resolveMediaUrl(title.hlsManifestKey),
    startPositionSeconds: progress?.positionSeconds ?? 0
  });
}
