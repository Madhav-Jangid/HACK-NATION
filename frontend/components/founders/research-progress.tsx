"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/app/components/ui/badge";
import type { ResearchJob, ResearchLog } from "@/lib/founders/types";

const ACTIVE_STATUSES = new Set(["queued", "running"]);
const POLL_MS = 2000;

export function ResearchProgress({ founderId }: { founderId: string }) {
  const [job, setJob] = useState<ResearchJob | null>(null);
  const [logs, setLogs] = useState<ResearchLog[]>([]);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const { data: jobRow } = await supabase
        .from("research_jobs")
        .select("*")
        .eq("founder_id", founderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      setJob(jobRow ?? null);

      if (jobRow) {
        const { data: logRows } = await supabase
          .from("research_logs")
          .select("*")
          .eq("research_job_id", jobRow.id)
          .order("created_at", { ascending: true });

        if (cancelled) return;
        setLogs(logRows ?? []);
      }

      if (jobRow && ACTIVE_STATUSES.has(jobRow.status)) {
        timer = setTimeout(poll, POLL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [founderId]);

  if (!job) return null;

  return (
    <div className="mt-2 space-y-1 rounded-md bg-muted/40 p-2">
      <div className="flex items-center gap-2">
        <Badge
          variant={
            job.status === "completed"
              ? "secondary"
              : job.status === "failed"
                ? "destructive"
                : "outline"
          }
        >
          research: {job.status}
        </Badge>
        {job.error && (
          <span className="text-xs text-destructive">{job.error}</span>
        )}
      </div>
      {logs.length > 0 && (
        <ul className="space-y-0.5 text-xs text-muted-foreground">
          {logs.map((l) => (
            <li key={l.id}>
              {l.step}: {l.message}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
