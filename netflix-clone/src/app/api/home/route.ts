import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { getRecommendationsForProfile, getPreferredGenreRecommendations } from "@/lib/recommendations";
import { getPlayAction } from "@/lib/providers";
import { isRerelease } from "@/lib/trailers";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getActiveProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 400 });

  const [providers, comingSoon, genres, recommendations, preferredGenreTitles] = await Promise.all([
    prisma.provider.findMany({ orderBy: { name: "asc" } }),
    prisma.title.findMany({
      where: { source: "TRAILER", status: "READY" },
      orderBy: { releaseYear: "asc" },
      take: 20
    }),
    prisma.genre.findMany({
      include: {
        titles: {
          where: { title: { status: "READY", source: "PROVIDER" } },
          include: { title: { include: { provider: true } } },
          take: 20
        }
      }
    }),
    getRecommendationsForProfile(profile.id),
    getPreferredGenreRecommendations(profile.id)
  ]);

  const heroGenre = genres.find((g) => g.titles.length > 0);
  const hero = heroGenre?.titles[0]?.title ?? null;

  return NextResponse.json({
    hero: hero
      ? {
          id: hero.id,
          name: hero.name,
          description: hero.description,
          backdropUrl: hero.backdropUrl,
          play: getPlayAction(hero)
        }
      : null,
    providers,
    comingSoon: comingSoon
      .filter((t) => !isRerelease(t.releaseYear))
      .map((t) => ({ id: t.id, name: t.name, posterUrl: t.posterUrl })),
    preferredGenreTitles: preferredGenreTitles.map((t) => ({ id: t.id, name: t.name, posterUrl: t.posterUrl })),
    recommendations: recommendations.map((t) => ({ id: t.id, name: t.name, posterUrl: t.posterUrl })),
    genres: genres
      .filter((g) => g.titles.length > 0)
      .map((g) => ({
        id: g.id,
        name: g.name,
        titles: g.titles.map((tg) => ({ id: tg.title.id, name: tg.title.name, posterUrl: tg.title.posterUrl }))
      }))
  });
}
