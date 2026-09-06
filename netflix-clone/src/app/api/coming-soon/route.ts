import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRerelease } from "@/lib/trailers";

export async function GET() {
  const trailers = await prisma.title.findMany({
    where: { source: "TRAILER", status: "READY" },
    orderBy: { releaseYear: "asc" }
  });

  const upcoming = trailers.filter((t) => !isRerelease(t.releaseYear));
  const rereleases = trailers.filter((t) => isRerelease(t.releaseYear));

  const shape = (t: (typeof trailers)[number]) => ({ id: t.id, name: t.name, posterUrl: t.posterUrl });

  return NextResponse.json({
    upcoming: upcoming.map(shape),
    rereleases: rereleases.map(shape)
  });
}
