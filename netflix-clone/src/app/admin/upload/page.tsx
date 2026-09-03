import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { UploadForm } from "@/components/UploadForm";

export default async function AdminUploadPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const genres = await prisma.genre.findMany({ orderBy: { name: "asc" } });
  const recentTitles = await prisma.title.findMany({
    orderBy: { createdAt: "desc" },
    take: 10
  });

  return (
    <div className="min-h-screen bg-brand-black px-6 py-10 text-white sm:px-12">
      <h1 className="mb-6 text-2xl font-semibold">Upload a Title</h1>
      <UploadForm genres={genres} />

      <h2 className="mb-3 mt-12 text-lg font-semibold">Recent Uploads</h2>
      <ul className="space-y-2">
        {recentTitles.map((t) => (
          <li key={t.id} className="flex items-center justify-between rounded bg-neutral-800 px-4 py-2 text-sm">
            <span>{t.name}</span>
            <span
              className={
                t.status === "READY"
                  ? "text-green-400"
                  : t.status === "FAILED"
                    ? "text-red-400"
                    : "text-yellow-400"
              }
            >
              {t.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
