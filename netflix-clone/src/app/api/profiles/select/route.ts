import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ACTIVE_PROFILE_COOKIE } from "@/lib/profile";

const selectSchema = z.object({ profileId: z.string() });

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await request.json().catch(() => null);
  const parsed = selectSchema.safeParse(body);
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

  const profile = await prisma.profile.findFirst({
    where: { id: parsed.data.profileId, userId: session.user.id }
  });
  if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });

  const response = NextResponse.json({ ok: true });
  response.cookies.set(ACTIVE_PROFILE_COOKIE, profile.id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 365
  });
  return response;
}
