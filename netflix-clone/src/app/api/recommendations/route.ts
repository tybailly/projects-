import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { getRecommendationsForProfile } from "@/lib/recommendations";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const profile = await getActiveProfile(session.user.id);
  if (!profile) return NextResponse.json({ error: "No active profile" }, { status: 400 });

  const recommendations = await getRecommendationsForProfile(profile.id);
  return NextResponse.json(recommendations);
}
