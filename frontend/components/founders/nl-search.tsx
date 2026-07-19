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
    <Card>
      <CardHeader>
        <CardTitle>Ask your pipeline</CardTitle>
        <CardDescription>
          Compound queries in one pass — e.g. &quot;technical founder, Berlin, AI
          infra, no prior VC funding.&quot; Searches founders already tracked, not
          the open web.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Describe who you're looking for"
          />
          <Button type="submit" disabled={loading || !query.trim()}>
            {loading ? "Searching…" : "Search"}
          </Button>
        </form>

        {error && (
          <p className="text-sm text-destructive" role="alert">
            {error}
          </p>
        )}

        {results && results.length === 0 && (
          <p className="text-sm text-muted-foreground">
            No matches in your pipeline yet.
          </p>
        )}

        {results && results.length > 0 && (
          <ul className="space-y-3">
            {results.map((r) => (
              <li key={r.founder_id} className="rounded-lg border p-3">
                <div className="flex items-center justify-between gap-2">
                  <Link
                    href={`/founders/${r.founder_id}`}
                    className="text-sm font-medium hover:underline"
                  >
                    {r.name}
                    {r.company_name && (
                      <span className="text-muted-foreground"> · {r.company_name}</span>
                    )}
                  </Link>
                  <span className="font-data text-xs text-muted-foreground">
                    {Math.round(r.relevance * 100)}% match
                  </span>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">{r.reason}</p>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
