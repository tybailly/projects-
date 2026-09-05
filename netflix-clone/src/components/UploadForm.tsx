"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Genre {
  id: string;
  name: string;
}

export function UploadForm({ genres }: { genres: Genre[] }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [releaseYear, setReleaseYear] = useState("");
  const [maturityRating, setMaturityRating] = useState("");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  function toggleGenre(id: string) {
    setSelectedGenres((prev) => (prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      setStatus("Choose a video file first.");
      return;
    }

    setBusy(true);
    setStatus("Creating title record...");

    try {
      const createRes = await fetch("/api/uploads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          description,
          releaseYear: releaseYear ? Number(releaseYear) : undefined,
          maturityRating: maturityRating || undefined,
          genreIds: selectedGenres,
          fileName: file.name,
          contentType: file.type || "video/mp4"
        })
      });

      if (!createRes.ok) {
        const data = await createRes.json().catch(() => ({}));
        throw new Error(data.error ?? "Failed to create title.");
      }

      const { titleId, uploadUrl } = await createRes.json();

      setStatus("Uploading video...");
      const putRes = await fetch(uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": file.type || "video/mp4" },
        body: file
      });
      if (!putRes.ok) throw new Error("Upload to storage failed.");

      setStatus("Queuing transcode job...");
      const completeRes = await fetch("/api/uploads/complete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId })
      });
      if (!completeRes.ok) throw new Error("Failed to queue transcode job.");

      setStatus("Upload complete! Transcoding in the background — refresh below to see status.");
      setName("");
      setDescription("");
      setReleaseYear("");
      setMaturityRating("");
      setSelectedGenres([]);
      setFile(null);
      router.refresh();
    } catch (err) {
      setStatus(err instanceof Error ? err.message : "Something went wrong.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {status && <p className="rounded bg-neutral-800 px-4 py-2 text-sm">{status}</p>}

      <input
        required
        placeholder="Title"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="w-full rounded bg-neutral-800 p-3 outline-none"
      />
      <textarea
        required
        placeholder="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        className="w-full rounded bg-neutral-800 p-3 outline-none"
        rows={3}
      />
      <div className="flex gap-3">
        <input
          type="number"
          placeholder="Release year"
          value={releaseYear}
          onChange={(e) => setReleaseYear(e.target.value)}
          className="w-1/2 rounded bg-neutral-800 p-3 outline-none"
        />
        <input
          placeholder="Maturity rating (e.g. PG-13)"
          value={maturityRating}
          onChange={(e) => setMaturityRating(e.target.value)}
          className="w-1/2 rounded bg-neutral-800 p-3 outline-none"
        />
      </div>

      <div>
        <p className="mb-2 text-sm text-neutral-400">Genres</p>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <button
              type="button"
              key={g.id}
              onClick={() => toggleGenre(g.id)}
              className={`rounded-full border px-3 py-1 text-sm ${
                selectedGenres.includes(g.id) ? "border-white bg-white text-black" : "border-neutral-600 text-neutral-300"
              }`}
            >
              {g.name}
            </button>
          ))}
        </div>
      </div>

      <input
        type="file"
        accept="video/*"
        required
        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        className="w-full text-sm text-neutral-300"
      />

      <button
        type="submit"
        disabled={busy}
        className="rounded bg-brand-red px-6 py-2 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
      >
        {busy ? "Uploading..." : "Upload"}
      </button>
    </form>
  );
}
