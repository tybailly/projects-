"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await signIn("credentials", {
      email,
      password,
      redirect: false
    });
    setLoading(false);

    if (result?.error) {
      setError("Incorrect email or password.");
      return;
    }
    router.push("/profiles");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-brand-black px-4">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded bg-black/75 p-10">
        <h1 className="mb-6 text-3xl font-bold text-white">Sign In</h1>
        {error && <p className="mb-4 rounded bg-orange-900/40 p-3 text-sm text-orange-300">{error}</p>}
        <input
          type="email"
          required
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="mb-3 w-full rounded bg-neutral-700 p-3 text-white placeholder-neutral-400 outline-none"
        />
        <input
          type="password"
          required
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="mb-4 w-full rounded bg-neutral-700 p-3 text-white placeholder-neutral-400 outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className="w-full rounded bg-brand-red py-3 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {loading ? "Signing in..." : "Sign In"}
        </button>
        <p className="mt-6 text-sm text-neutral-400">
          New here?{" "}
          <Link href="/register" className="text-white hover:underline">
            Create an account
          </Link>
        </p>
      </form>
    </main>
  );
}
