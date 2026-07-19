"use client";

import { useState } from "react";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { ResearchProgress } from "@/components/founders/research-progress";
import { CommitteePanel } from "@/components/founders/committee-panel";
import { ThreeAxisScores } from "@/components/founders/three-axis-scores";
import { InvestmentMemoPanel } from "@/components/founders/investment-memo";
import { OutreachDraft } from "@/components/founders/outreach-draft";
import { VerdictRule } from "@/components/ui/verdict-rule";
import { FounderActions } from "@/components/founders/founder-actions";
import type { Founder, FounderMemory, FounderScore } from "@/lib/founders/types";

const CATEGORY_LABELS: Record<FounderMemory["category"], string> = {
  open_source: "Open Source & GitHub",
  project: "Projects & Launches",
  company: "Company & Website",
  research: "Research & Papers",
  other: "News & Mentions",
  education: "Education",
  experience: "Experience",
  award: "Awards",
  patent: "Patents",
  funding: "Funding",
  social: "Social Profiles",
};

const CATEGORY_ORDER: FounderMemory["category"][] = [
  "open_source",
  "project",
  "funding",
  "company",
  "research",
  "experience",
  "education",
  "award",
  "patent",
  "social",
  "other",
];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

// Mirrors backend/app/services/trust_layer.py's VERIFIED_THRESHOLD — items fetched
// directly from the founder's own linked profile score 0.85; items found via a
// relevance-filtered public search score 0.55. Below this line, a claim is shown
// as unverified rather than silently trusted.
const VERIFIED_THRESHOLD = 0.8;

function TrustBadge({ confidence }: { confidence: number | null }) {
  if (confidence == null) return null;
  const verified = confidence >= VERIFIED_THRESHOLD;
  return (
    <Badge variant={verified ? "secondary" : "outline"}>
      {verified ? "Verified · primary source" : "Unverified · secondary source"}
    </Badge>
  );
}

type Disclosure = { label: string; value: string | null; href?: string };

function disclosuresFor(founder: Founder, memory: FounderMemory[]): Disclosure[] {
  const hasFundingEvidence = memory.some((m) => m.category === "funding");
  return [
    { label: "Company", value: founder.company_name },
    { label: "Company website", value: founder.company_website, href: founder.company_website ?? undefined },
    { label: "GitHub", value: founder.github_url, href: founder.github_url ?? undefined },
    { label: "LinkedIn", value: founder.linkedin_url, href: founder.linkedin_url ?? undefined },
    { label: "Twitter / X", value: founder.twitter_url, href: founder.twitter_url ?? undefined },
    { label: "Funding", value: hasFundingEvidence ? "See Funding section below" : null },
  ];
}

function RerunResearchButton({ founderId }: { founderId: string }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/founders/${founderId}/research`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Couldn't start research.");
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" variant="outline" onClick={handleClick} disabled={loading}>
        {loading ? "Starting…" : "Re-run research"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

function scoreTrend(scores: FounderScore[]): { label: string; symbol: string } | null {
  if (scores.length < 2) return null;
  const delta = scores[0].score - scores[1].score;
  if (delta > 0) return { label: `+${delta} vs last score`, symbol: "↑" };
  if (delta < 0) return { label: `${delta} vs last score`, symbol: "↓" };
  return { label: "no change vs last score", symbol: "→" };
}

export function FounderProfile({
  founder,
  memory,
  scores,
}: {
  founder: Founder;
  memory: FounderMemory[];
  scores: FounderScore[];
}) {
  const score = scores[0] ?? null;
  const trend = scoreTrend(scores);
  const byCategory = new Map<FounderMemory["category"], FounderMemory[]>();
  for (const item of memory) {
    const list = byCategory.get(item.category) ?? [];
    list.push(item);
    byCategory.set(item.category, list);
  }

  const timeline = [...memory].sort(
    (a, b) => new Date(b.collected_at).getTime() - new Date(a.collected_at).getTime(),
  );

  const disclosures = disclosuresFor(founder, memory);
  const verifiedCount = memory.filter((m) => (m.confidence ?? 0) >= VERIFIED_THRESHOLD).length;

  return (
    <div className="w-full max-w-3xl space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-start justify-between gap-4">
          <div>
            <CardTitle className="text-2xl">{founder.name}</CardTitle>
            <CardDescription>
              {founder.company_name ?? "No company on file"} · {founder.source} ·{" "}
              {founder.source_channel ?? "—"}
            </CardDescription>
            <div className="mt-2 flex flex-wrap gap-2">
              <Badge variant="secondary">{founder.status}</Badge>
              {founder.is_cold_start && <Badge variant="outline">cold-start</Badge>}
              {founder.github_url && (
                <a
                  href={founder.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  GitHub ↗
                </a>
              )}
              {founder.company_website && (
                <a
                  href={founder.company_website}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-muted-foreground hover:underline"
                >
                  Website ↗
                </a>
              )}
            </div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <FounderActions founderId={founder.id} />
            <RerunResearchButton founderId={founder.id} />
          </div>
        </CardHeader>
        <CardContent>
          <ResearchProgress founderId={founder.id} />
        </CardContent>
      </Card>

      {score && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Founder Score</CardTitle>
            <CardDescription>
              {score.is_cold_start_derived
                ? "Cold-start fallback — pre-track-record, based on public footprint only."
                : "Derived from collected signals."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-end gap-4">
              <VerdictRule
                label="Founder Score"
                value={String(score.score)}
                suffix={`${score.confidence} confidence`}
                tone={score.is_cold_start_derived ? "neutral" : "positive"}
              />
              {trend && (
                <span className="pb-1 text-sm text-muted-foreground">
                  {trend.symbol} {trend.label}
                </span>
              )}
              {score.is_cold_start_derived && (
                <Badge variant="outline" className="mb-1">
                  cold-start
                </Badge>
              )}
            </div>
            <ul className="list-disc space-y-1 pl-4 text-xs text-muted-foreground">
              {score.rationale.map((line, i) => (
                <li key={i}>{line}</li>
              ))}
            </ul>
            {scores.length > 1 && (
              <div className="border-t pt-2">
                <p className="mb-1 text-xs font-medium text-muted-foreground">History</p>
                <ul className="space-y-0.5 text-xs text-muted-foreground">
                  {scores.map((s) => (
                    <li key={s.id}>
                      {formatDate(s.computed_at)} — {s.score} ({s.confidence}
                      {s.is_cold_start_derived ? ", cold-start" : ""})
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <CommitteePanel founderId={founder.id} />

      <ThreeAxisScores founderId={founder.id} />

      <InvestmentMemoPanel founderId={founder.id} founderName={founder.name} />

      <OutreachDraft founderId={founder.id} />

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Key Disclosures</CardTitle>
          <CardDescription>
            Per the brief&apos;s own rule: missing data is flagged explicitly, never
            silently omitted.
            {memory.length > 0 &&
              ` ${verifiedCount} of ${memory.length} collected signal(s) are verified via a primary source.`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
            {disclosures.map((d) => (
              <div key={d.label} className="flex justify-between gap-3 border-b pb-1">
                <dt className="text-muted-foreground">{d.label}</dt>
                <dd>
                  {d.value ? (
                    d.href ? (
                      <a
                        href={d.href}
                        target="_blank"
                        rel="noreferrer"
                        className="hover:underline"
                      >
                        {d.value}
                      </a>
                    ) : (
                      d.value
                    )
                  ) : (
                    <span className="italic text-muted-foreground">Not disclosed</span>
                  )}
                </dd>
              </div>
            ))}
          </dl>
        </CardContent>
      </Card>

      {memory.length === 0 && (
        <p className="text-sm text-muted-foreground">
          No founder memory collected yet — research may still be running above.
        </p>
      )}

      {CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => (
        <Card key={cat}>
          <CardHeader>
            <CardTitle className="text-base">{CATEGORY_LABELS[cat]}</CardTitle>
            <CardDescription>{byCategory.get(cat)!.length} item(s)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {byCategory.get(cat)!.map((item) => (
              <div key={item.id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  {item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-medium hover:underline"
                    >
                      {item.payload.title || item.source_url}
                    </a>
                  ) : (
                    <span className="text-sm font-medium">
                      {item.payload.title || "Untitled"}
                    </span>
                  )}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <TrustBadge confidence={item.confidence} />
                    <Badge variant="outline">{item.source_type ?? "unknown"}</Badge>
                  </div>
                </div>
                {item.payload.snippet && (
                  <p className="mt-1 line-clamp-2 text-xs text-muted-foreground">
                    {item.payload.snippet}
                  </p>
                )}
                <p className="mt-1 text-xs text-muted-foreground">
                  Collected {formatDate(item.collected_at)}
                  {item.confidence != null && (
                    <> · confidence {Math.round(item.confidence * 100)}%</>
                  )}
                </p>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {timeline.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Timeline</CardTitle>
            <CardDescription>All collected signals, most recent first.</CardDescription>
          </CardHeader>
          <CardContent>
            <ol className="space-y-3 border-l pl-4">
              {timeline.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[21px] top-1 h-2 w-2 rounded-full bg-foreground/40" />
                  <p className="text-xs text-muted-foreground">
                    {formatDate(item.collected_at)} · {CATEGORY_LABELS[item.category]}
                  </p>
                  <p className="text-sm">{item.payload.title || item.source_url}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
