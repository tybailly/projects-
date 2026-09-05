import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  inviteCode: z.string()
});

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const parsed = registerSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid email, password (min 8 characters), or invite code." }, { status: 400 });
  }

  const requiredInviteCode = process.env.INVITE_CODE;
  if (!requiredInviteCode) {
    // Fail closed: an unconfigured INVITE_CODE means registration should
    // never silently be left wide open on a public deployment.
    return NextResponse.json({ error: "Registration is not open." }, { status: 403 });
  }
  if (parsed.data.inviteCode !== requiredInviteCode) {
    return NextResponse.json({ error: "Invalid invite code." }, { status: 403 });
  }

  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return NextResponse.json({ error: "An account with that email already exists." }, { status: 409 });
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, 10);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      profiles: { create: [{ name: "Me" }] }
    },
    include: { profiles: true }
  });

  return NextResponse.json({ id: user.id, email: user.email, profileId: user.profiles[0].id }, { status: 201 });
}
