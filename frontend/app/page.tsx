import type { Metadata } from "next";
import Link from "next/link";
import { FounderSearch } from "@/components/landing/founder-search";
import { VerdictPreview } from "@/components/landing/verdict-preview";
import { buttonVariants } from "@/app/components/ui/button";

export const metadata: Metadata = {
  title: "VC Brain — Autonomous Investment Committee",
  description:
    "VC Brain researches founders, runs an independent AI investment committee, and produces evidence-backed recommendations investors can act on in 24 hours.",
};

const pillars = [
  {
    name: "Sourcing",
    body: "Surfaces strong founders before they start fundraising, from GitHub, launches, hackathons, and applications alike.",
    tone: "ink" as const,
  },
  {
    name: "Assessment & Intelligence",
    body: "Reasons over Memory to challenge assumptions and recommend next steps, transparent about confidence and uncertainty.",
    tone: "lavender" as const,
  },
  {
    name: "Memory",
    body: "Nothing discarded. Every pitch deck, repo, and signal is deduplicated, timestamped, and tagged by source.",
    tone: "paper" as const,
  },
];

const pipeline = [
  {
    step: "01",
    label: "Search",
    body: "Enter a founder, startup, or GitHub URL — or let outbound sourcing surface one first.",
  },
  {
    step: "02",
    label: "Research",
    body: "Public sources are collected, normalized, and folded into a structured founder profile.",
  },
  {
    step: "03",
    label: "Committee",
    body: "Technical, Founder, Market, and Risk partners score independently, each citing their evidence.",
  },
  {
    step: "04",
    label: "Memo",
    body: "The Managing Partner resolves disagreement and issues a recommendation you can act on.",
  },
];

const pillarTone: Record<(typeof pillars)[number]["tone"], string> = {
  ink: "bg-ink text-ink-foreground",
  lavender: "bg-lavender text-lavender-foreground",
  paper: "bg-secondary text-secondary-foreground",
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-[#fff8f6] via-[#faf5f3] to-[#fbf8f7]">
      {/* Floating pill nav */}
      <div className="sticky top-6 z-20 mx-auto flex max-w-4xl items-center justify-between rounded-full border border-border/80 bg-white/70 px-6 py-3 shadow-[0_8px_30px_rgb(0,0,0,0.03)] backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-elsie text-sm font-black">
            B
          </div>
          <Link href="/" className="font-elsie text-base font-bold tracking-tight text-foreground">
            VC Brain
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-medium">
          <Link
            href="/login"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link href="/signup" className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-[0_4px_12px_rgba(156,90,60,0.25)] transition-all hover:opacity-90 hover:scale-[1.02]">
            Get access
          </Link>
        </nav>
      </div>

      <main className="mx-auto max-w-5xl px-6 pb-24">
        {/* Hero Section */}
        <section className="mt-8 overflow-hidden rounded-[2.5rem] border border-border/80 bg-white/60 p-8 md:p-16 shadow-[0_20px_50px_rgba(156,90,60,0.02)] backdrop-blur-sm">
          <div className="grid gap-12 lg:grid-cols-[1.2fr_1.1fr] lg:items-center">
            <div className="space-y-6">
              <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3.5 py-1.5 text-xs font-semibold tracking-wide text-primary uppercase">
                <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
                Autonomous Investment Committee
              </div>
              <h1 className="text-4xl font-black leading-[1.1] text-foreground tracking-tight sm:text-5xl font-elsie">
                Every founder <br/>gets a hearing.
                <br />
                <span className="bg-gradient-to-r from-primary to-[#a65d3d] bg-clip-text text-transparent">Every verdict</span> shows its work.
              </h1>
              <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
                Search a founder and four AI partners research, disagree, and
                score independently — Technical, Founder, and Market build the
                case, Risk tries to break it, and a Devil&apos;s Advocate
                challenges all of them before the Managing Partner calls it.
                Every claim traces back to its source.
              </p>
              <div className="pt-2">
                <FounderSearch />
                <p className="mt-3 text-xs text-muted-foreground/75">
                  No deck required to look someone up — just a name, a company,
                  or a repo.
                </p>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="relative w-full max-w-sm">
                <div className="absolute -inset-1 rounded-[2.5rem] bg-gradient-to-r from-primary/10 to-accent/20 opacity-70 blur-xl" />
                <div className="relative">
                  <VerdictPreview />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Three pillars — bento grid */}
        <section className="py-20">
          <div className="text-center max-w-2xl mx-auto mb-14 space-y-3">
            <p className="text-xs font-semibold tracking-widest text-primary uppercase">
              How it works
            </p>
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-elsie">
              One system, three jobs — sourcing, reasoning, and memory that never resets.
            </h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {pillars.map((p) => (
              <div
                key={p.name}
                className="group relative flex flex-col justify-between rounded-[2rem] border border-border bg-white/60 p-8 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_15px_30px_rgba(156,90,60,0.04)]"
              >
                <div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/5 text-primary mb-6 transition-all group-hover:scale-110">
                    <span className="text-sm font-bold font-elsie">{p.name[0]}</span>
                  </div>
                  <h3 className="text-lg font-bold tracking-tight text-foreground font-elsie">
                    {p.name}
                  </h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{p.body}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section className="py-8">
          <div className="rounded-[2.5rem] border border-border bg-white/60 p-8 sm:p-12 shadow-sm">
            <h2 className="text-2xl font-extrabold tracking-tight text-foreground font-elsie mb-10 text-center sm:text-left">
              How a verdict is reached
            </h2>
            <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {pipeline.map((p, i) => (
                <div key={p.step} className="relative space-y-3">
                  {i < pipeline.length - 1 && (
                    <div className="absolute top-4 -right-4 hidden h-px w-8 bg-border/80 lg:block" />
                  )}
                  <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                    {p.step}
                  </span>
                  <h3 className="text-base font-bold text-foreground font-elsie">
                    {p.label}
                  </h3>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="mx-6 mb-8 overflow-hidden rounded-[2.5rem] border border-border bg-white/60 shadow-sm">
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 px-6 py-16 text-center">
          <h2 className="max-w-xl text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl font-elsie">
            Capital should flow to what you&apos;re building, not who you know.
          </h2>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link href="/signup" className="rounded-full bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-[0_4px_12px_rgba(156,90,60,0.25)] transition-all hover:opacity-90 hover:scale-[1.02]">
              Get access
            </Link>
            <Link
              href="/login"
              className="rounded-full border border-border bg-[#fffdfd] px-8 py-3 text-sm font-semibold text-foreground transition-all hover:bg-secondary/40 hover:scale-[1.02]"
            >
              Sign in
            </Link>
          </div>
        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border/60 bg-[#fffdfd] px-8 py-5 text-xs text-muted-foreground sm:flex-row">
          <span className="font-semibold text-foreground/75">
            &copy; {new Date().getFullYear()} VC Brain
          </span>
          <span className="text-muted-foreground/60">
            Sourcing → Screening → Diligence → Decision
          </span>
        </div>
      </footer>
    </div>
  );
}
