"use client";

import { useState } from "react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";

/**
 * Phase 13: drafts a cold-outreach message via the AI backend. Copy-to-
 * clipboard only, deliberately — the schema never collects a founder's email
 * address (only profile URLs), so there's nowhere to actually send from here;
 * the investor sends it themselves through whatever channel they have.
 */
export function OutreachDraft({ founderId }: { founderId: string }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  async function handleDraft() {
    setLoading(true);
    setError(null);
    setCopied(false);

    const res = await fetch(`/api/founders/${founderId}/outreach`, { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Couldn't draft an outreach message.");
      setLoading(false);
      return;
    }

    setSubject(data.subject ?? "");
    setBody(data.body ?? "");
    setLoading(false);
  }

  async function handleCopy() {
    await navigator.clipboard.writeText(`Subject: ${subject}\n\n${body}`);
    setCopied(true);
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Outreach draft</CardTitle>
          <CardDescription>
            Grounded in this founder&apos;s collected signals — edit before
            sending yourself.
          </CardDescription>
        </div>
        <Button size="sm" variant="outline" onClick={handleDraft} disabled={loading}>
          {loading ? "Drafting…" : subject ? "Redraft" : "Draft outreach"}
        </Button>
      </CardHeader>
      {(error || subject || body) && (
        <CardContent className="space-y-3">
          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}
          {(subject || body) && (
            <>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full rounded-md border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button size="sm" variant="outline" onClick={handleCopy}>
                {copied ? "Copied" : "Copy to clipboard"}
              </Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
