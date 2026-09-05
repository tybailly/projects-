import { getServerSession } from "next-auth";
import { redirect, notFound } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { GenrePreferencesForm } from "@/components/GenrePreferencesForm";

export default async function ProfileGenresPage({ params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await prisma.profile.findFirst({ where: { id: params.id, userId: session.user.id } });
  if (!profile) notFound();

  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-black px-4 py-16">
      <h1 className="mb-2 text-3xl font-bold text-white sm:text-4xl">What does {profile.name} want to watch?</h1>
      <p className="mb-10 max-w-lg text-center text-neutral-400">
        Pick a few genres and we'll build a "Your Recommendations" row from titles on your streaming services. You can skip this for now.
      </p>
      <GenrePreferencesForm profileId={profile.id} genres={genres} />
    </main>
  );
}
