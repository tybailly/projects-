import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { WatchlistButton } from "@/components/WatchlistButton";

export default async function TitleDetailPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  const profile = await getActiveProfile(session!.user.id);
  if (!profile) return null;

  const title = await prisma.title.findUnique({
    where: { id: params.id },
    include: { genres: { include: { genre: true } } }
  });
  if (!title) notFound();

  const watchlistEntry = await prisma.watchlistEntry.findUnique({
    where: { profileId_titleId: { profileId: profile.id, titleId: title.id } }
  });

  return (
    <div>
      <div
        className="relative flex h-[50vh] items-end bg-neutral-900 bg-cover bg-center"
        style={{ backgroundImage: title.backdropUrl ? `url(${title.backdropUrl})` : undefined }}
      >
        <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-black/40 to-transparent" />
        <div className="relative z-10 px-6 pb-10 sm:px-12">
          <h1 className="mb-2 text-4xl font-bold text-white">{title.name}</h1>
          <div className="mb-4 flex gap-3 text-sm text-neutral-300">
            {title.releaseYear && <span>{title.releaseYear}</span>}
            {title.maturityRating && <span className="rounded border border-neutral-500 px-1.5">{title.maturityRating}</span>}
            {title.durationSeconds && <span>{Math.round(title.durationSeconds / 60)} min</span>}
          </div>
        </div>
      </div>

      <div className="px-6 py-6 sm:px-12">
        {title.status === "READY" ? (
          <Link href={`/watch/${title.id}`} className="mb-4 inline-block rounded bg-white px-6 py-2 font-semibold text-black hover:bg-neutral-200">
            ▶ Play
          </Link>
        ) : (
          <p className="mb-4 rounded bg-neutral-800 px-4 py-2 text-sm text-neutral-300">
            {title.status === "FAILED" ? "Processing failed for this title." : "This title is still processing and isn't playable yet."}
          </p>
        )}

        <WatchlistButton titleId={title.id} initialInList={Boolean(watchlistEntry)} />

        <p className="mt-6 max-w-2xl text-neutral-200">{title.description}</p>

        <p className="mt-4 text-sm text-neutral-400">
          Genres: {title.genres.map((g) => g.genre.name).join(", ") || "—"}
        </p>
      </div>
    </div>
  );
}
