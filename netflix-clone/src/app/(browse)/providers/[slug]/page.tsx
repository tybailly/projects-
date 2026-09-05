import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { Carousel } from "@/components/Carousel";

export default async function ProviderPage({ params }: { params: { slug: string } }) {
  const provider = await prisma.provider.findUnique({ where: { slug: params.slug } });
  if (!provider) notFound();

  const genres = await prisma.genre.findMany({
    include: {
      titles: {
        where: { title: { providerId: provider.id, status: "READY" } },
        include: { title: true },
        take: 20
      }
    }
  });

  const genreRows = genres.filter((g) => g.titles.length > 0);
  const isEmpty = genreRows.length === 0;

  return (
    <div className="px-6 py-8 sm:px-12">
      <div className="mb-8 flex items-center gap-4">
        <div className="h-16 w-28 rounded-lg" style={{ backgroundColor: provider.brandColor }} />
        <h1 className="text-3xl font-bold text-white">{provider.name}</h1>
      </div>

      {isEmpty ? (
        <p className="text-neutral-400">
          No catalog synced for {provider.name} yet. Run <code className="rounded bg-neutral-800 px-1.5 py-0.5">npm run tmdb:sync</code> to pull its catalog from TMDb.
        </p>
      ) : (
        genreRows.map((genre) => (
          <Carousel
            key={genre.id}
            heading={genre.name}
            titles={genre.titles.map((tg) => ({ id: tg.title.id, name: tg.title.name, posterUrl: tg.title.posterUrl }))}
          />
        ))
      )}
    </div>
  );
}
