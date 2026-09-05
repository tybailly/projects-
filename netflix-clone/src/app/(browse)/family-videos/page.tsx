import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { Carousel } from "@/components/Carousel";
import { TitleCard } from "@/components/TitleCard";

export default async function FamilyVideosPage() {
  const session = await getServerSession(authOptions);
  const profile = await getActiveProfile(session!.user.id);
  if (!profile) return null;

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

  return (
    <div className="px-6 py-8 sm:px-12">
      <div className="mb-8 flex items-center justify-between">
        <h1 className="text-3xl font-bold text-white">Family Videos</h1>
        <Link href="/admin/upload" className="rounded bg-brand-red px-5 py-2 font-semibold text-white hover:bg-red-700">
          + Upload Video
        </Link>
      </div>

      <Carousel
        heading="Continue Watching"
        titles={continueWatching.map((w) => ({ id: w.title.id, name: w.title.name, posterUrl: w.title.posterUrl }))}
      />

      <section>
        <h2 className="mb-3 text-lg font-semibold text-white sm:text-xl">All Family Videos</h2>
        {videos.length === 0 ? (
          <p className="text-neutral-400">
            No family videos yet.{" "}
            <Link href="/admin/upload" className="text-white hover:underline">
              Upload your first one
            </Link>
            .
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {videos.map((video) => (
              <TitleCard
                key={video.id}
                title={{
                  id: video.id,
                  name: video.name,
                  posterUrl: video.posterUrl,
                  badge: video.status !== "READY" ? video.status : undefined
                }}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
