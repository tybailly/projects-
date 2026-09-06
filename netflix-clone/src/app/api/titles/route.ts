import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return NextResponse.json([]);

  // Match each word separately rather than the whole phrase as one substring,
  // so e.g. "Spider Man" still finds "Spider-Man" instead of requiring the
  // user to type the title's exact punctuation.
  const words = q.split(/\s+/).filter(Boolean);

  const titles = await prisma.title.findMany({
    where: {
      status: "READY",
      AND: words.map((word) => ({
        OR: [
          { name: { contains: word, mode: "insensitive" as const } },
          { description: { contains: word, mode: "insensitive" as const } }
        ]
      }))
    },
    take: 30,
    orderBy: { name: "asc" }
  });

  return NextResponse.json(titles);
}
