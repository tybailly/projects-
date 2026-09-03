import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { prisma } from "@/lib/prisma";
import { TitleCard } from "@/components/TitleCard";

export default async function MyListPage() {
  const session = await getServerSession(authOptions);
  const profile = await getActiveProfile(session!.user.id);
  if (!profile) return null;

  const entries = await prisma.watchlistEntry.findMany({
    where: { profileId: profile.id },
    include: { title: true },
    orderBy: { addedAt: "desc" }
  });

  return (
    <div className="px-6 py-8 sm:px-12">
      <h1 className="mb-6 text-2xl font-semibold text-white">My List</h1>
      {entries.length === 0 ? (
        <p className="text-neutral-400">You haven't added anything yet. Browse and hit "+ Add to My List" on a title.</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {entries.map((entry) => (
            <TitleCard key={entry.id} title={{ id: entry.title.id, name: entry.title.name, posterUrl: entry.title.posterUrl }} />
          ))}
        </div>
      )}
    </div>
  );
}
