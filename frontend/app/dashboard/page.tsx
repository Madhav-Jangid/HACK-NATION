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

type FounderRef = { id: string; name: string; company_name: string | null };

function startOfToday(): string {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const [discoveriesRes, activeJobsRes, applicationsRes, scoresRes, watchlistRes] =
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
        .select("founder_id, founders(id, name, company_name)")
        .eq("user_id", user.id)
        .eq("action", "save")
        .order("created_at", { ascending: false })
        .limit(5),
    ]);

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

      <div className="mt-8 grid gap-6 sm:grid-cols-2">
        <Card className="rounded-[2rem] border border-border/85 bg-[#fffdfd] shadow-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
          <CardHeader>
            <CardTitle className="text-base font-bold font-elsie">Today&apos;s discoveries</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {discoveries.length} founder{discoveries.length === 1 ? "" : "s"} added today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {discoveries.length === 0 && (
              <p className="text-xs text-muted-foreground/80 italic font-medium">Nothing sourced yet today.</p>
            )}
            {discoveries.slice(0, 5).map((f) => (
              <Link
                key={f.id}
                href={`/founders/${f.id}`}
                className="block truncate text-xs font-semibold text-foreground/80 hover:text-primary hover:underline"
              >
                {f.name}
                {f.company_name && (
                  <span className="text-muted-foreground font-normal"> · {f.company_name}</span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-border/85 bg-[#fffdfd] shadow-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
          <CardHeader>
            <CardTitle className="text-base font-bold font-elsie">High-conviction founders</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Founder Score 70 or above</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {highConvictionFounders?.length === 0 && (
              <p className="text-xs text-muted-foreground/80 italic font-medium">None found yet.</p>
            )}
            {highConvictionFounders?.map((f: FounderRef) => (
              <Link
                key={f.id}
                href={`/founders/${f.id}`}
                className="flex items-center justify-between text-xs font-semibold text-foreground/80 hover:text-primary hover:underline"
              >
                <span className="truncate">{f.name}</span>
                <span className="font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full text-[10px]">
                  {latestScoreByFounder.get(f.id)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-border/85 bg-[#fffdfd] shadow-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
          <CardHeader>
            <CardTitle className="text-base font-bold font-elsie">Active research jobs</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Research currently running</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {activeJobs.length === 0 && (
              <p className="text-xs text-muted-foreground/80 italic font-medium">Nothing running right now.</p>
            )}
            {activeJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between text-xs">
                <Link
                  href={job.founders ? `/founders/${job.founders.id}` : "#"}
                  className="truncate font-semibold text-foreground/80 hover:text-primary hover:underline"
                >
                  {job.founders?.name ?? "Unknown founder"}
                </Link>
                <Badge variant="outline" className="rounded-full text-[9px] px-2 py-0.5 border-primary/20 text-primary bg-primary/5">{job.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-border/85 bg-[#fffdfd] shadow-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
          <CardHeader>
            <CardTitle className="text-base font-bold font-elsie">Applications</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {applicationsCount} inbound application{applicationsCount === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {applications.length === 0 && (
              <p className="text-xs text-muted-foreground/80 italic font-medium">No applications yet.</p>
            )}
            {applications.map((f) => (
              <Link
                key={f.id}
                href={`/founders/${f.id}`}
                className="block truncate text-xs font-semibold text-foreground/80 hover:text-primary hover:underline"
              >
                {f.name}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-border/85 bg-[#fffdfd] shadow-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
          <CardHeader>
            <CardTitle className="text-base font-bold font-elsie">Watchlist</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Founders you&apos;ve saved</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2.5">
            {watchlist.length === 0 && (
              <p className="text-xs text-muted-foreground/80 italic font-medium">
                Nothing saved yet — save a founder from their profile.
              </p>
            )}
            {watchlist.map((w) => (
              <Link
                key={w.founder_id}
                href={`/founders/${w.founder_id}`}
                className="block truncate text-xs font-semibold text-foreground/80 hover:text-primary hover:underline"
              >
                {w.founders?.name ?? "Unknown founder"}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="rounded-[2rem] border border-border/85 bg-[#fffdfd] shadow-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
          <CardHeader>
            <CardTitle className="text-base font-bold font-elsie">Notifications</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">Nothing to flag right now</CardDescription>
          </CardHeader>
          <CardContent className="h-10 flex items-center justify-center">
            <span className="text-xs text-muted-foreground/60 italic">Inbox clean</span>
          </CardContent>
        </Card>
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
