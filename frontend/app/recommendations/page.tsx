import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppShell } from "@/components/layout/app-shell";
import { RecommendationFeed } from "@/components/founders/recommendation-feed";
import { emptyThesis } from "@/lib/thesis/types";
import { computeMatch } from "@/lib/founders/match";
import type { Founder, FounderScore } from "@/lib/founders/types";

export default async function RecommendationsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?redirectTo=/recommendations");
  }

  const [thesisRes, foundersRes, scoresRes, actionsRes] = await Promise.all([
    supabase.from("investment_thesis").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("founders").select("*").order("created_at", { ascending: false }),
    supabase
      .from("founder_scores")
      .select("founder_id, score, confidence, is_cold_start_derived, computed_at")
      .order("computed_at", { ascending: false })
      .limit(300),
    supabase.from("founder_actions").select("founder_id").eq("user_id", user.id),
  ]);

  const thesis = thesisRes.data ?? emptyThesis;
  const founders = (foundersRes.data ?? []) as Founder[];
  const actionedIds = new Set((actionsRes.data ?? []).map((a) => a.founder_id));

  const seen = new Set<string>();
  const latestScoreByFounder = new Map<string, FounderScore>();
  for (const row of scoresRes.data ?? []) {
    if (seen.has(row.founder_id)) continue;
    seen.add(row.founder_id);
    latestScoreByFounder.set(row.founder_id, row as FounderScore);
  }

  const candidates = founders
    .filter((f) => !actionedIds.has(f.id))
    .map((f) => {
      const score = latestScoreByFounder.get(f.id) ?? null;
      const match = computeMatch(f, score, thesis);
      return { founder: f, score, match };
    })
    .filter((c) => !c.match.excluded)
    .sort((a, b) => b.match.percent - a.match.percent);

  return (
    <AppShell userEmail={user.email ?? ""}>
      <p className="text-xs font-medium tracking-[0.14em] text-muted-foreground uppercase">
        Recommendations
      </p>
      <h1 className="mt-2 text-2xl font-semibold tracking-tight">
        Your deal flow
      </h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        Ranked against your investment thesis. Act on a card and it drops off
        the feed — revisit it any time from its profile.
      </p>
      <div className="mt-8">
        <RecommendationFeed candidates={candidates} />
      </div>
    </AppShell>
  );
}
