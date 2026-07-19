import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  ActivitySparkline,
  LiveProgressRing,
  AnimatedCard,
} from "@/components/dashboard/dashboard-charts";
import { AutoSourcingPanel } from "@/components/dashboard/auto-sourcing-panel";

type FounderRef = { id: string; name: string; company_name: string | null; source?: string; source_channel?: string | null };

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

function getAvatarColorClass(seed: string) {
  const colors = [
    "bg-red-100 text-red-700",
    "bg-orange-100 text-orange-700",
    "bg-amber-100 text-amber-700",
    "bg-green-100 text-green-700",
    "bg-emerald-100 text-emerald-700",
    "bg-teal-100 text-teal-700",
    "bg-cyan-100 text-cyan-700",
    "bg-blue-100 text-blue-700",
    "bg-indigo-100 text-indigo-700",
    "bg-violet-100 text-violet-700",
    "bg-purple-100 text-purple-700",
    "bg-fuchsia-100 text-fuchsia-700",
    "bg-pink-100 text-pink-700",
    "bg-rose-100 text-rose-700"
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

function getScoreColorClass(seed: string) {
  const colors = [
    "bg-red-500 text-white",
    "bg-orange-500 text-white",
    "bg-amber-500 text-white",
    "bg-green-500 text-white",
    "bg-emerald-500 text-white",
    "bg-teal-500 text-white",
    "bg-cyan-500 text-white",
    "bg-blue-500 text-white",
    "bg-indigo-500 text-white",
    "bg-violet-500 text-white",
    "bg-purple-500 text-white",
    "bg-fuchsia-500 text-white",
    "bg-pink-500 text-white",
    "bg-rose-500 text-white"
  ];
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = seed.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [discoveriesRes, activeJobsRes, applicationsRes, scoresRes, watchlistRes, thesisRes] =
    await Promise.all([
      supabase
        .from("founders")
        .select("id, name, company_name")
        .gte("created_at", startOfToday())
        .order("created_at", { ascending: false }),
      supabase
        .from("research_jobs")
        .select("id, status, founders(id, name, company_name)")
        .in("status", ["queued", "running"])
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("founders")
        .select("id, name, company_name", { count: "exact" })
        .eq("source", "inbound")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("founder_scores")
        .select("founder_id, score, computed_at")
        .order("computed_at", { ascending: false })
        .limit(200),
      supabase
        .from("founder_actions")
        .select("founder_id, founders(id, name, company_name, source, source_channel)")
        .eq("user_id", user.id)
        .eq("action", "save")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("investment_thesis")
        .select("sectors, stage, geography")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

  const thesis = thesisRes.data;

  const discoveries = (discoveriesRes.data ?? []) as FounderRef[];

  const activeJobs = (activeJobsRes.data ?? []) as unknown as {
    id: string;
    status: string;
    founders: FounderRef | null;
  }[];

  const applications = (applicationsRes.data ?? []) as FounderRef[];
  const applicationsCount = applicationsRes.count ?? applications.length;

  const watchlist = (watchlistRes.data ?? []) as unknown as {
    founder_id: string;
    founders: FounderRef | null;
  }[];

  // Latest score per founder: rows are already ordered by computed_at desc, so
  // the first occurrence of a founder_id is necessarily its most recent score.
  const seen = new Set<string>();
  const latestScoreByFounder = new Map<string, number>();
  for (const row of scoresRes.data ?? []) {
    if (seen.has(row.founder_id)) continue;
    seen.add(row.founder_id);
    latestScoreByFounder.set(row.founder_id, row.score);
  }
  const highConvictionIds = [...latestScoreByFounder.entries()]
    .filter(([, score]) => score >= 70)
    .map(([id]) => id)
    .slice(0, 5);

  const { data: highConvictionFounders } = highConvictionIds.length
    ? await supabase
      .from("founders")
      .select("id, name, company_name")
      .in("id", highConvictionIds)
    : { data: [] as FounderRef[] };

  return (
    <AppShell userEmail={user.email ?? ""}>
      <div>
        <p className="text-[10px] font-bold tracking-[0.15em] text-primary uppercase">
          Dashboard
        </p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-foreground font-elsie">
          Welcome back
        </h1>
        <p className="mt-2 max-w-lg text-xs text-muted-foreground font-medium">
          Live deal-flow view across sourcing, research, and scoring.
        </p>
      </div>

      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <AutoSourcingPanel
          sectors={thesis?.sectors ?? []}
          stage={thesis?.stage ?? []}
          geography={thesis?.geography ?? []}
          hasThesis={!!thesis}
        />

        {/* Today's Discoveries - with chart */}
        <AnimatedCard delay={0.1} className="p-6 col-span-1 sm:col-span-2 lg:col-span-2 flex flex-col justify-between overflow-hidden relative">
          <div className="relative z-10 flex justify-between items-start">
            <div>
              <h3 className="text-lg font-bold font-elsie text-foreground">Activity Pulse</h3>
              <p className="text-xs text-muted-foreground mt-1">Discoveries & inbound applications</p>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-3xl font-black text-foreground font-elsie">{discoveries.length + applicationsCount}</span>
              <div className="flex items-center gap-1.5 mt-1">
                {(() => {
                  const todayTotal = discoveries.length + applicationsCount;
                  let trendPct = 0;
                  let isUp = true;
                  let isNeutral = false;

                  if (todayTotal === 0) {
                    isNeutral = true;
                  } else {
                    const yesterdayMock = Math.max(1, Math.floor(todayTotal * 0.76)); // Mock historical trend for MVP UI
                    trendPct = Math.round(((todayTotal - yesterdayMock) / yesterdayMock) * 100);
                    isUp = trendPct >= 0;
                  }

                  let badgeClass = "bg-secondary text-muted-foreground";
                  if (!isNeutral) {
                    badgeClass = isUp ? 'bg-emerald-500/15 text-emerald-600' : 'bg-red-500/15 text-red-600';
                  }

                  return (
                    <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${badgeClass}`}>
                      {isNeutral ? '−' : (isUp ? '▲' : '▼')} {Math.abs(trendPct)}%
                    </span>
                  );
                })()}
                <span className="text-[9px] font-bold uppercase tracking-wider text-muted-foreground">Today</span>
              </div>
            </div>
          </div>
          <div className="relative z-0 -mx-6 -mb-6 mt-4">
            <ActivitySparkline data={[]} />
          </div>
        </AnimatedCard>

        {/* Active Research Jobs - with ring */}
        <AnimatedCard delay={0.2} className="p-6 flex flex-col justify-between">
          <div>
            <h3 className="text-base font-bold font-elsie text-foreground">Active Jobs</h3>
            <p className="text-xs text-muted-foreground mt-1">AI committee runs</p>
          </div>
          <div className="my-4">
            <LiveProgressRing
              active={activeJobs.filter(j => j.status === 'running').length}
              queued={activeJobs.filter(j => j.status === 'queued').length}
            />
          </div>
          <div className="space-y-2 mt-auto">
            {activeJobs.slice(0, 2).map((job) => (
              <div key={job.id} className="flex items-center justify-between text-[11px]">
                <span className="truncate font-semibold text-foreground/80">{job.founders?.name ?? "Unknown"}</span>
                <Badge variant="outline" className="rounded-full text-[9px] px-2 py-0.5 border-primary/20 text-primary bg-primary/5">{job.status}</Badge>
              </div>
            ))}
          </div>
        </AnimatedCard>

        {/* High-conviction founders */}
        <AnimatedCard delay={0.3} className="p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold font-elsie text-foreground">High Conviction</h3>
            <p className="text-xs text-muted-foreground mt-1">Score 70+</p>
          </div>
          <div className="space-y-3">
            {highConvictionFounders?.length === 0 && (
              <p className="text-xs text-muted-foreground/80 italic font-medium">None found yet.</p>
            )}
            {highConvictionFounders?.map((f: FounderRef) => (
              <Link
                key={f.id}
                href={`/founders/${f.id}`}
                className="group flex items-center justify-between rounded-xl bg-secondary/20 p-3 transition-colors hover:bg-secondary/40"
              >
                <span className="truncate text-xs font-semibold text-foreground/80 group-hover:text-primary">{f.name}</span>
                <div className={`flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs shadow-sm ${getScoreColorClass(f.id)}`}>
                  {latestScoreByFounder.get(f.id)}
                </div>
              </Link>
            ))}
          </div>
        </AnimatedCard>

        {/* Watchlist */}
        <AnimatedCard delay={0.4} className="p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold font-elsie text-foreground">Watchlist</h3>
            <p className="text-xs text-muted-foreground mt-1">Saved profiles</p>
          </div>
          <div className="grid grid-cols-2 gap-2">
            {watchlist.length === 0 && (
              <p className="text-xs col-span-2 text-muted-foreground/80 italic font-medium">
                Nothing saved yet.
              </p>
            )}
            {watchlist.map((w) => {
              const f = w.founders;
              if (!f) return null;
              return (
                <Link
                  key={w.founder_id}
                  href={`/founders/${w.founder_id}`}
                  className="col-span-2 flex items-center gap-3 rounded-lg border border-border/60 bg-white/50 p-3 transition-all hover:border-primary/30 hover:bg-white hover:shadow-sm group"
                >
                  <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-bold ${getAvatarColorClass(f.id)}`}>
                    {f.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-foreground/80 group-hover:text-primary">
                      {f.name}
                    </p>
                    <p className="truncate text-xs text-muted-foreground mt-0.5">
                      {f.company_name ? f.company_name : (f.source_channel ? `Sourced via ${f.source_channel}` : (f.source === 'inbound' ? 'Inbound Applicant' : 'Outbound Discovery'))}
                    </p>
                  </div>
                </Link>
              );
            })}
          </div>
        </AnimatedCard>

        {/* Recent Discoveries List */}
        <AnimatedCard delay={0.5} className="p-6">
          <div className="mb-4">
            <h3 className="text-base font-bold font-elsie text-foreground">Recent Finds</h3>
            <p className="text-xs text-muted-foreground mt-1">Latest inbound & sourced</p>
          </div>
          <div className="space-y-3">
            {discoveries.slice(0, 4).map((f) => (
              <Link
                key={f.id}
                href={`/founders/${f.id}`}
                className="flex items-center gap-3 group"
              >
                <div className={`h-6 w-6 shrink-0 rounded-full flex items-center justify-center text-[10px] font-bold ${getAvatarColorClass(f.id)}`}>
                  {f.name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-foreground/80 group-hover:text-primary group-hover:underline">
                    {f.name}
                  </p>
                  {f.company_name && (
                    <p className="truncate text-[10px] text-muted-foreground">
                      {f.company_name}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </AnimatedCard>
      </div>

      <div className="mt-8 flex gap-4 border-t border-border/40 pt-6">
        <Link
          href="/thesis"
          className="text-xs font-bold text-primary bg-primary/5 hover:bg-primary/10 px-4 py-2 rounded-full transition-all"
        >
          Edit investment thesis
        </Link>
        <Link
          href="/founders"
          className="text-xs font-bold text-foreground/75 bg-secondary/40 hover:bg-secondary/60 px-4 py-2 rounded-full transition-all"
        >
          Source founders
        </Link>
      </div>
    </AppShell>
  );
}
