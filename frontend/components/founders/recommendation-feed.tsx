"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import { VerdictRule } from "@/components/ui/verdict-rule";
import { FounderActions } from "@/components/founders/founder-actions";
import type { MatchResult } from "@/lib/founders/match";
import type { Founder, FounderScore } from "@/lib/founders/types";

type Candidate = { founder: Founder; score: FounderScore | null; match: MatchResult };

export function RecommendationFeed({ candidates }: { candidates: Candidate[] }) {
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const visible = candidates.filter((c) => !dismissed.has(c.founder.id));

  if (visible.length === 0) {
    return (
      <p className="text-sm text-muted-foreground">
        Nothing left in your feed — source more founders, or revisit acted-on
        ones from the Founders pipeline.
      </p>
    );
  }

  return (
    <div className="space-y-6">
      {visible.map(({ founder, score, match }) => (
        <Card key={founder.id} className="rounded-lg border border-border/85 bg-[#fffdfd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_12px_35px_rgba(156,90,60,0.03)]">
          <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-border/40">
            <div>
              <CardTitle className="text-base font-bold font-elsie">
                <Link href={`/founders/${founder.id}`} className="hover:underline text-foreground">
                  {founder.name}
                </Link>
              </CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-0.5">
                {founder.company_name ?? "No company on file"} · {founder.source}
              </CardDescription>
              {founder.is_cold_start && (
                <Badge variant="outline" className="rounded-full text-[9px] px-2 py-0.5 border-primary/20 text-primary bg-primary/5 mt-2">
                  cold-start
                </Badge>
              )}
            </div>
            <FounderActions
              founderId={founder.id}
              onAction={() => setDismissed((prev) => new Set(prev).add(founder.id))}
            />
          </CardHeader>
          <CardContent className="space-y-4 pt-5">
            <div className="flex flex-wrap items-center gap-6">
              <VerdictRule
                label="Thesis fit"
                value={`${match.percent}%`}
                tone={match.percent >= 60 ? "positive" : match.percent < 30 ? "negative" : "neutral"}
              />
              {score && (
                <VerdictRule
                  label="Founder Score"
                  value={String(score.score)}
                  suffix={`${score.confidence} conf.`}
                  size="sm"
                />
              )}
            </div>
            <div className="rounded-lg border border-border bg-[#faf5f3]/40 p-4">
              <ul className="space-y-2 text-xs text-muted-foreground font-medium pl-1">
                {match.reasons.map((reason, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{reason}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
