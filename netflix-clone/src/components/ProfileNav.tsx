"use client";

import { signOut } from "next-auth/react";
import { useRouter } from "next/navigation";

export function ProfileNav({ profileName }: { profileName: string }) {
  const router = useRouter();

  async function switchProfile() {
    router.push("/profiles");
  }

  return (
    <div className="flex items-center gap-4 text-sm text-neutral-200">
      <button onClick={switchProfile} className="hover:text-white">
        {profileName}
      </button>
      <button onClick={() => signOut({ callbackUrl: "/login" })} className="hover:text-white">
        Sign out
      </button>
    </div>
  );
}
