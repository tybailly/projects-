import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q")?.trim();

  if (!q) return NextResponse.json([]);

  const titles = await prisma.title.findMany({
    where: {
      status: "READY",
      OR: [
        { name: { contains: q, mode: "insensitive" } },
        { description: { contains: q, mode: "insensitive" } }
      ]
    },
    take: 30,
    orderBy: { name: "asc" }
  });

  return NextResponse.json(titles);
}
