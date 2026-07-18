import type { Metadata } from "next";
import Link from "next/link";
import { Fraunces } from "next/font/google";
import { CommitteeLedger } from "@/components/landing/committee-ledger";
import { FounderSearch } from "@/components/landing/founder-search";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});

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
    <div
      className={`${fraunces.variable} vcb min-h-screen`}
      style={{ fontFamily: "var(--font-sans, inherit)" }}
    >
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <span
          className="text-lg font-semibold tracking-tight text-[var(--vcb-text)]"
          style={{ fontFamily: "var(--font-display)" }}
        >
          VC Brain
        </span>
        <nav className="flex items-center gap-6 text-sm">
          <Link
            href="/login"
            className="text-[var(--vcb-muted)] transition-colors hover:text-[var(--vcb-text)]"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-sm bg-[var(--vcb-brass)] px-4 py-2 font-medium text-[var(--vcb-ink)] transition-colors hover:bg-[var(--vcb-brass-deep)]"
          >
            Get access
          </Link>
        </nav>
      </header>

      <main>
        {/* Hero */}
        <section className="mx-auto grid max-w-6xl gap-14 px-6 pt-10 pb-24 lg:grid-cols-2 lg:items-center lg:pt-16">
          <div>
            <p className="text-xs font-medium tracking-[0.2em] text-[var(--vcb-brass)] uppercase">
              Autonomous Investment Committee
            </p>
            <h1
              className="mt-4 text-4xl leading-[1.1] font-semibold text-[var(--vcb-text)] sm:text-5xl"
              style={{ fontFamily: "var(--font-display)" }}
            >
              Every founder gets a hearing.
              <br />
              Every verdict shows its work.
            </h1>
            <p className="mt-6 max-w-md text-base leading-7 text-[var(--vcb-muted)]">
              Search a founder and five AI partners research, disagree, and score
              independently — Technical, Founder, and Market build the case, Risk
              tries to break it, and Managing Partner calls it. Every claim traces
              back to its source.
            </p>
            <div className="mt-8">
              <FounderSearch />
              <p className="mt-3 text-xs text-[var(--vcb-muted)]">
                No deck required to look someone up — just a name, a company, or a
                repo.
              </p>
            </div>
          </div>

          <div className="flex justify-center lg:justify-end">
            <CommitteeLedger />
          </div>
        </section>

        {/* Three pillars */}
        <section className="border-t border-[var(--vcb-ink-line)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-16 sm:grid-cols-3">
            {pillars.map((p) => (
              <div key={p.name}>
                <h2
                  className="text-lg font-medium text-[var(--vcb-text)]"
                  style={{ fontFamily: "var(--font-display)" }}
                >
                  {p.name}
                </h2>
                <p className="mt-3 text-sm leading-6 text-[var(--vcb-muted)]">
                  {p.body}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* Pipeline */}
        <section className="border-t border-[var(--vcb-ink-line)]">
          <div className="mx-auto max-w-6xl px-6 py-16">
            <h2
              className="text-2xl font-medium text-[var(--vcb-text)]"
              style={{ fontFamily: "var(--font-display)" }}
            >
              How a verdict is reached
            </h2>
            <div className="mt-10 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
              {pipeline.map((p) => (
                <div key={p.step}>
                  <span className="text-xs font-medium text-[var(--vcb-brass)] tabular-nums">
                    {p.step}
                  </span>
                  <h3 className="mt-2 text-base font-medium text-[var(--vcb-text)]">
                    {p.label}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--vcb-muted)]">
                    {p.body}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[var(--vcb-ink-line)]">
        <div className="mx-auto flex max-w-6xl flex-col items-start justify-between gap-4 px-6 py-10 sm:flex-row sm:items-center">
          <span
            className="text-sm font-medium text-[var(--vcb-text)]"
            style={{ fontFamily: "var(--font-display)" }}
          >
            VC Brain
          </span>
          <p className="text-xs text-[var(--vcb-muted)]">
            Capital should flow to what you&apos;re building, not who you know.
          </p>
        </div>
      </footer>
    </div>
  );
}
