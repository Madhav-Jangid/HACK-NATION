"use client";

import { useState } from "react";
import Link from "next/link";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

type Result = {
  founder_id: string;
  name: string;
  company_name: string | null;
  relevance: number;
  reason: string;
};

/**
 * Phase 14: resolves a compound natural-language query against founders
 * already in the pipeline — distinct from the Tavily-backed inbound search on
 * `/founders`, which searches the open web instead.
 */
export function NlSearch() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<Result[] | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await fetch("/api/founders/nl-search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Search failed.");
      setLoading(false);
      return;
    }

    setResults(data as Result[]);
    setLoading(false);
  }

  return (
    <Card className="rounded-[2rem] border border-border/80 bg-[#fffdfd] shadow-sm transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
      <CardHeader>
        <CardTitle className="text-base font-bold font-elsie">Ask your pipeline</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Compound queries in one pass — e.g. &quot;technical founder, Berlin, AI
          infra, no prior VC funding.&quot; Searches founders already tracked, not
          the open web.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-5">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe who you're looking for..."
            className="h-10 rounded-full px-5 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25"
          />
          <Button type="submit" disabled={loading || !query.trim()} className="h-10 rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-md hover:scale-[1.01]">
            {loading ? "Searching…" : "Search"}
          </Button>
        </form>

        {error && (
          <p className="text-xs font-semibold text-destructive" role="alert">
            {error}
          </p>
        )}

        {results && results.length === 0 && (
          <p className="text-xs text-muted-foreground italic font-medium">
            No matches found in your pipeline.
          </p>
        )}

        {results && results.length > 0 && (
          <ul className="space-y-3">
            {results.map((r) => (
              <li key={r.founder_id} className="rounded-[1.25rem] border border-border bg-[#faf5f3]/40 p-4 transition-all duration-200 hover:scale-[1.01]">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/founders/${r.founder_id}`}
                    className="text-sm font-bold text-foreground hover:underline font-elsie"
                  >
                    {r.name}
                    {r.company_name && (
                      <span className="text-muted-foreground font-sans font-normal text-xs"> · {r.company_name}</span>
                    )}
                  </Link>
                  <span className="font-semibold text-xs text-primary bg-primary/10 px-2.5 py-1 rounded-full">
                    {Math.round(r.relevance * 100)}% match
                  </span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{r.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
