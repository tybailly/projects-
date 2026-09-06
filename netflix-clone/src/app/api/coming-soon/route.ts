import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isRerelease } from "@/lib/trailers";

// Unlike the other API routes here, this one calls no dynamic function
// (no getServerSession/cookies), so Next.js treats it as eligible for
// static generation and tries to execute it against the database at
// build time -- which fails wherever the build has no DB (e.g. CI).
export const dynamic = "force-dynamic";

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
