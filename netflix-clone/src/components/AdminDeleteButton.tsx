"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function AdminDeleteButton({
  kind,
  id,
  label,
  confirmText
}: {
  kind: "users" | "profiles" | "titles";
  id: string;
  label: string;
  confirmText: string;
}) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDelete() {
    if (!window.confirm(confirmText)) return;
    setPending(true);
    setError(null);
    const res = await fetch(`/api/admin/${kind}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      setError(data.error ?? "Failed to delete.");
      setPending(false);
      return;
    }
    router.refresh();
  }

  return (
    <div className="flex items-center gap-2">
      {error && <span className="text-xs text-orange-400">{error}</span>}
      <button
        onClick={handleDelete}
        disabled={pending}
        className="rounded bg-red-900/60 px-3 py-1 text-xs font-medium text-red-200 hover:bg-red-800 disabled:opacity-50"
      >
        {pending ? "Deleting..." : label}
      </button>
    </div>
  );
}
