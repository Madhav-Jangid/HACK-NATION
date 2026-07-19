"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";

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
      <div className="flex min-h-screen items-center justify-center bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#fff8f6] via-[#faf5f3] to-[#fbf8f7] px-6">
        <div className="w-full max-w-md rounded-[2.25rem] border border-border bg-[#fffdfd] p-8 md:p-10 shadow-[0_20px_50px_rgba(156,90,60,0.04)] text-center space-y-4">
          <h1 className="text-xl font-bold tracking-tight text-foreground font-elsie">
            Check your email
          </h1>
          <p className="text-xs text-muted-foreground leading-relaxed">
            We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Follow it
            to activate your account and sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#fff8f6] via-[#faf5f3] to-[#fbf8f7] px-6">
      <div className="w-full max-w-md rounded-[2.25rem] border border-border bg-[#fffdfd] p-8 md:p-10 shadow-[0_20px_50px_rgba(156,90,60,0.04)]">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all hover:opacity-80"
        >
          ← Back to VC Brain
        </Link>

        <div className="mt-6 flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-elsie text-sm font-black">
            B
          </div>
          <h1 className="text-xl font-bold tracking-tight text-foreground font-elsie">
            Create an account
          </h1>
        </div>
        <p className="mt-2 text-xs text-muted-foreground">
          {founder
            ? `We'll pick up your search for "${founder}" once you're in.`
            : "Set your investment thesis once, and every recommendation runs through it."}
        </p>

        <form onSubmit={handleSubmit} className="mt-8 space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-bold text-foreground/80">
              Email Address
            </label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25"
            />
          </div>
          <div className="space-y-1.5">
            <label htmlFor="password" className="text-xs font-bold text-foreground/80">
              Password
            </label>
            <Input
              id="password"
              type="password"
              required
              minLength={6}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25"
            />
          </div>

          {error && (
            <p className="text-xs text-destructive font-semibold" role="alert">
              {error}
            </p>
          )}

          <Button type="submit" disabled={loading} className="w-full h-10 rounded-xl bg-primary text-primary-foreground font-semibold shadow-[0_4px_12px_rgba(156,90,60,0.25)] hover:shadow-[0_4px_16px_rgba(156,90,60,0.35)] transition-all">
            {loading ? "Creating account…" : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-xs text-muted-foreground text-center">
          Already have an account?{" "}
          <Link href="/login" className="text-primary font-bold hover:underline">
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
