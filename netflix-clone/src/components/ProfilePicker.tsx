"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

interface Profile {
  id: string;
  name: string;
  isKids: boolean;
}

const AVATAR_COLORS = ["bg-red-700", "bg-blue-700", "bg-green-700", "bg-purple-700", "bg-yellow-700"];

export function ProfilePicker({ profiles }: { profiles: Profile[] }) {
  const router = useRouter();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function selectProfile(profileId: string) {
    setBusy(true);
    await fetch("/api/profiles/select", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profileId })
    });
    router.push("/");
    router.refresh();
  }

  async function createProfile(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    const res = await fetch("/api/profiles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: name.trim() })
    });
    setBusy(false);
    if (res.ok) {
      router.refresh();
      setCreating(false);
      setName("");
    }
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-8">
      {profiles.map((profile, i) => (
        <button
          key={profile.id}
          disabled={busy}
          onClick={() => selectProfile(profile.id)}
          className="group flex flex-col items-center gap-3"
        >
          <div
            className={`flex h-28 w-28 items-center justify-center rounded text-4xl font-bold text-white ${AVATAR_COLORS[i % AVATAR_COLORS.length]} group-hover:ring-4 group-hover:ring-white`}
          >
            {profile.name.charAt(0).toUpperCase()}
          </div>
          <span className="text-lg text-neutral-300 group-hover:text-white">{profile.name}</span>
        </button>
      ))}

      {profiles.length < 5 &&
        (creating ? (
          <form onSubmit={createProfile} className="flex flex-col items-center gap-3">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Name"
              className="h-28 w-28 rounded bg-neutral-800 text-center text-white outline-none ring-2 ring-neutral-600"
            />
            <button type="submit" disabled={busy} className="text-lg text-neutral-300 hover:text-white">
              Save
            </button>
          </form>
        ) : (
          <button onClick={() => setCreating(true)} className="group flex flex-col items-center gap-3">
            <div className="flex h-28 w-28 items-center justify-center rounded border-2 border-neutral-600 text-4xl text-neutral-500 group-hover:border-white group-hover:text-white">
              +
            </div>
            <span className="text-lg text-neutral-300 group-hover:text-white">Add Profile</span>
          </button>
        ))}
    </div>
  );
}
