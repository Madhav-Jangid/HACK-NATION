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
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Dashboard
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Welcome back
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Live deal-flow view across sourcing, research, and scoring.
      </p>

      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Today&apos;s discoveries</CardTitle>
            <CardDescription>
              {discoveries.length} founder{discoveries.length === 1 ? "" : "s"} added today
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {discoveries.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing sourced yet today.</p>
            )}
            {discoveries.slice(0, 5).map((f) => (
              <Link
                key={f.id}
                href={`/founders/${f.id}`}
                className="block truncate text-sm hover:underline"
              >
                {f.name}
                {f.company_name && (
                  <span className="text-muted-foreground"> · {f.company_name}</span>
                )}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>High-conviction founders</CardTitle>
            <CardDescription>Founder Score 70 or above</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {highConvictionFounders?.length === 0 && (
              <p className="text-sm text-muted-foreground">None yet.</p>
            )}
            {highConvictionFounders?.map((f: FounderRef) => (
              <Link
                key={f.id}
                href={`/founders/${f.id}`}
                className="flex items-center justify-between text-sm hover:underline"
              >
                <span className="truncate">{f.name}</span>
                <span className="font-data text-xs text-muted-foreground">
                  {latestScoreByFounder.get(f.id)}
                </span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Active research jobs</CardTitle>
            <CardDescription>Research currently running</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {activeJobs.length === 0 && (
              <p className="text-sm text-muted-foreground">Nothing running right now.</p>
            )}
            {activeJobs.map((job) => (
              <div key={job.id} className="flex items-center justify-between text-sm">
                <Link
                  href={job.founders ? `/founders/${job.founders.id}` : "#"}
                  className="truncate hover:underline"
                >
                  {job.founders?.name ?? "Unknown founder"}
                </Link>
                <Badge variant="outline">{job.status}</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Applications</CardTitle>
            <CardDescription>
              {applicationsCount} inbound application{applicationsCount === 1 ? "" : "s"}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {applications.length === 0 && (
              <p className="text-sm text-muted-foreground">No applications yet.</p>
            )}
            {applications.map((f) => (
              <Link
                key={f.id}
                href={`/founders/${f.id}`}
                className="block truncate text-sm hover:underline"
              >
                {f.name}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Watchlist</CardTitle>
            <CardDescription>Founders you&apos;ve saved</CardDescription>
          </CardHeader>
          <CardContent className="space-y-1.5">
            {watchlist.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nothing saved yet — save a founder from their profile.
              </p>
            )}
            {watchlist.map((w) => (
              <Link
                key={w.founder_id}
                href={`/founders/${w.founder_id}`}
                className="block truncate text-sm hover:underline"
              >
                {w.founders?.name ?? "Unknown founder"}
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Notifications</CardTitle>
            <CardDescription>Nothing to flag right now</CardDescription>
          </CardHeader>
        </Card>
      </div>

      <div className="mt-8 flex gap-3">
        <Link
          href="/thesis"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Edit investment thesis
        </Link>
        <Link
          href="/founders"
          className="text-sm text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Source founders
        </Link>
      </div>
    </AppShell>
  );
}
