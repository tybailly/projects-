import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const TMDB_API_KEY = process.env.TMDB_API_KEY;
const TMDB_BASE = "https://api.themoviedb.org/3";
const PAGES_PER_PROVIDER = 2; // ~40 titles per media type per provider

// TMDb's own "watch provider" IDs — discovered via GET /watch/providers/movie
// and /watch/providers/tv (watch_region=US). `tmdbProviderId` is the
// canonical ID stored on the Provider row; `tmdbQueryProviderIds` is what's
// actually queried against — some services (Paramount+) split their catalog
// across multiple provider IDs by subscription tier in TMDb's data, so we
// OR them together to get the full catalog regardless of tier.
const PROVIDERS = [
  {
    name: "Disney+",
    slug: "disney-plus",
    tmdbProviderId: 337,
    tmdbQueryProviderIds: [337],
    brandColor: "#113CCF",
    searchUrlTemplate: "https://www.disneyplus.com/search?q={query}"
  },
  {
    name: "Paramount+",
    slug: "paramount-plus",
    tmdbProviderId: 2303, // "Paramount Plus Premium" — canonical id for this provider row
    tmdbQueryProviderIds: [2303, 2616], // Premium + Essential tiers combined
    brandColor: "#0064FF",
    searchUrlTemplate: "https://www.paramountplus.com/search?q={query}"
  },
  {
    name: "Peacock",
    slug: "peacock",
    tmdbProviderId: 387,
    tmdbQueryProviderIds: [387],
    brandColor: "#000000",
    searchUrlTemplate: "https://www.peacocktv.com/search?q={query}"
  },
  {
    name: "Prime Video",
    slug: "prime-video",
    tmdbProviderId: 9,
    tmdbQueryProviderIds: [9],
    brandColor: "#00A8E1",
    searchUrlTemplate: "https://www.amazon.com/s?k={query}&i=instant-video"
  }
] as const;

type MediaType = "movie" | "tv";

interface TmdbListItem {
  id: number;
  title?: string;
  name?: string;
  overview?: string;
  poster_path?: string | null;
  backdrop_path?: string | null;
  release_date?: string;
  first_air_date?: string;
  genre_ids?: number[];
}

async function tmdbFetch<T>(path: string, params: Record<string, string> = {}): Promise<T> {
  const url = new URL(`${TMDB_BASE}${path}`);
  url.searchParams.set("api_key", TMDB_API_KEY!);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, value);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`TMDb request failed (${res.status}): ${url.pathname}`);
  return res.json() as Promise<T>;
}

async function fetchGenreMap(mediaType: MediaType): Promise<Map<number, string>> {
  const data = await tmdbFetch<{ genres: { id: number; name: string }[] }>(`/genre/${mediaType}/list`);
  return new Map(data.genres.map((g) => [g.id, g.name]));
}

async function fetchTitlesForProvider(mediaType: MediaType, tmdbQueryProviderIds: readonly number[]): Promise<TmdbListItem[]> {
  const results: TmdbListItem[] = [];
  for (let page = 1; page <= PAGES_PER_PROVIDER; page++) {
    const data = await tmdbFetch<{ results: TmdbListItem[] }>(`/discover/${mediaType}`, {
      with_watch_providers: tmdbQueryProviderIds.join("|"),
      watch_region: "US",
      sort_by: "popularity.desc",
      page: String(page)
    });
    results.push(...data.results);
  }
  return results;
}

async function main() {
  if (!TMDB_API_KEY) {
    throw new Error("TMDB_API_KEY is not set. Add it to .env (get a free key at themoviedb.org).");
  }

  const genreMaps: Record<MediaType, Map<number, string>> = {
    movie: await fetchGenreMap("movie"),
    tv: await fetchGenreMap("tv")
  };

  for (const { tmdbQueryProviderIds, ...providerRow } of PROVIDERS) {
    const provider = await prisma.provider.upsert({
      where: { slug: providerRow.slug },
      update: providerRow,
      create: providerRow
    });

    let syncedCount = 0;

    for (const mediaType of ["movie", "tv"] as const) {
      const items = await fetchTitlesForProvider(mediaType, tmdbQueryProviderIds);
      const genreMap = genreMaps[mediaType];

      for (const item of items) {
        const name = item.title ?? item.name;
        if (!name) continue;

        const dateStr = item.release_date ?? item.first_air_date ?? "";
        const releaseYear = dateStr.slice(0, 4) ? Number(dateStr.slice(0, 4)) : null;

        const title = await prisma.title.upsert({
          where: { providerId_tmdbId: { providerId: provider.id, tmdbId: item.id } },
          update: {
            name,
            description: item.overview || "No description available.",
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            releaseYear
          },
          create: {
            name,
            description: item.overview || "No description available.",
            type: mediaType === "movie" ? "MOVIE" : "SERIES",
            releaseYear,
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            status: "READY",
            source: "PROVIDER",
            providerId: provider.id,
            tmdbId: item.id
          }
        });

        for (const genreId of item.genre_ids ?? []) {
          const genreName = genreMap.get(genreId);
          if (!genreName) continue;

          const genre = await prisma.genre.upsert({
            where: { name: genreName },
            update: {},
            create: { name: genreName }
          });

          await prisma.titleGenre.upsert({
            where: { titleId_genreId: { titleId: title.id, genreId: genre.id } },
            update: {},
            create: { titleId: title.id, genreId: genre.id }
          });
        }

        syncedCount++;
      }
    }

    console.log(`Synced ${syncedCount} titles for ${provider.name}`);
  }

  console.log("TMDb sync complete.");
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
