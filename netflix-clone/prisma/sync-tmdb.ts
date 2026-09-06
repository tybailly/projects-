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
// searchUrlTemplate points at each service's own domain rather than a
// generic search engine specifically so Android's App Links hand this off
// to the real, already-logged-in streaming app installed on the TV instead
// of opening a browser -- that only works when the link's host matches a
// domain the app has verified. An anonymous web visitor hitting these same
// URLs cold (no app installed, not logged in) may see a login wall instead
// of real search results; that's an acceptable tradeoff since the primary
// client is the TV app, not the browser. There's still no real per-title
// deep link these services expose publicly (see buildProviderDeepLink in
// src/lib/providers.ts).
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
    searchUrlTemplate: "https://www.paramountplus.com/search/{query}/"
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
    searchUrlTemplate: "https://www.primevideo.com/search/?phrase={query}"
  }
] as const;

type MediaType = "movie" | "tv";

// How many upcoming movies to check for a trailer; not every one has a
// YouTube trailer on TMDb yet, so this is an upper bound, not a guarantee.
const UPCOMING_MOVIES_TO_CHECK = 40;
const UPCOMING_PAGES = 2; // 20 results/page

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

interface TmdbVideo {
  key: string;
  site: string;
  type: string;
  official: boolean;
}

interface TmdbCredits {
  cast: { name: string; order: number }[];
  crew: { name: string; job: string }[];
}

const LEAD_CAST_COUNT = 5;

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

async function fetchUpcomingMovies(): Promise<TmdbListItem[]> {
  const results: TmdbListItem[] = [];
  for (let page = 1; page <= UPCOMING_PAGES; page++) {
    const data = await tmdbFetch<{ results: TmdbListItem[] }>("/movie/upcoming", { region: "US", page: String(page) });
    results.push(...data.results);
  }
  return results.slice(0, UPCOMING_MOVIES_TO_CHECK);
}

/** Picks the best YouTube trailer for a movie, if any: prefer an official
 * "Trailer" over a "Teaser" or unofficial upload. */
async function fetchBestTrailerKey(movieId: number): Promise<string | null> {
  const data = await tmdbFetch<{ results: TmdbVideo[] }>(`/movie/${movieId}/videos`);
  const youtubeVideos = data.results.filter((v) => v.site === "YouTube");
  if (youtubeVideos.length === 0) return null;

  const rank = (v: TmdbVideo) => (v.type === "Trailer" ? 2 : v.type === "Teaser" ? 1 : 0) + (v.official ? 0.5 : 0);
  youtubeVideos.sort((a, b) => rank(b) - rank(a));
  return youtubeVideos[0].key;
}

/** Top billed cast (by TMDb's own ordering) and directors for a movie. */
async function fetchCredits(movieId: number): Promise<{ cast: string | null; director: string | null }> {
  const data = await tmdbFetch<TmdbCredits>(`/movie/${movieId}/credits`);

  const cast = [...data.cast]
    .sort((a, b) => a.order - b.order)
    .slice(0, LEAD_CAST_COUNT)
    .map((c) => c.name);

  const directors = data.crew.filter((c) => c.job === "Director").map((c) => c.name);

  return {
    cast: cast.length > 0 ? cast.join(", ") : null,
    director: directors.length > 0 ? directors.join(", ") : null
  };
}

async function tagGenres(titleId: string, genreIds: number[] | undefined, genreMap: Map<number, string>) {
  for (const genreId of genreIds ?? []) {
    const genreName = genreMap.get(genreId);
    if (!genreName) continue;

    const genre = await prisma.genre.upsert({ where: { name: genreName }, update: {}, create: { name: genreName } });
    await prisma.titleGenre.upsert({
      where: { titleId_genreId: { titleId, genreId: genre.id } },
      update: {},
      create: { titleId, genreId: genre.id }
    });
  }
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

        await tagGenres(title.id, item.genre_ids, genreMap);
        syncedCount++;
      }
    }

    console.log(`Synced ${syncedCount} titles for ${provider.name}`);
  }

  const upcomingMovies = await fetchUpcomingMovies();
  let trailerCount = 0;

  for (const item of upcomingMovies) {
    const name = item.title;
    if (!name) continue;

    const trailerKey = await fetchBestTrailerKey(item.id);
    if (!trailerKey) continue; // skip upcoming movies with no trailer yet

    const dateStr = item.release_date ?? "";
    const releaseYear = dateStr.slice(0, 4) ? Number(dateStr.slice(0, 4)) : null;
    const { cast, director } = await fetchCredits(item.id);

    const existing = await prisma.title.findFirst({ where: { source: "TRAILER", tmdbId: item.id } });
    const title = existing
      ? await prisma.title.update({
          where: { id: existing.id },
          data: {
            name,
            description: item.overview || "No description available.",
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            releaseYear,
            releaseDate: dateStr || null,
            cast,
            director,
            trailerKey
          }
        })
      : await prisma.title.create({
          data: {
            name,
            description: item.overview || "No description available.",
            type: "MOVIE",
            releaseYear,
            releaseDate: dateStr || null,
            cast,
            director,
            posterUrl: item.poster_path ? `https://image.tmdb.org/t/p/w500${item.poster_path}` : null,
            backdropUrl: item.backdrop_path ? `https://image.tmdb.org/t/p/original${item.backdrop_path}` : null,
            status: "READY",
            source: "TRAILER",
            tmdbId: item.id,
            trailerKey
          }
        });

    await tagGenres(title.id, item.genre_ids, genreMaps.movie);
    trailerCount++;
  }

  console.log(`Synced ${trailerCount} upcoming trailers`);
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
