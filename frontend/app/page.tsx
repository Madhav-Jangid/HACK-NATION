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
  },
  {
    name: "Assessment & Intelligence",
    body: "Reasons over Memory to challenge assumptions and recommend next steps, transparent about confidence and uncertainty.",
  },
  {
    name: "Memory",
    body: "Nothing discarded. Every pitch deck, repo, and signal is deduplicated, timestamped, and tagged by source.",
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

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-6 py-6">
        <span className="text-sm font-semibold tracking-tight">VC Brain</span>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/login"
            className="text-muted-foreground transition-colors hover:text-foreground"
          >
            Sign in
          </Link>
          <Link href="/signup" className={buttonVariants({ size: "sm" })}>
            Get access
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-5xl gap-14 px-6 pt-10 pb-24 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:pt-16">
          <div>
            <p className="text-xs font-medium tracking-[0.14em] text-primary uppercase">
              Autonomous Investment Committee
            </p>
            <h1 className="mt-4 text-4xl leading-[1.1] font-semibold tracking-tight sm:text-5xl">
              Every founder gets a hearing.
              <br />
              Every verdict shows its work.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-muted-foreground">
              Search a founder and four AI partners research, disagree, and
              score independently — Technical, Founder, and Market build the
              case, Risk tries to break it, and a Devil&apos;s Advocate
              challenges all of them before the Managing Partner calls it.
              Every claim traces back to its source.
            </p>
            <div className="mt-8">
              <FounderSearch />
              <p className="mt-3 text-xs text-muted-foreground">
                No deck required to look someone up — just a name, a company,
                or a repo.
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <VerdictPreview />
          </div>
        </section>

        {/* Three pillars */}
        <section className="border-t border-border">
          <div className="mx-auto grid max-w-5xl gap-10 px-6 py-16 sm:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.name}>
                <h2 className="text-base font-medium">{p.name}</h2>
                <p className="mt-3 text-sm leading-6 text-muted-foreground">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section className="border-t border-border">
          <div className="mx-auto max-w-5xl px-6 py-16">
            <h2 className="text-2xl font-semibold tracking-tight">
              How a verdict is reached
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {pipeline.map((p) => (
                <div key={p.step}>
                  <span className="font-data text-xs text-primary">
                    {p.step}
                  </span>
                  <h3 className="mt-2 text-base font-medium">{p.label}</h3>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-border">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
          <span className="text-sm font-medium">VC Brain</span>
          <p className="text-xs text-muted-foreground">
            Capital should flow to what you&apos;re building, not who you know.
          </p>
        </div>
      </footer>
    </div>
  );
}
