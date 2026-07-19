"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { VerdictRule } from "@/components/ui/verdict-rule";
import type { OpportunityAxis, OpportunityScore } from "@/lib/founders/types";

const AXIS_ORDER: OpportunityAxis[] = ["founder", "market", "idea_vs_market"];

const AXIS_LABELS: Record<OpportunityAxis, string> = {
  founder: "Founder",
  market: "Market",
  idea_vs_market: "Idea vs Market",
};

function trendFor(history: OpportunityScore[]): string {
  if (history.length < 2) return "";
  const delta = history[0].score - history[1].score;
  if (delta > 0) return `↑ +${delta}`;
  if (delta < 0) return `↓ ${delta}`;
  return "→ no change";
}

/**
 * Phase 9: the brief's 3-axis screening, displayed as three independent
 * VerdictRules — deliberately never combined into a single average, since the
 * brief is explicit that these axes must never be averaged together.
 */
export function ThreeAxisScores({ founderId }: { founderId: string }) {
  const [byAxis, setByAxis] = useState<Record<OpportunityAxis, OpportunityScore[]>>({
    founder: [],
    market: [],
    idea_vs_market: [],
  });

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;

    supabase
      .from("opportunity_scores")
      .select("*")
      .eq("founder_id", founderId)
      .order("computed_at", { ascending: false })
      .limit(30)
      .then(({ data }) => {
        if (cancelled || !data) return;
        const grouped: Record<OpportunityAxis, OpportunityScore[]> = {
          founder: [],
          market: [],
          idea_vs_market: [],
        };
        for (const row of data as OpportunityScore[]) {
          grouped[row.axis].push(row);
        }
        setByAxis(grouped);
      });

    return () => {
      cancelled = true;
    };
  }, [founderId]);

  const hasAny = AXIS_ORDER.some((axis) => byAxis[axis].length > 0);
  if (!hasAny) return null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Three Independent Scores</CardTitle>
        <CardDescription>
          Founder, Market, and Idea-vs-Market — scored independently, never
          averaged together.
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-3">
        {AXIS_ORDER.map((axis) => {
          const history = byAxis[axis];
          const latest = history[0];
          if (!latest) {
            return (
              <div key={axis}>
                <p className="text-[10px] font-medium tracking-[0.14em] text-muted-foreground uppercase">
                  {AXIS_LABELS[axis]}
                </p>
                <p className="mt-1 text-sm text-muted-foreground italic">
                  Not yet scored
                </p>
              </div>
            );
          }
          return (
            <VerdictRule
              key={axis}
              label={AXIS_LABELS[axis]}
              value={String(latest.score)}
              suffix={trendFor(history) || `${latest.confidence} conf.`}
              tone={
                latest.score >= 65 ? "positive" : latest.score < 40 ? "negative" : "neutral"
              }
            />
          );
        })}
      </CardContent>
    </Card>
  );
}
