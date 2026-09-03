import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(_request: Request, { params }: { params: { id: string } }) {
  const title = await prisma.title.findUnique({
    where: { id: params.id },
    include: { renditions: true }
  });
  if (!title) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(title);
}
