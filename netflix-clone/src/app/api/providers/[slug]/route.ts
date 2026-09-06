import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { slug: string } }) {
  const provider = await prisma.provider.findUnique({ where: { slug: params.slug } });
  if (!provider) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const genres = await prisma.genre.findMany({
    include: {
      titles: {
        where: { title: { providerId: provider.id, status: "READY" } },
        include: { title: true },
        take: 20
      }
    }
  });

  return NextResponse.json({
    provider,
    genres: genres
      .filter((g) => g.titles.length > 0)
      .map((g) => ({
        id: g.id,
        name: g.name,
        titles: g.titles.map((tg) => ({ id: tg.title.id, name: tg.title.name, posterUrl: tg.title.posterUrl }))
      }))
  });
}
