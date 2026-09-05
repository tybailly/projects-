import { prisma } from "@/lib/prisma";

// Always re-checked against the DB rather than trusting the session/JWT, so
// revoking admin takes effect immediately without waiting for token refresh.
export async function isAdminUser(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({ where: { id: userId }, select: { isAdmin: true } });
  return user?.isAdmin ?? false;
}
