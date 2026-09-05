import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { resolveMediaUrl } from "@/lib/media";
import { VideoPlayer } from "@/components/VideoPlayer";
import { TrailerPlayer } from "@/components/TrailerPlayer";

export default async function WatchPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const profile = await getActiveProfile(session!.user.id);
  if (!profile) return null;

  const title = await prisma.title.findUnique({ where: { id: params.id } });
  if (!title || title.status !== "READY") notFound();

  if (title.source === "TRAILER") {
    if (!title.trailerKey) notFound();
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-black">
        <TrailerPlayer titleId={title.id} trailerKey={title.trailerKey} title={title.name} />
      </div>
    );
  }

  if (!title.hlsManifestKey) notFound();

  const progress = await prisma.watchProgress.findUnique({
    where: { profileId_titleId: { profileId: profile.id, titleId: title.id } }
  });

  const manifestUrl = resolveMediaUrl(title.hlsManifestKey)!;

  return (
    <div className="flex h-screen w-screen items-center justify-center bg-black">
      <VideoPlayer
        titleId={title.id}
        src={manifestUrl}
        startPosition={progress?.positionSeconds ?? 0}
        title={title.name}
      />
    </div>
  );
}
