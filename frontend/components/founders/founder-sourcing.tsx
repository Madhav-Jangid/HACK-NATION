"use client";

import { useEffect, useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Badge } from "@/app/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import Link from "next/link";
import type { Founder, FounderCandidate } from "@/lib/founders/types";

const SEARCH_CHANNELS = [
  { value: "all", label: "All sources" },
  { value: "github", label: "GitHub" },
  { value: "producthunt", label: "Product Hunt" },
  { value: "hackernews", label: "Hacker News" },
  { value: "website", label: "Company website" },
] as const;

function urlFieldFor(sourceChannel: string): "github_url" | "linkedin_url" | "twitter_url" | "company_website" | null {
  switch (sourceChannel) {
    case "github":
      return "github_url";
    case "linkedin":
      return "linkedin_url";
    case "twitter":
      return "twitter_url";
    case "website":
      return "company_website";
    default:
      return null;
  }
}

type CandidateWithOrigin = FounderCandidate & { origin: "inbound" | "outbound" };

export function FounderSourcing() {
  const [query, setQuery] = useState("");
  const [channel, setChannel] = useState("all");
  const [searching, setSearching] = useState(false);
  const [discovering, setDiscovering] = useState(false);
  const [candidates, setCandidates] = useState<CandidateWithOrigin[]>([]);
  const [tracked, setTracked] = useState<Founder[]>([]);
  const [trackingUrl, setTrackingUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadTracked() {
    const res = await fetch("/api/founders");
    const data = await res.json();
    if (res.ok) setTracked(data.founders ?? []);
  }

  useEffect(() => {
    fetch("/api/founders")
      .then((res) => res.json())
      .then((data) => setTracked(data.founders ?? []));
  }, []);

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearching(true);
    setError(null);

    const res = await fetch("/api/founders/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, max_results: 5, channel }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Search failed.");
      setSearching(false);
      return;
    }

    setCandidates(
      (data as FounderCandidate[]).map((c) => ({ ...c, origin: "inbound" as const })),
    );
    setSearching(false);
  }

  async function handleDiscover() {
    setDiscovering(true);
    setError(null);

    // A typed query means the investor wants *this* person/handle on GitHub, not
    // a generic thesis-driven scan — route it through the same exact-match search
    // path as the Search button (forcing the GitHub channel) instead of silently
    // ignoring what they typed.
    const hasQuery = query.trim().length > 0;
    const res = await fetch(hasQuery ? "/api/founders/search" : "/api/founders/discover", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        hasQuery
          ? { query, max_results: 5, channel: "github" }
          : { channel: "github", max_results: 5 },
      ),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Discovery failed.");
      setDiscovering(false);
      return;
    }

    setCandidates(
      (data as FounderCandidate[]).map((c) => ({
        ...c,
        origin: hasQuery ? ("inbound" as const) : ("outbound" as const),
      })),
    );
    setDiscovering(false);
  }

  async function handleTrack(candidate: CandidateWithOrigin) {
    setTrackingUrl(candidate.url);
    setError(null);

    const urlField = urlFieldFor(candidate.source_channel);

    const res = await fetch("/api/founders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: candidate.title,
        ...(urlField ? { [urlField]: candidate.url } : {}),
        source: candidate.origin,
        source_channel: candidate.source_channel,
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Couldn't track this founder.");
      setTrackingUrl(null);
      return;
    }

    await loadTracked();
    setTrackingUrl(null);
  }  return (
    <div className="w-full space-y-8">
      <Card className="rounded-[2rem] border border-border/80 bg-[#fffdfd] shadow-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
        <CardHeader>
          <CardTitle className="text-base font-bold font-elsie">Search a founder</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Name, startup, or a pasted LinkedIn / GitHub / company URL — pasted
            links are fetched directly for an exact match, not fuzzily searched.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <form onSubmit={handleSearch} className="flex gap-2">
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="e.g. Jane Doe, or github.com/janedoe"
              className="h-10 rounded-full px-5 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25"
            />
            <Select value={channel} onValueChange={(v) => setChannel(v ?? "all")}>
              <SelectTrigger className="w-40 h-10 rounded-full border-border/80 bg-white text-xs px-4">
                <SelectValue placeholder="All sources">
                  {(value: string) =>
                    SEARCH_CHANNELS.find((c) => c.value === value)?.label ?? "All sources"
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent className="rounded-xl border border-border bg-[#fffdfd]">
                {SEARCH_CHANNELS.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-xs rounded-lg">
                    {c.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button type="submit" disabled={searching || !query.trim()} className="h-10 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-md hover:scale-[1.01]">
              {searching ? "Searching…" : "Search"}
            </Button>
          </form>
          <div className="border-t border-border/50 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleDiscover}
              disabled={discovering}
              className="h-9 rounded-full px-5 text-xs font-semibold hover:bg-secondary/40 transition-all"
            >
              {discovering
                ? query.trim()
                  ? "Looking up on GitHub…"
                  : "Scanning GitHub…"
                : "Discover on GitHub"}
            </Button>
            <p className="mt-2 text-xs text-muted-foreground/75 leading-relaxed">
              {query.trim()
                ? `Looks up "${query.trim()}" directly on GitHub.`
                : "With the search box empty, scans for founders matching your investment thesis, scored the same way as an inbound search."}
            </p>
          </div>
        </CardContent>
      </Card>

      {error && (
        <p className="text-xs font-semibold text-destructive px-2" role="alert">
          {error}
        </p>
      )}

      {candidates.length > 0 && (
        <Card className="rounded-[2rem] border border-border/80 bg-[#fffdfd] shadow-sm">
          <CardHeader>
            <CardTitle className="text-base font-bold font-elsie">Candidates</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {candidates.map((c) => (
              <div
                key={c.url}
                className="flex items-start justify-between gap-4 rounded-[1.25rem] border border-border/80 bg-[#faf5f3]/40 p-4 transition-all hover:scale-[1.01]"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <a
                      href={c.url}
                      target="_blank"
                      rel="noreferrer"
                      className="text-sm font-bold text-foreground hover:underline font-elsie"
                    >
                      {c.title}
                    </a>
                    <Badge variant="secondary" className="rounded-full text-[10px] py-0.5 px-2 bg-primary/10 text-primary border-none">{c.origin}</Badge>
                  </div>
                  {c.snippet && (
                    <p className="mt-2 line-clamp-2 text-xs text-muted-foreground leading-relaxed">
                      {c.snippet}
                    </p>
                  )}
                </div>
                <Button
                  size="sm"
                  onClick={() => handleTrack(c)}
                  disabled={trackingUrl === c.url}
                  className="rounded-full h-8 text-xs font-semibold px-4 bg-primary text-primary-foreground shadow-sm hover:scale-[1.01]"
                >
                  {trackingUrl === c.url ? "Tracking…" : "Track"}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Card className="rounded-[2rem] border border-border/80 bg-[#fffdfd] shadow-sm">
        <CardHeader>
          <CardTitle className="text-base font-bold font-elsie">Pipeline ({tracked.length})</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Founders tracked so far, inbound and outbound together.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {tracked.length === 0 && (
            <p className="text-xs text-muted-foreground italic font-medium">
              Nothing tracked yet — search or discover a founder above.
            </p>
          )}
          {tracked.map((f) => (
            <div key={f.id} className="rounded-[1.25rem] border border-border bg-[#faf5f3]/40 p-4 transition-all hover:scale-[1.01]">
              <div className="flex items-center justify-between">
                <div>
                  <Link href={`/founders/${f.id}`} className="text-sm font-bold text-foreground hover:underline font-elsie">
                    {f.name}
                  </Link>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {f.source} · {f.source_channel ?? "—"} · <span className="font-semibold text-primary">{f.status}</span>
                  </p>
                </div>
                {f.is_cold_start && <Badge variant="outline" className="rounded-full text-[10px] px-2 py-0.5 border-primary/30 text-primary bg-primary/5">cold-start</Badge>}
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
