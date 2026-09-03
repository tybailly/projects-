import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { ProfilePicker } from "@/components/ProfilePicker";

export default async function ProfilesPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profiles = await prisma.profile.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "asc" }
  });

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-brand-black px-4">
      <h1 className="mb-10 text-4xl font-medium text-white">Who's watching?</h1>
      <ProfilePicker profiles={profiles} />
    </main>
  );
}
