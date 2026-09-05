"use client";

import { useState, useTransition } from "react";

export function WatchlistButton({ titleId, initialInList }: { titleId: string; initialInList: boolean }) {
  const [inList, setInList] = useState(initialInList);
  const [pending, startTransition] = useTransition();

  function toggle() {
    const next = !inList;
    setInList(next); // optimistic
    startTransition(async () => {
      const res = await fetch("/api/watchlist", {
        method: next ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ titleId })
      });
      if (!res.ok) setInList(!next); // revert on failure
    });
  }

  return (
    <button
      onClick={toggle}
      disabled={pending}
      className="ml-3 inline-block rounded border border-neutral-400 px-6 py-2 font-semibold text-white hover:border-white disabled:opacity-60"
    >
      {inList ? "✓ In My List" : "+ Add to My List"}
    </button>
  );
}
