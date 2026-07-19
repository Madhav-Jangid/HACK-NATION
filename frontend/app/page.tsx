import type { Metadata } from "next";
import Link from "next/link";
import { FounderSearch } from "@/components/landing/founder-search";
import { VerdictPreview } from "@/components/landing/verdict-preview";

export const metadata: Metadata = {
  title: "VC Brain — Autonomous Investment Committee",
  description:
    "VC Brain researches founders, runs an independent AI investment committee, and produces evidence-backed recommendations investors can act on in 24 hours.",
};

const pillars = [
  {
    name: "Sourcing",
    body: "Surfaces strong founders before they start fundraising, from GitHub, launches, hackathons, and applications alike.",
    tone: "dark", 
  },
  {
    name: "Assessment & Intelligence",
    body: "Reasons over Memory to challenge assumptions and recommend next steps, transparent about confidence and uncertainty.",
    tone: "lavender", 
  },
  {
    name: "Memory",
    body: "Nothing discarded. Every pitch deck, repo, and signal is deduplicated, timestamped, and tagged by source.",
    tone: "white", 
  },
];

const pipeline = [
  {
    step: "01",
    label: "Search",
    body: "Enter a founder, startup, or GitHub URL — or let outbound sourcing surface one first.",
    tone: "white"
  },
  {
    step: "02",
    label: "Research",
    body: "Public sources are collected, normalized, and folded into a structured founder profile.",
    tone: "dark"
  },
  {
    step: "03",
    label: "Committee",
    body: "Technical, Founder, Market, and Risk partners score independently, each citing their evidence.",
    tone: "lavender"
  },
  {
    step: "04",
    label: "Memo",
    body: "The Managing Partner resolves disagreement and issues a recommendation you can act on.",
    tone: "dark"
  },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans selection:bg-foreground/10">
      {/* Floating nav */}
      <div className="sticky top-6 z-50 mx-auto flex max-w-5xl items-center justify-between rounded-full bg-white/80 px-6 py-4 shadow-sm backdrop-blur-md border border-border">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-foreground text-background font-black font-display text-sm">
            B
          </div>
          <Link href="/" className="font-bold tracking-tight text-foreground">
            VC Brain
          </Link>
        </div>
        <nav className="flex items-center gap-6 text-sm font-semibold">
          <Link href="/login" className="text-muted-foreground transition-colors hover:text-foreground">
            Sign in
          </Link>
          <Link href="/signup" className="rounded-full bg-foreground px-5 py-2.5 text-xs text-background transition-all hover:bg-foreground/90">
            Get access
          </Link>
        </nav>
      </div>

      <main className="mx-auto max-w-6xl px-6 pb-24 pt-8">
        
        {/* Hero Section with Video */}
        <section className="relative overflow-hidden rounded-xl bg-foreground text-background shadow-xl">
          {/* Background Video Placeholder */}
          <div className="absolute inset-0 z-0 overflow-hidden rounded-xl">
            <video 
              autoPlay 
              loop 
              muted 
              playsInline 
              className="h-full w-full object-cover opacity-30 mix-blend-screen pointer-events-none"
            >
              <source src="https://storage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4" type="video/mp4" />
            </video>
            <div className="absolute inset-0 bg-gradient-to-t from-foreground via-foreground/40 to-transparent" />
          </div>

          <div className="relative z-10 grid gap-12 p-8 md:p-16 lg:grid-cols-[1.1fr_0.9fr] lg:items-center">
            <div className="space-y-8">
              <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-xs font-semibold uppercase tracking-wider text-white backdrop-blur-sm">
                <span className="h-1.5 w-1.5 rounded-full bg-[#eae8fc] animate-pulse" />
                Autonomous Investment Committee
              </div>
              <h1 className="text-5xl font-black leading-[1.05] tracking-tight sm:text-6xl text-white">
                Every founder <br/>gets a hearing.
                <br />
                <span className="text-[#eae8fc]">Every verdict</span> shows its work.
              </h1>
              <p className="max-w-md text-base leading-relaxed text-white/80 font-medium">
                Search a founder and four AI partners research, disagree, and
                score independently — Technical, Founder, and Market build the
                case, Risk tries to break it, and a Devil&apos;s Advocate
                challenges all of them before the Managing Partner calls it.
              </p>
              
              <div className="pt-4">
                {/* Wrap FounderSearch to give it light mode context or handle styles */}
                <div className="rounded-lg bg-white p-3 shadow-lg">
                  <FounderSearch />
                </div>
                <p className="mt-4 text-xs font-medium text-white/60">
                  No deck required to look someone up — just a name, a company,
                  or a repo.
                </p>
              </div>
            </div>

            <div className="flex justify-center lg:justify-end">
              <div className="w-full max-w-sm rounded-lg bg-white text-foreground p-1.5 shadow-2xl relative">
                <div className="absolute -inset-4 rounded-xl bg-white/5 blur-xl -z-10" />
                <VerdictPreview />
              </div>
            </div>
          </div>
        </section>

        {/* Marquee Banner */}
        <div className="my-16 overflow-hidden flex whitespace-nowrap [mask-image:linear-gradient(to_right,transparent,black_10%,black_90%,transparent)]">
          <div className="flex animate-marquee gap-12 items-center">
            {[...Array(12)].map((_, i) => (
              <div key={i} className="flex items-center gap-12 text-muted-foreground/40 font-black text-2xl uppercase tracking-[0.2em]">
                <span>Data-Driven</span>
                <span className="h-2 w-2 rounded-full bg-border" />
                <span>Transparent</span>
                <span className="h-2 w-2 rounded-full bg-border" />
                <span>Objective</span>
                <span className="h-2 w-2 rounded-full bg-border" />
              </div>
            ))}
          </div>
        </div>

        {/* Bento Grid: Pillars */}
        <section className="mb-24">
          <div className="mb-12 space-y-4 max-w-2xl">
            <h2 className="text-4xl font-black tracking-tight text-foreground">
              One system, three jobs
            </h2>
            <p className="text-lg font-medium text-muted-foreground">
              Sourcing, reasoning, and memory that never resets.
            </p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-3">
            {pillars.map((p, i) => (
              <div
                key={p.name}
                className={`flex flex-col justify-between rounded-xl p-10 shadow-sm transition-transform hover:-translate-y-1 ${
                  p.tone === 'dark' ? 'bg-foreground text-background' : 
                  p.tone === 'lavender' ? 'bg-[#eae8fc] text-foreground' : 
                  'bg-white text-foreground border border-border/60'
                }`}
              >
                <div className="space-y-6">
                  <div className={`flex h-14 w-14 items-center justify-center rounded-lg text-2xl font-bold font-display ${
                    p.tone === 'dark' ? 'bg-white/10 text-white' : 
                    p.tone === 'lavender' ? 'bg-white/50 text-foreground' : 
                    'bg-foreground/5 text-foreground'
                  }`}>
                    {p.name[0]}
                  </div>
                  <h3 className="text-2xl font-bold tracking-tight">
                    {p.name}
                  </h3>
                  <p className={`text-sm leading-relaxed font-medium ${
                    p.tone === 'dark' ? 'text-white/70' : 
                    p.tone === 'lavender' ? 'text-foreground/70' : 
                    'text-muted-foreground'
                  }`}>
                    {p.body}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Bento Grid: Pipeline */}
        <section className="mb-24">
          <div className="mb-12">
            <h2 className="text-4xl font-black tracking-tight text-foreground">
              How a verdict is reached
            </h2>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {/* Search (White) */}
            <div className="relative flex flex-col rounded-xl bg-white border border-border/60 p-8 shadow-sm col-span-1">
              <div className="mb-12">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-sm font-bold text-foreground">
                  01
                </span>
              </div>
              <div className="mt-auto space-y-3">
                <h3 className="text-xl font-bold text-foreground">Search</h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  Enter a founder, startup, or GitHub URL — or let outbound sourcing surface one first.
                </p>
              </div>
            </div>

            {/* Research (Dark) */}
            <div className="relative flex flex-col rounded-xl bg-foreground text-background p-8 shadow-sm md:col-span-2">
              <div className="mb-12">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-sm font-bold text-white">
                  02
                </span>
              </div>
              <div className="mt-auto space-y-3">
                <h3 className="text-xl font-bold text-white">Research</h3>
                <p className="text-sm font-medium leading-relaxed text-white/70">
                  Public sources are collected, normalized, and folded into a structured founder profile.
                </p>
              </div>
            </div>

            {/* Committee (Lavender) */}
            <div className="relative flex flex-col rounded-xl bg-[#eae8fc] text-foreground p-8 shadow-sm md:col-span-2">
              <div className="mb-12">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/50 text-sm font-bold text-foreground">
                  03
                </span>
              </div>
              <div className="mt-auto space-y-3">
                <h3 className="text-xl font-bold">Committee</h3>
                <p className="text-sm font-medium leading-relaxed text-foreground/70">
                  Technical, Founder, Market, and Risk partners score independently, each citing their evidence.
                </p>
              </div>
            </div>

            {/* Memo (White) */}
            <div className="relative flex flex-col rounded-xl bg-white border border-border/60 p-8 shadow-sm col-span-1">
              <div className="mb-12">
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-foreground/5 text-sm font-bold text-foreground">
                  04
                </span>
              </div>
              <div className="mt-auto space-y-3">
                <h3 className="text-xl font-bold">Memo</h3>
                <p className="text-sm font-medium leading-relaxed text-muted-foreground">
                  The Managing Partner resolves disagreement and issues a recommendation you can act on.
                </p>
              </div>
            </div>
          </div>
        </section>

      </main>

      {/* Footer from reference design */}
      <footer className="mx-4 mb-4 mt-8 overflow-hidden rounded-xl bg-foreground text-background shadow-lg">
        <div className="mx-auto flex flex-col items-center gap-12 px-8 py-24 text-center">
          <div className="space-y-4">
            <h2 className="text-xl font-medium text-white/70">
              For general inquiries and
            </h2>
            <p className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              For further information or press inquiries
            </p>
          </div>
          
          <div className="flex flex-wrap items-center justify-center gap-4">
            <Link href="/contact" className="group flex items-center gap-3 rounded-full bg-white pl-6 pr-2 py-2 text-sm font-bold text-foreground transition-all hover:bg-white/90">
              Inquiries
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eae8fc] text-foreground transition-transform group-hover:translate-x-0.5">
                →
              </div>
            </Link>
            <Link href="/press" className="group flex items-center gap-3 rounded-full bg-white pl-6 pr-2 py-2 text-sm font-bold text-foreground transition-all hover:bg-white/90">
              press
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[#eae8fc] text-foreground transition-transform group-hover:translate-x-0.5">
                →
              </div>
            </Link>
          </div>
        </div>
        
        {/* Footer Bottom Bar */}
        <div className="flex flex-col items-center justify-between gap-4 bg-[#eae8fc] px-12 py-6 text-xs font-bold text-foreground sm:flex-row">
          <span>
            &copy; {new Date().getFullYear()} VC Brain
          </span>
          <div className="flex items-center gap-6">
            <Link href="#" className="hover:opacity-70 transition-opacity">Disclaimer</Link>
            <Link href="#" className="hover:opacity-70 transition-opacity">Data protection</Link>
            <Link href="#" className="hover:opacity-70 transition-opacity">imprint</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
