"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/dashboard";
  const urlError = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(urlError);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong. Try again.");
      setLoading(false);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  return (
    <div className="vcb flex min-h-screen items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <Link
          href="/"
          className="text-sm font-medium text-[var(--vcb-muted)] transition-colors hover:text-[var(--vcb-text)]"
        >
          ← VC Brain
        </Link>

        <h1 className="mt-6 text-2xl font-semibold text-[var(--vcb-text)]">
          Sign in
        </h1>
        <p className="mt-2 text-sm text-[var(--vcb-muted)]">
          Pick up where the committee left off.
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          <div>
            <label
              htmlFor="email"
              className="text-xs font-medium text-[var(--vcb-muted)]"
            >
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[var(--vcb-ink-line)] bg-[var(--vcb-ink-soft)] px-3 py-2 text-sm text-[var(--vcb-text)] focus:border-[var(--vcb-brass)] focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="password"
              className="text-xs font-medium text-[var(--vcb-muted)]"
            >
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-sm border border-[var(--vcb-ink-line)] bg-[var(--vcb-ink-soft)] px-3 py-2 text-sm text-[var(--vcb-text)] focus:border-[var(--vcb-brass)] focus:outline-none"
            />
          </div>

          {error && (
            <p className="text-sm text-[var(--vcb-neg)]" role="alert">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-sm bg-[var(--vcb-brass)] px-4 py-2 text-sm font-medium text-[var(--vcb-ink)] transition-colors hover:bg-[var(--vcb-brass-deep)] disabled:opacity-60"
          >
            {loading ? "Signing in…" : "Sign in"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--vcb-muted)]">
          New here?{" "}
          <Link
            href="/signup"
            className="text-[var(--vcb-brass)] hover:text-[var(--vcb-brass-deep)]"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
