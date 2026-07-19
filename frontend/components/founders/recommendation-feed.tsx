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
    <div className="space-y-4">
      {visible.map(({ founder, score, match }) => (
        <Card key={founder.id}>
          <CardHeader className="flex flex-row items-start justify-between gap-4">
            <div>
              <CardTitle>
                <Link href={`/founders/${founder.id}`} className="hover:underline">
                  {founder.name}
                </Link>
              </CardTitle>
              <CardDescription>
                {founder.company_name ?? "No company on file"} · {founder.source}
              </CardDescription>
              {founder.is_cold_start && (
                <Badge variant="outline" className="mt-2">
                  cold-start
                </Badge>
              )}
            </div>
            <FounderActions
              founderId={founder.id}
              onAction={() => setDismissed((prev) => new Set(prev).add(founder.id))}
            />
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex flex-wrap items-end gap-6">
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
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {match.reasons.map((reason, i) => (
                <li key={i}>{reason}</li>
              ))}
            </ul>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
