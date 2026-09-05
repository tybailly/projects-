import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { getRecommendationsForProfile } from "@/lib/recommendations";
import { getPlayAction } from "@/lib/providers";
import { Carousel } from "@/components/Carousel";
import { ProviderTile } from "@/components/ProviderTile";

export default async function HomePage() {
  const session = await getServerSession(authOptions);
  const profile = await getActiveProfile(session!.user.id);
  if (!profile) return null; // layout already redirects; satisfies TS

  const [providers, comingSoon, genres, continueWatching, recommendations] = await Promise.all([
    prisma.provider.findMany({ orderBy: { name: "asc" } }),
    prisma.title.findMany({
      where: { source: "TRAILER", status: "READY" },
      orderBy: { releaseYear: "asc" },
      take: 20
    }),
    prisma.genre.findMany({
      include: {
        titles: {
          where: { title: { status: "READY", source: { not: "TRAILER" } } },
          include: { title: { include: { provider: true } } },
          take: 20
        }
      }
    }),
    prisma.watchProgress.findMany({
      where: { profileId: profile.id },
      include: { title: { include: { provider: true } } },
      orderBy: { updatedAt: "desc" },
      take: 20
    }),
    getRecommendationsForProfile(profile.id)
  ]);

  const hero = continueWatching[0]?.title ?? genres.find((g) => g.titles.length > 0)?.titles[0]?.title;
  const heroPlay = hero ? getPlayAction(hero) : null;

  return (
    <div>
      {hero && heroPlay && (
        <section className="relative flex h-[60vh] items-end bg-neutral-900 bg-cover bg-center" style={{ backgroundImage: hero.backdropUrl ? `url(${hero.backdropUrl})` : undefined }}>
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black via-black/30 to-transparent" />
          <div className="relative z-10 max-w-xl px-6 pb-12 sm:px-12">
            <h1 className="mb-3 text-4xl font-bold text-white sm:text-5xl">{hero.name}</h1>
            <p className="mb-5 line-clamp-3 text-sm text-neutral-200 sm:text-base">{hero.description}</p>
            <div className="flex gap-3">
              <Link
                href={heroPlay.href}
                target={heroPlay.external ? "_blank" : undefined}
                rel={heroPlay.external ? "noopener noreferrer" : undefined}
                className="rounded bg-white px-6 py-2 font-semibold text-black hover:bg-neutral-200"
              >
                {heroPlay.label}
              </Link>
              <Link href={`/title/${hero.id}`} className="rounded bg-neutral-700/80 px-6 py-2 font-semibold text-white hover:bg-neutral-600">
                More Info
              </Link>
            </div>
          </div>
        </section>
      )}

      <div className="mt-6">
        {providers.length > 0 && (
          <section className="mb-8 px-6 sm:px-12">
            <h2 className="mb-3 text-lg font-semibold text-white sm:text-xl">Streaming Services</h2>
            <div className="no-scrollbar flex gap-3 overflow-x-auto pb-4">
              {providers.map((provider) => (
                <ProviderTile key={provider.id} provider={provider} />
              ))}
            </div>
          </section>
        )}

        <Carousel
          heading="Continue Watching"
          titles={continueWatching.map((w) => ({ id: w.title.id, name: w.title.name, posterUrl: w.title.posterUrl }))}
        />
        <Carousel
          heading="Coming Soon"
          titles={comingSoon.map((t) => ({ id: t.id, name: t.name, posterUrl: t.posterUrl }))}
        />
        <Carousel
          heading="Because you've watched"
          titles={recommendations.map((t) => ({ id: t.id, name: t.name, posterUrl: t.posterUrl }))}
        />
        {genres
          .filter((g) => g.titles.length > 0)
          .map((genre) => (
            <Carousel
              key={genre.id}
              heading={genre.name}
              titles={genre.titles.map((tg) => ({ id: tg.title.id, name: tg.title.name, posterUrl: tg.title.posterUrl }))}
            />
          ))}
      </div>
    </div>
  );
}
