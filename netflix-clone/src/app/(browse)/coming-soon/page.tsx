import { prisma } from "@/lib/prisma";
import { isRerelease } from "@/lib/trailers";
import { TitleCard } from "@/components/TitleCard";

export default async function ComingSoonPage() {
  const trailers = await prisma.title.findMany({
    where: { source: "TRAILER", status: "READY" },
    orderBy: { releaseYear: "asc" }
  });

  const upcoming = trailers.filter((t) => !isRerelease(t.releaseYear));
  const rereleases = trailers.filter((t) => isRerelease(t.releaseYear));

  return (
    <div className="px-6 py-8 sm:px-12">
      <h1 className="mb-8 text-3xl font-bold text-white">Coming Soon</h1>

      <section className="mb-10">
        <h2 className="mb-3 text-lg font-semibold text-white sm:text-xl">Upcoming Releases</h2>
        {upcoming.length === 0 ? (
          <p className="text-neutral-400">
            No upcoming releases synced yet. Run <code className="rounded bg-neutral-800 px-1.5 py-0.5">npm run tmdb:sync</code> to pull the latest from TMDb.
          </p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {upcoming.map((title) => (
              <TitleCard key={title.id} title={{ id: title.id, name: title.name, posterUrl: title.posterUrl }} />
            ))}
          </div>
        )}
      </section>

      {rereleases.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold text-white sm:text-xl">Re-Releases</h2>
          <div className="flex flex-wrap gap-3">
            {rereleases.map((title) => (
              <TitleCard
                key={title.id}
                title={{ id: title.id, name: title.name, posterUrl: title.posterUrl, badge: "Re-release" }}
              />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
