import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { getActiveProfile } from "@/lib/profile";
import { isAdminUser } from "@/lib/admin";
import { ProfileNav } from "@/components/ProfileNav";

export default async function BrowseLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const profile = await getActiveProfile(session.user.id);
  if (!profile) redirect("/profiles");

  const isAdmin = await isAdminUser(session.user.id);

  return (
    <div className="min-h-screen bg-brand-black">
      <header className="sticky top-0 z-20 flex items-center justify-between bg-gradient-to-b from-black/90 to-transparent px-6 py-4 sm:px-12">
        <div className="flex items-center gap-8">
          <Link href="/" className="text-2xl font-bold text-brand-red">
            STREAMFLIX
          </Link>
          <nav className="hidden gap-5 text-sm text-neutral-200 sm:flex">
            <Link href="/" className="hover:text-white">
              Home
            </Link>
            <Link href="/family-videos" className="hover:text-white">
              Family Videos
            </Link>
            <Link href="/my-list" className="hover:text-white">
              My List
            </Link>
            <Link href="/search" className="hover:text-white">
              Search
            </Link>
            {isAdmin && (
              <Link href="/admin/manage" className="hover:text-white">
                Admin
              </Link>
            )}
          </nav>
        </div>
        <ProfileNav profileName={profile.name} />
      </header>
      <main>{children}</main>
    </div>
  );
}
