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
    <Card className="rounded-[2rem] border border-border/80 bg-[#fffdfd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_12px_30px_rgba(156,90,60,0.03)]">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <CardTitle className="text-base font-bold font-elsie">Outreach draft</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Grounded in this founder&apos;s collected signals — edit before
            sending yourself.
          </CardDescription>
        </div>
        <Button size="sm" onClick={handleDraft} disabled={loading} className="rounded-full bg-primary hover:scale-[1.01] transition-all text-xs font-semibold px-4">
          {loading ? "Drafting…" : subject ? "Redraft" : "Draft outreach"}
        </Button>
      </CardHeader>
      {(error || subject || body) && (
        <CardContent className="space-y-4 pt-5">
          {error && (
            <p className="text-xs font-semibold text-destructive px-1" role="alert">
              {error}
            </p>
          )}
          {(subject || body) && (
            <>
              <Input
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                placeholder="Subject"
                className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 text-xs font-semibold"
              />
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={6}
                className="w-full rounded-2xl border border-border bg-white px-4 py-3 text-xs outline-none focus-visible:border-primary/80 focus-visible:ring-3 focus-visible:ring-primary/20 shadow-sm leading-relaxed"
              />
              <Button size="sm" variant="outline" onClick={handleCopy} className="rounded-full text-xs font-semibold px-5 border-border hover:bg-secondary/40">
                {copied ? "Copied to clipboard!" : "Copy outreach"}
              </Button>
            </>
          )}
        </CardContent>
      )}
    </Card>
  );
}
