import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// Reads live data with no request-dependent input, so Next would otherwise
// try to statically prerender it at build time (and fail without a DB).
export const dynamic = "force-dynamic";

export async function GET() {
  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(genres);
}
