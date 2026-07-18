"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import type {
  CommitteeAgentId,
  CommitteeAgentOutput,
  CommitteeLog,
  CommitteeRun,
} from "@/lib/founders/types";
import { VerdictRule } from "@/components/ui/verdict-rule";

const ACTIVE_STATUSES = new Set(["queued", "running"]);
const POLL_MS = 2000;

const AGENT_LABELS: Record<string, string> = {
  technical: "Technical Partner",
  founder: "Founder Partner",
  market: "Market Partner",
  risk: "Risk Partner",
  devils_advocate: "Devil's Advocate",
  managing_partner: "Managing Partner",
};

const AGENT_ORDER: CommitteeAgentId[] = ["technical", "founder", "market", "risk", "devils_advocate"];

function RunCommitteeButton({
  founderId,
  onStarted,
}: {
  founderId: string;
  onStarted: () => void;
}) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setLoading(true);
    setError(null);
    const res = await fetch(`/api/founders/${founderId}/committee`, { method: "POST" });
    const data = await res.json();
    if (!res.ok) {
      setError(data.detail ?? data.error ?? "Couldn't start the committee.");
    } else {
      onStarted();
    }
    setLoading(false);
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <Button size="sm" onClick={handleClick} disabled={loading}>
        {loading ? "Starting…" : "Run Investment Committee"}
      </Button>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}

export function CommitteePanel({ founderId }: { founderId: string }) {
  const [run, setRun] = useState<CommitteeRun | null>(null);
  const [logs, setLogs] = useState<CommitteeLog[]>([]);
  const [outputs, setOutputs] = useState<CommitteeAgentOutput[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const supabase = createClient();
    let cancelled = false;
    let timer: ReturnType<typeof setTimeout>;

    async function poll() {
      const { data: runRow } = await supabase
        .from("committee_runs")
        .select("*")
        .eq("founder_id", founderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (cancelled) return;
      setRun(runRow ?? null);

      if (runRow) {
        const [{ data: logRows }, { data: outputRows }] = await Promise.all([
          supabase
            .from("committee_logs")
            .select("*")
            .eq("committee_run_id", runRow.id)
            .order("created_at", { ascending: true }),
          supabase
            .from("committee_agent_outputs")
            .select("*")
            .eq("committee_run_id", runRow.id)
            .order("created_at", { ascending: true }),
        ]);

        if (cancelled) return;
        setLogs(logRows ?? []);
        setOutputs(outputRows ?? []);
      }

      if (runRow && ACTIVE_STATUSES.has(runRow.status)) {
        timer = setTimeout(poll, POLL_MS);
      }
    }

    poll();

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [founderId, refreshKey]);

  const outputsByAgent = new Map(outputs.map((o) => [o.agent, o]));
  const managingPartner = outputsByAgent.get("managing_partner");

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="text-base">Investment Committee</CardTitle>
          <CardDescription>
            Four independent partners, a Devil&apos;s Advocate challenge, then a
            Managing Partner recommendation — nothing averaged.
          </CardDescription>
        </div>
        <RunCommitteeButton founderId={founderId} onStarted={() => setRefreshKey((k) => k + 1)} />
      </CardHeader>
      <CardContent className="space-y-4">
        {run && (
          <div className="flex items-center gap-2">
            <Badge
              variant={
                run.status === "completed"
                  ? "secondary"
                  : run.status === "failed"
                    ? "destructive"
                    : "outline"
              }
            >
              committee: {run.status}
            </Badge>
            {run.error && <span className="text-xs text-destructive">{run.error}</span>}
          </div>
        )}

        {run && ACTIVE_STATUSES.has(run.status) && logs.length > 0 && (
          <ul className="space-y-0.5 text-xs text-muted-foreground">
            {logs.map((l) => (
              <li key={l.id}>
                {l.step}: {l.message}
              </li>
            ))}
          </ul>
        )}

        {managingPartner && (
          <div className="rounded-lg border border-foreground/20 bg-muted/40 p-4">
            <VerdictRule
              label="Managing Partner"
              value={(managingPartner.output.recommendation ?? "unknown").replace("_", " ").toUpperCase()}
              suffix={
                managingPartner.confidence != null
                  ? `${Math.round(managingPartner.confidence * 100)}% conf.`
                  : undefined
              }
              tone={
                managingPartner.output.recommendation === "invest"
                  ? "positive"
                  : managingPartner.output.recommendation === "pass"
                    ? "negative"
                    : "neutral"
              }
            />
            <p className="mt-3 text-sm">{managingPartner.output.reasoning}</p>
            {!!managingPartner.output.key_strengths?.length && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground">Key strengths</p>
                <ul className="list-disc pl-4 text-xs text-muted-foreground">
                  {managingPartner.output.key_strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            {!!managingPartner.output.key_risks?.length && (
              <div className="mt-2">
                <p className="text-xs font-medium text-muted-foreground">Key risks</p>
                <ul className="list-disc pl-4 text-xs text-muted-foreground">
                  {managingPartner.output.key_risks.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {AGENT_ORDER.filter((a) => outputsByAgent.has(a)).map((agentId) => {
          const o = outputsByAgent.get(agentId)!;
          return (
            <div key={agentId} className="rounded-lg border p-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-sm font-medium">{AGENT_LABELS[agentId] ?? agentId}</p>
                {o.confidence != null && (
                  <Badge variant="outline">{Math.round(o.confidence * 100)}% confidence</Badge>
                )}
              </div>
              <p className="mt-1 text-xs text-muted-foreground">{o.summary}</p>
              {!!o.output.strengths?.length && (
                <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                  {o.output.strengths.map((s, i) => (
                    <li key={`s-${i}`}>+ {s}</li>
                  ))}
                </ul>
              )}
              {!!o.output.concerns?.length && (
                <ul className="mt-1 list-disc pl-4 text-xs text-muted-foreground">
                  {o.output.concerns.map((s, i) => (
                    <li key={`c-${i}`}>- {s}</li>
                  ))}
                </ul>
              )}
            </div>
          );
        })}

        {!run && (
          <p className="text-sm text-muted-foreground">
            No committee run yet — click &quot;Run Investment Committee&quot; above.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
