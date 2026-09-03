"use client";

import { useEffect, useState } from "react";
import { TitleCard, type TitleCardData } from "@/components/TitleCard";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<TitleCardData[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    const handle = setTimeout(async () => {
      const res = await fetch(`/api/titles?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setResults(data);
      setLoading(false);
    }, 300);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <div className="px-6 py-8 sm:px-12">
      <input
        autoFocus
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search titles..."
        className="mb-6 w-full max-w-md rounded bg-neutral-800 p-3 text-white placeholder-neutral-400 outline-none ring-1 ring-neutral-700 focus:ring-white"
      />

      {loading && <p className="text-neutral-400">Searching...</p>}
      {!loading && query.trim() && results.length === 0 && <p className="text-neutral-400">No titles found for "{query}".</p>}

      <div className="flex flex-wrap gap-3">
        {results.map((title) => (
          <TitleCard key={title.id} title={title} />
        ))}
      </div>
    </div>
  );
}
