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
import { emptyThesis, type InvestmentThesis } from "@/lib/thesis/types";

function toList(value: string): string[] {
  return value
    .split(",")
    .map((v) => v.trim())
    .filter(Boolean);
}

function toNumberOrNull(value: string): number | null {
  if (value.trim() === "") return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export function ThesisForm() {
  const [thesis, setThesis] = useState<InvestmentThesis>(emptyThesis);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/thesis")
      .then((res) => res.json())
      .then((data) => {
        if (data.thesis) setThesis(data.thesis);
      })
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);

    const res = await fetch("/api/thesis", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(thesis),
    });

    if (!res.ok) {
      const data = await res.json();
      setError(data.error ?? "Couldn't save your thesis. Try again.");
      setSaving(false);
      return;
    }

    setSavedAt(new Date());
    setSaving(false);
  }

  if (loading) {
    return <p className="text-sm text-muted-foreground">Loading your thesis…</p>;
  }
  return (
    <Card className="w-full max-w-2xl rounded-[2.25rem] border border-border/80 bg-[#fffdfd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_12px_35px_rgba(156,90,60,0.03)]">
      <CardHeader className="pb-4 border-b border-border/40">
        <CardTitle className="text-base font-bold font-elsie">Investment thesis</CardTitle>
        <CardDescription className="text-xs text-muted-foreground mt-0.5">
          Every recommendation gets filtered and scored through this lens. You can
          change it any time.
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          <Field label="Sectors" hint="Comma-separated, e.g. AI infra, fintech">
            <Input
              value={thesis.sectors.join(", ")}
              onChange={(e) =>
                setThesis({ ...thesis, sectors: toList(e.target.value) })
              }
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5"
            />
          </Field>

          <Field label="Stage" hint="Comma-separated, e.g. pre-seed, seed">
            <Input
              value={thesis.stage.join(", ")}
              onChange={(e) =>
                setThesis({ ...thesis, stage: toList(e.target.value) })
              }
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5"
            />
          </Field>

          <Field label="Geography" hint="Comma-separated, e.g. Berlin, Remote">
            <Input
              value={thesis.geography.join(", ")}
              onChange={(e) =>
                setThesis({ ...thesis, geography: toList(e.target.value) })
              }
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5"
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Check size, min (USD)">
              <Input
                type="number"
                value={thesis.check_size_min ?? ""}
                onChange={(e) =>
                  setThesis({
                    ...thesis,
                    check_size_min: toNumberOrNull(e.target.value),
                  })
                }
                className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5"
              />
            </Field>
            <Field label="Check size, max (USD)">
              <Input
                type="number"
                value={thesis.check_size_max ?? ""}
                onChange={(e) =>
                  setThesis({
                    ...thesis,
                    check_size_max: toNumberOrNull(e.target.value),
                  })
                }
                className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5"
              />
            </Field>
          </div>

          <Field label="Ownership target (%)">
            <Input
              type="number"
              value={thesis.ownership_target ?? ""}
              onChange={(e) =>
                setThesis({
                  ...thesis,
                  ownership_target: toNumberOrNull(e.target.value),
                })
              }
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5"
            />
          </Field>

          <Field label="Risk appetite">
            <Input
              value={thesis.risk_appetite ?? ""}
              onChange={(e) =>
                setThesis({ ...thesis, risk_appetite: e.target.value || null })
              }
              placeholder="e.g. high — early, unproven ideas welcome"
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5 text-xs"
            />
          </Field>

          <Field label="Preferred founder type">
            <Input
              value={thesis.preferred_founder_type ?? ""}
              onChange={(e) =>
                setThesis({
                  ...thesis,
                  preferred_founder_type: e.target.value || null,
                })
              }
              placeholder="e.g. technical co-founder, second-time founder"
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5 text-xs"
            />
          </Field>

          <Field label="Minimum traction">
            <Input
              value={thesis.minimum_traction ?? ""}
              onChange={(e) =>
                setThesis({
                  ...thesis,
                  minimum_traction: e.target.value || null,
                })
              }
              placeholder="e.g. none required — pre-revenue is fine"
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5 text-xs"
            />
          </Field>

          <Field
            label="Excluded industries"
            hint="Comma-separated, e.g. gambling, weapons"
          >
            <Input
              value={thesis.excluded_industries.join(", ")}
              onChange={(e) =>
                setThesis({
                  ...thesis,
                  excluded_industries: toList(e.target.value),
                })
              }
              className="h-10 rounded-xl px-4 border-border/80 bg-white shadow-sm focus-visible:ring-primary/25 mt-1.5"
            />
          </Field>

          {error && (
            <p className="text-xs font-semibold text-destructive px-1" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3 pt-2">
            <Button type="submit" disabled={saving} className="h-10 rounded-full bg-primary px-6 font-semibold text-primary-foreground shadow-md hover:scale-[1.01] transition-all">
              {saving ? "Saving…" : "Save thesis"}
            </Button>
            {savedAt && !saving && (
              <span className="text-xs font-semibold text-primary bg-primary/10 px-3 py-1.5 rounded-full">Saved successfully.</span>
            )}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">{label}</label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground/80 font-medium">{hint}</p>}
    </div>
  );
}
