"use client";

import { useState } from "react";
import { Input } from "@/app/components/ui/input";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { createClient } from "@/lib/supabase/client";

// Brief Section 2 item 4: "Apply: deck + company name is the minimum bar."
// No PDF-parsing dependency exists in this project (frontend or backend), so
// the deck's own text is pasted/summarized here rather than auto-extracted —
// the uploaded file is still stored and linked as the source of record, and
// the pasted text is what the backend's deck-intake step actually reasons
// over (see backend/app/services/deck_intake.py).
export function DeckApplication({ onTracked }: { onTracked?: () => void }) {
  const [founderName, setFounderName] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [deckText, setDeckText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const canSubmit = founderName.trim() && companyName.trim() && !submitting;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!canSubmit) return;

    setSubmitting(true);
    setError(null);
    setSuccess(false);

    let deckStoragePath: string | null = null;

    if (file) {
      const supabase = createClient();
      const path = `${Date.now()}-${file.name}`;
      const { error: uploadError } = await supabase.storage
        .from("decks")
        .upload(path, file);

      if (uploadError) {
        setError(`Deck upload failed: ${uploadError.message}`);
        setSubmitting(false);
        return;
      }
      deckStoragePath = path;
    }

    const res = await fetch("/api/founders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: founderName,
        company_name: companyName,
        source: "inbound",
        source_channel: "application",
        ...(deckStoragePath ? { deck_storage_path: deckStoragePath } : {}),
        ...(deckText.trim() ? { deck_text: deckText.trim() } : {}),
      }),
    });
    const data = await res.json();

    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Couldn't submit this application.");
      setSubmitting(false);
      return;
    }

    setFounderName("");
    setCompanyName("");
    setDeckText("");
    setFile(null);
    setSuccess(true);
    setSubmitting(false);
    onTracked?.();
  }

  return (
    <Card className="rounded-[2rem] border border-border/80 bg-[#fffdfd] shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold font-elsie">Submit an application</CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Deck + company name is the minimum bar — everything else is optional.
          Paste in an application you received; it enters the same screening
          pipeline as outbound-sourced founders.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <Input
              value={founderName}
              onChange={(e) => setFounderName(e.target.value)}
              placeholder="Founder name"
              required
              className="h-10 rounded-full px-5 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25"
            />
            <Input
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Company name"
              required
              className="h-10 rounded-full px-5 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25"
            />
          </div>
          <Textarea
            value={deckText}
            onChange={(e) => setDeckText(e.target.value)}
            placeholder="Paste the deck's key points (problem, product, traction) — this is what the committee actually reasons over."
            rows={4}
            className="rounded-2xl border-border/80 bg-white shadow-sm focus-visible:ring-primary/25"
          />
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex h-10 cursor-pointer items-center rounded-full border border-border/80 bg-white px-5 text-xs font-semibold shadow-sm hover:bg-secondary/40">
              {file ? file.name : "Attach deck (PDF, optional)"}
              <input
                type="file"
                accept="application/pdf"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <Button
              type="submit"
              disabled={!canSubmit}
              className="h-10 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-md hover:scale-[1.01]"
            >
              {submitting ? "Submitting…" : "Submit application"}
            </Button>
          </div>
          {error && (
            <p className="text-xs font-semibold text-destructive" role="alert">
              {error}
            </p>
          )}
          {success && (
            <p className="text-xs font-semibold text-primary" role="status">
              Application tracked — screening will run automatically.
            </p>
          )}
        </form>
      </CardContent>
    </Card>
  );
}
