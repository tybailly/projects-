import { prisma } from "@/lib/prisma";

/**
 * Genre-overlap recommendations: rank READY titles the profile hasn't
 * already watchlisted/progressed by how many genres they share with what
 * the profile has already engaged with. No ML — just SQL aggregation.
 */
export async function getRecommendationsForProfile(profileId: string, limit = 10) {
  const engaged = await prisma.title.findMany({
    where: {
      OR: [{ watchlistedBy: { some: { profileId } } }, { progress: { some: { profileId } } }]
    },
    select: { genres: { select: { genreId: true } } }
  });

  const engagedGenreIds = new Set(engaged.flatMap((t) => t.genres.map((g) => g.genreId)));
  if (engagedGenreIds.size === 0) {
    return prisma.title.findMany({
      where: { status: "READY", source: { not: "TRAILER" } },
      include: { provider: true },
      orderBy: { createdAt: "desc" },
      take: limit
    });
  }

  const excludeTitleIds = (
    await prisma.title.findMany({
      where: {
        OR: [{ watchlistedBy: { some: { profileId } } }, { progress: { some: { profileId } } }]
      },
      select: { id: true }
    })
  ).map((t) => t.id);

  const candidates = await prisma.title.findMany({
    where: {
      status: "READY",
      source: { not: "TRAILER" },
      id: { notIn: excludeTitleIds },
      genres: { some: { genreId: { in: Array.from(engagedGenreIds) } } }
    },
    include: { genres: true, provider: true }
  });

  return candidates
    .map((title) => ({
      title,
      score: title.genres.filter((g) => engagedGenreIds.has(g.genreId)).length
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => entry.title);
}
