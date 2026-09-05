"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Genre {
  id: string;
  name: string;
}

export function GenrePreferencesForm({ profileId, genres }: { profileId: string; genres: Genre[] }) {
  const router = useRouter();
  const [selected, setSelected] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);

  function toggleGenre(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  async function finish(genreIds: string[]) {
    setBusy(true);
    if (genreIds.length > 0) {
      await fetch(`/api/profiles/${profileId}/genres`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ genreIds })
      });
    }
    await fetch("/api/profiles/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId })
    });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-2xl flex-col items-center">
      <div className="mb-8 flex flex-wrap justify-center gap-2">
        {genres.map((genre) => (
          <button
            key={genre.id}
            type="button"
            onClick={() => toggleGenre(genre.id)}
            className={`rounded-full border px-4 py-2 text-sm transition-colors ${
              selected.includes(genre.id) ? "border-white bg-white text-black" : "border-neutral-600 text-neutral-300 hover:border-white"
            }`}
          >
            {genre.name}
          </button>
        ))}
      </div>

      <div className="flex gap-3">
        <button
          onClick={() => finish(selected)}
          disabled={busy || selected.length === 0}
          className="rounded bg-brand-red px-8 py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-40"
        >
          {busy ? "Saving..." : "Save & Continue"}
        </button>
        <button
          onClick={() => finish([])}
          disabled={busy}
          className="rounded border border-neutral-600 px-8 py-3 font-semibold text-neutral-300 hover:border-white hover:text-white disabled:opacity-40"
        >
          Skip for now
        </button>
      </div>
    </div>
  );
}
