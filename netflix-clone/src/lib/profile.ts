import { cache } from "react";
import { cookies } from "next/headers";
import { prisma } from "@/lib/prisma";

export const ACTIVE_PROFILE_COOKIE = "activeProfileId";

/**
 * Returns the active profile for the current request, verifying it still
 * belongs to the signed-in user so a stale/forged cookie can't select
 * someone else's profile. Wrapped in React's cache() so the layout and
 * page for the same request share one DB lookup instead of two.
 */
export const getActiveProfile = cache(async (userId: string) => {
  const cookieStore = cookies();
  const profileId = cookieStore.get(ACTIVE_PROFILE_COOKIE)?.value;
  if (!profileId) return null;

  const profile = await prisma.profile.findFirst({
    where: { id: profileId, userId }
  });
  return profile;
});
