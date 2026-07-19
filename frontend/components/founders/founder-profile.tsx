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
    <div className="w-full max-w-4xl space-y-8 font-sans">
      <Card className="rounded-lg border border-border/80 bg-[#fffdfd] p-6 shadow-sm transition-all duration-300 hover:shadow-[0_12px_35px_rgba(156,90,60,0.03)] overflow-hidden">
        <CardHeader className="flex flex-col sm:flex-row items-start justify-between gap-6 pb-6">
          <div className="space-y-3">
            <div>
              <CardTitle className="text-3xl font-bold font-elsie text-foreground">{founder.name}</CardTitle>
              <CardDescription className="text-xs text-muted-foreground mt-1">
                {founder.company_name ?? "No company on file"} · {founder.source} ·{" "}
                {founder.source_channel ?? "—"}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <Badge className="rounded-full bg-primary/10 text-primary border-none text-[10px] px-3 py-1 font-semibold">{founder.status}</Badge>
              {founder.is_cold_start && <Badge variant="outline" className="rounded-full border-primary/20 text-primary text-[10px] px-3 py-1">cold-start</Badge>}
              {founder.github_url && (
                <a
                  href={founder.github_url}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-border/85 bg-white px-3 py-1 text-[11px] font-semibold text-muted-foreground/90 transition-all hover:bg-secondary/40"
                >
                  GitHub ↗
                </a>
              )}
              {founder.company_website && (
                <a
                  href={founder.company_website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center rounded-full border border-border/85 bg-white px-3 py-1 text-[11px] font-semibold text-muted-foreground/90 transition-all hover:bg-secondary/40"
                >
                  Website ↗
                </a>
              )}
            </div>
          </div>
          <div className="flex sm:flex-col items-center sm:items-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t border-border/50 sm:border-none">
            <FounderActions founderId={founder.id} />
            <RerunResearchButton founderId={founder.id} />
          </div>
        </CardHeader>
        <CardContent className="pt-2 border-t border-border/40">
          <ResearchProgress founderId={founder.id} />
        </CardContent>
      </Card>

      {score && (
        <Card className="rounded-lg border border-border/80 bg-[#fffdfd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold font-elsie">Founder Score</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">
              {score.is_cold_start_derived
                ? "Cold-start fallback — pre-track-record, based on public footprint only."
                : "Derived from collected signals."}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 pt-3">
            <div className="flex flex-wrap items-center gap-4">
              <VerdictRule
                label="Founder Score"
                value={String(score.score)}
                suffix={`${score.confidence} confidence`}
                tone={score.is_cold_start_derived ? "neutral" : "positive"}
              />
              {trend && (
                <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">
                  {trend.symbol} {trend.label}
                </span>
              )}
              {score.is_cold_start_derived && (
                <Badge variant="outline" className="rounded-full border-primary/20 text-primary text-[10px] px-3 py-1">
                  cold-start
                </Badge>
              )}
            </div>
            <div className="rounded-lg border border-border bg-[#faf5f3]/40 p-5">
              <p className="text-xs font-bold text-foreground/80 mb-3 uppercase tracking-wider">Score Rationale</p>
              <ul className="space-y-2 text-xs text-muted-foreground font-medium">
                {score.rationale.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </div>
            {scores.length > 1 && (
              <div className="border-t border-border/50 pt-4">
                <p className="mb-2 text-xs font-bold text-foreground/80 uppercase tracking-wider">Score History</p>
                <ul className="space-y-1.5 text-xs text-muted-foreground font-medium">
                  {scores.map((s) => (
                    <li key={s.id} className="flex justify-between border-b border-border/40 pb-1">
                      <span>{formatDate(s.computed_at)}</span>
                      <span className="font-semibold text-foreground">
                        {s.score} <span className="text-[10px] text-muted-foreground">({s.confidence} conf.{s.is_cold_start_derived ? ", cold-start" : ""})</span>
                      </span>
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

      <Card className="rounded-lg border border-border/80 bg-[#fffdfd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-bold font-elsie">Key Disclosures</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Per the brief&apos;s own rule: missing data is flagged explicitly, never
            silently omitted.
            {memory.length > 0 &&
              ` ${verifiedCount} of ${memory.length} collected signal(s) are verified via a primary source.`}
          </CardDescription>
        </CardHeader>
        <CardContent className="pt-3">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {disclosures.map((d) => (
              <div key={d.label} className="flex flex-col justify-between gap-1 rounded-lg border border-border bg-[#faf5f3]/40 p-4 transition-all hover:scale-[1.01]">
                <dt className="text-[10px] font-bold tracking-wider text-muted-foreground uppercase">{d.label}</dt>
                <dd className="text-xs font-semibold text-foreground mt-1 truncate">
                  {d.value ? (
                    d.href ? (
                      <a
                        href={d.href}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary hover:underline hover:opacity-95"
                      >
                        {d.value}
                      </a>
                    ) : (
                      d.value
                    )
                  ) : (
                    <span className="italic text-muted-foreground/60 font-normal">Not disclosed</span>
                  )}
                </dd>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {memory.length === 0 && (
        <p className="text-xs text-muted-foreground italic font-medium text-center py-6">
          No founder memory collected yet — research may still be running above.
        </p>
      )}

      {CATEGORY_ORDER.filter((cat) => byCategory.has(cat)).map((cat) => (
        <Card key={cat} className="rounded-lg border border-border/80 bg-[#fffdfd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-bold font-elsie">{CATEGORY_LABELS[cat]}</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">{byCategory.get(cat)!.length} item(s) collected</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3 pt-3">
            {byCategory.get(cat)!.map((item) => (
              <div key={item.id} className="rounded-lg border border-border bg-[#faf5f3]/45 p-4 transition-all hover:scale-[1.01]">
                <div className="flex items-start justify-between gap-3">
                  {item.source_url ? (
                    <a
                      href={item.source_url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-bold text-foreground hover:underline font-elsie line-clamp-1"
                    >
                      {item.payload.title || item.source_url}
                    </a>
                  ) : (
                    <span className="text-xs font-bold text-foreground font-elsie line-clamp-1">
                      {item.payload.title || "Untitled"}
                    </span>
                  )}
                  <div className="flex shrink-0 items-center gap-1.5">
                    <TrustBadge confidence={item.confidence} />
                    <Badge variant="outline" className="rounded-full text-[9px] px-2 py-0.5 border-primary/20 text-primary bg-primary/5">{item.source_type ?? "unknown"}</Badge>
                  </div>
                </div>
                {item.payload.snippet && (
                  <p className="mt-2 text-xs leading-relaxed text-muted-foreground font-medium">
                    {item.payload.snippet}
                  </p>
                )}
                <div className="mt-2 flex justify-between text-[10px] text-muted-foreground/80 font-semibold border-t border-border/40 pt-2">
                  <span>Collected {formatDate(item.collected_at)}</span>
                  {item.confidence != null && (
                    <span>confidence {Math.round(item.confidence * 100)}%</span>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      ))}

      {timeline.length > 0 && (
        <Card className="rounded-lg border border-border/80 bg-[#fffdfd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
          <CardHeader className="pb-3">
            <CardTitle className="text-base font-bold font-elsie">Timeline</CardTitle>
            <CardDescription className="text-xs text-muted-foreground">All collected signals, most recent first.</CardDescription>
          </CardHeader>
          <CardContent className="pt-3">
            <ol className="space-y-4 border-l border-border/80 pl-5 ml-1">
              {timeline.map((item) => (
                <li key={item.id} className="relative">
                  <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_8px_rgba(156,90,60,0.5)]" />
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {formatDate(item.collected_at)} · {CATEGORY_LABELS[item.category]}
                  </p>
                  <p className="text-xs font-semibold text-foreground mt-1">{item.payload.title || item.source_url}</p>
                </li>
              ))}
            </ol>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
