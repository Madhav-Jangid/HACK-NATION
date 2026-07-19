"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { AnimatedCard } from "@/components/dashboard/dashboard-charts";

type SchedulerStatus = { enabled: boolean; interval_minutes: number };

type RunResult = {
  theses_scanned: number;
  candidates_found: number;
  founders_tracked: number;
  skipped?: string;
};

const CHANNEL_LABELS = ["GitHub", "Product Hunt", "Hacker News"];

// Outbound sourcing (brief: "continuously scan GitHub, launches, hackathons
// ... scored the same way as an inbound application") already runs on its own
// via an in-process scheduler (backend/app/services/scheduler.py) -- this
// panel makes that visible and controllable from the dashboard: it shows the
// scheduler's real interval (not a claim), the thesis it's scanning against,
// and lets an investor force an immediate pass instead of waiting for the
// next tick.
export function AutoSourcingPanel({
  sectors,
  stage,
  geography,
  hasThesis,
}: {
  sectors: string[];
  stage: string[];
  geography: string[];
  hasThesis: boolean;
}) {
  const router = useRouter();
  const [status, setStatus] = useState<SchedulerStatus | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState<RunResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/sourcing/status")
      .then((res) => res.json())
      .then((data) => {
        if (data?.outbound_sourcing_scheduler) setStatus(data.outbound_sourcing_scheduler);
      })
      .catch(() => {});
  }, []);

  async function handleRunNow() {
    setRunning(true);
    setError(null);
    setResult(null);

    const res = await fetch("/api/sourcing/run", { method: "POST" });
    const data = await res.json();

    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Sourcing pass failed.");
      setRunning(false);
      return;
    }

    setResult(data);
    setRunning(false);
    if ((data.founders_tracked ?? 0) > 0) router.refresh();
  }

  return (
    <AnimatedCard delay={0} className="p-6 col-span-1 sm:col-span-2 lg:col-span-3">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="max-w-lg">
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold font-elsie text-foreground">Automatic founder search</h3>
            {status && (
              <Badge
                variant={status.enabled ? "secondary" : "outline"}
                className="rounded-full text-[9px] px-2 py-0.5"
              >
                {status.enabled ? `running every ${status.interval_minutes} min` : "scheduler disabled"}
              </Badge>
            )}
          </div>
          <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">
            Continuously scans {CHANNEL_LABELS.join(", ")} for founders matching your
            investment thesis, scores them the same way as an inbound application, and
            queues research automatically — no manual lookup required.
          </p>
          <p className="mt-2 text-[11px] font-semibold text-foreground/80">
            {hasThesis ? (
              <>
                Scanning for:{" "}
                <span className="text-primary">{sectors.length ? sectors.join(", ") : "any sector"}</span>
                {" · "}
                <span className="text-primary">{stage.length ? stage.join(", ") : "any stage"}</span>
                {" · "}
                <span className="text-primary">{geography.length ? geography.join(", ") : "anywhere"}</span>
              </>
            ) : (
              <span className="text-destructive">
                No investment thesis configured yet — set one to bias what this scans for.
              </span>
            )}
          </p>
        </div>
        <div className="flex flex-col items-start sm:items-end gap-1.5 shrink-0">
          <Button
            size="sm"
            onClick={handleRunNow}
            disabled={running || !hasThesis}
            className="rounded-full bg-primary px-5 font-semibold text-primary-foreground shadow-sm hover:scale-[1.01] transition-all"
          >
            {running ? "Scanning…" : "Run sourcing pass now"}
          </Button>
          {!hasThesis && (
            <span className="text-[10px] font-medium text-muted-foreground">Requires a saved thesis.</span>
          )}
          {error && <span className="text-[10px] font-semibold text-destructive">{error}</span>}
        </div>
      </div>

      {result && (
        <div className="mt-4 flex flex-wrap gap-4 border-t border-border/40 pt-4">
          {result.skipped ? (
            <p className="text-xs font-semibold text-muted-foreground">{result.skipped}</p>
          ) : (
            <>
              <Stat label="Theses scanned" value={result.theses_scanned} />
              <Stat label="Candidates found" value={result.candidates_found} />
              <Stat label="New founders tracked" value={result.founders_tracked} />
            </>
          )}
        </div>
      )}
    </AnimatedCard>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="flex flex-col">
      <span className="text-xl font-black text-primary font-elsie">{value}</span>
      <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">{label}</span>
    </div>
  );
}
