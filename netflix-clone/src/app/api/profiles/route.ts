import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" }
  });
  return NextResponse.json(profiles);
}

const createProfileSchema = z.object({
  name: z.string().min(1).max(50),
  isKids: z.boolean().optional()
});

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = createProfileSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid profile" }, { status: 400 });

  const count = await prisma.profile.count({ where: { userId: session.user.id } });
  if (count >= 5) {
    return NextResponse.json({ error: "Maximum of 5 profiles per account." }, { status: 400 });
  }

  const profile = await prisma.profile.create({
    data: { userId: session.user.id, name: parsed.data.name, isKids: parsed.data.isKids ?? false }
  });
  return NextResponse.json(profile, { status: 201 });
}
