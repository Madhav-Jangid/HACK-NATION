"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

function SignupForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const founder = searchParams.get("founder");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [needsConfirmation, setNeedsConfirmation] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/auth/signup", {
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

    if (data.needsEmailConfirmation) {
      setNeedsConfirmation(true);
      setLoading(false);
      return;
    }

    router.push("/dashboard");
    router.refresh();
  }

  if (needsConfirmation) {
    return (
      <div className="vcb flex min-h-screen items-center justify-center px-6">
        <div className="w-full max-w-sm text-center">
          <h1 className="text-2xl font-semibold text-[var(--vcb-text)]">
            Check your email
          </h1>
          <p className="mt-3 text-sm text-[var(--vcb-muted)]">
            We sent a confirmation link to <strong>{email}</strong>. Follow it to
            activate your account and sign in.
          </p>
        </div>
      </div>
    );
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
          Create an account
        </h1>
        <p className="mt-2 text-sm text-[var(--vcb-muted)]">
          {founder
            ? `We'll pick up your search for "${founder}" once you're in.`
            : "Set your investment thesis once, and every recommendation runs through it."}
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
              minLength={6}
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
            {loading ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-6 text-sm text-[var(--vcb-muted)]">
          Already have an account?{" "}
          <Link
            href="/login"
            className="text-[var(--vcb-brass)] hover:text-[var(--vcb-brass-deep)]"
          >
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  return (
    <Suspense>
      <SignupForm />
    </Suspense>
  );
}
