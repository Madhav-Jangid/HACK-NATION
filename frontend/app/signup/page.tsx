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
      <div className="flex min-h-screen items-center justify-center bg-background px-6">
        <div className="w-full max-w-md text-center space-y-4">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-primary-foreground font-elsie font-black text-2xl">
            B
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground font-elsie">
            Check your email
          </h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            We sent a confirmation link to <strong className="text-foreground">{email}</strong>. Follow it
            to activate your account and sign in.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full lg:grid lg:grid-cols-2">
      {/* Left Panel */}
      <div className="hidden lg:flex relative flex-col bg-foreground p-12 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src="https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?q=80&w=2564&auto=format&fit=crop" 
            alt="Abstract" 
            className="w-full h-full object-cover opacity-20 mix-blend-luminosity"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/60 to-transparent" />
        </div>
        
        <div className="relative z-10 flex flex-col h-full justify-between">
          <Link href="/" className="flex items-center gap-2 text-white hover:opacity-90 transition-opacity">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-foreground font-elsie font-black text-xl">
              B
            </div>
            <span className="font-bold tracking-tight text-xl">VC Brain</span>
          </Link>
          
          <div className="space-y-4">
            <h2 className="text-4xl font-black tracking-tight text-white leading-tight">
              Every founder <br />gets a hearing.
            </h2>
            <p className="text-lg font-medium text-white/70 max-w-md leading-relaxed">
              Autonomous AI investment committee — sourcing, research, and evidence-backed founder scoring.
            </p>
          </div>
        </div>
      </div>

      {/* Right Panel */}
      <div className="flex items-center justify-center bg-background px-6 py-12">
        <div className="w-full max-w-md space-y-8">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-primary transition-all hover:opacity-80 lg:hidden"
          >
            ← Back to VC Brain
          </Link>

          <div>
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-elsie text-sm font-black lg:hidden">
                B
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-elsie">
                Create an account
              </h1>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {founder
                ? `We'll pick up your search for "${founder}" once you're in.`
                : "Set your investment thesis once, and every recommendation runs through it."}
            </p>
          </div>

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
