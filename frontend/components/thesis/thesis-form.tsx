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
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Investment thesis</CardTitle>
        <CardDescription>
          Every recommendation gets filtered and scored through this lens. You can
          change it any time.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-5">
          <Field label="Sectors" hint="Comma-separated, e.g. AI infra, fintech">
            <Input
              value={thesis.sectors.join(", ")}
              onChange={(e) =>
                setThesis({ ...thesis, sectors: toList(e.target.value) })
              }
            />
          </Field>

          <Field label="Stage" hint="Comma-separated, e.g. pre-seed, seed">
            <Input
              value={thesis.stage.join(", ")}
              onChange={(e) =>
                setThesis({ ...thesis, stage: toList(e.target.value) })
              }
            />
          </Field>

          <Field label="Geography" hint="Comma-separated, e.g. Berlin, Remote">
            <Input
              value={thesis.geography.join(", ")}
              onChange={(e) =>
                setThesis({ ...thesis, geography: toList(e.target.value) })
              }
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
            />
          </Field>

          <Field label="Risk appetite">
            <Input
              value={thesis.risk_appetite ?? ""}
              onChange={(e) =>
                setThesis({ ...thesis, risk_appetite: e.target.value || null })
              }
              placeholder="e.g. high — early, unproven ideas welcome"
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
            />
          </Field>

          {error && (
            <p className="text-sm text-destructive" role="alert">
              {error}
            </p>
          )}

          <div className="flex items-center gap-3">
            <Button type="submit" disabled={saving}>
              {saving ? "Saving…" : "Save thesis"}
            </Button>
            {savedAt && !saving && (
              <span className="text-sm text-muted-foreground">Saved.</span>
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
    <div>
      <label className="text-sm font-medium">{label}</label>
      {children}
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
