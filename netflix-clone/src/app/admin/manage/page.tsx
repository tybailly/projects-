import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { isAdminUser } from "@/lib/admin";
import { prisma } from "@/lib/prisma";
import { AdminDeleteButton } from "@/components/AdminDeleteButton";

export default async function AdminManagePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");
  if (!(await isAdminUser(session.user.id))) redirect("/");

  const [users, titles] = await Promise.all([
    prisma.user.findMany({
      orderBy: { createdAt: "asc" },
      include: { profiles: { orderBy: { createdAt: "asc" } } }
    }),
    prisma.title.findMany({ orderBy: { createdAt: "desc" }, take: 100 })
  ]);

  return (
    <div className="min-h-screen bg-brand-black px-6 py-10 text-white sm:px-12">
      <h1 className="mb-8 text-2xl font-semibold">Admin</h1>

      <section className="mb-12">
        <h2 className="mb-3 text-lg font-semibold">Users &amp; Profiles</h2>
        <div className="space-y-4">
          {users.map((user) => (
            <div key={user.id} className="rounded bg-neutral-800 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <span className="font-medium">{user.email}</span>
                  {user.isAdmin && (
                    <span className="ml-2 rounded bg-brand-red/80 px-2 py-0.5 text-xs">Admin</span>
                  )}
                  {user.id === session.user.id && (
                    <span className="ml-2 text-xs text-neutral-400">(you)</span>
                  )}
                </div>
                {user.id !== session.user.id && (
                  <AdminDeleteButton
                    kind="users"
                    id={user.id}
                    label="Delete user"
                    confirmText={`Delete ${user.email} and all of their profiles? This cannot be undone.`}
                  />
                )}
              </div>
              {user.profiles.length > 0 && (
                <ul className="mt-3 space-y-1 border-t border-neutral-700 pt-3">
                  {user.profiles.map((profile) => (
                    <li key={profile.id} className="flex items-center justify-between text-sm text-neutral-300">
                      <span>{profile.name}</span>
                      <AdminDeleteButton
                        kind="profiles"
                        id={profile.id}
                        label="Delete profile"
                        confirmText={`Delete profile "${profile.name}"? This cannot be undone.`}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Titles</h2>
        <ul className="space-y-2">
          {titles.map((title) => (
            <li key={title.id} className="flex items-center justify-between rounded bg-neutral-800 px-4 py-2 text-sm">
              <span>
                {title.name}{" "}
                <span className="text-neutral-500">
                  ({title.source}
                  {title.releaseYear ? `, ${title.releaseYear}` : ""})
                </span>
              </span>
              <AdminDeleteButton
                kind="titles"
                id={title.id}
                label="Delete title"
                confirmText={`Delete "${title.name}"? This cannot be undone.`}
              />
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
