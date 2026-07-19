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

import { cn } from "@/lib/utils";
import { Cpu, User, BarChart3, ShieldAlert, Flame, Terminal } from "lucide-react";

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

const AGENT_ICONS: Record<string, any> = {
  technical: Cpu,
  founder: User,
  market: BarChart3,
  risk: ShieldAlert,
  devils_advocate: Flame,
};

const AGENT_COLORS: Record<string, string> = {
  technical: "bg-indigo-50/60 border-indigo-100/80 text-indigo-700 shadow-[0_2px_8px_rgba(99,102,241,0.04)]",
  founder: "bg-amber-50/60 border-amber-100/80 text-amber-700 shadow-[0_2px_8px_rgba(245,158,11,0.04)]",
  market: "bg-emerald-50/60 border-emerald-100/80 text-emerald-700 shadow-[0_2px_8px_rgba(16,185,129,0.04)]",
  risk: "bg-rose-50/60 border-rose-100/80 text-rose-700 shadow-[0_2px_8px_rgba(244,63,94,0.04)]",
  devils_advocate: "bg-orange-50/60 border-orange-100/80 text-orange-700 shadow-[0_2px_8px_rgba(249,115,22,0.04)]",
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
    <div className="flex flex-col items-end gap-1 shrink-0">
      <Button size="sm" onClick={handleClick} disabled={loading} className="rounded-full bg-primary hover:scale-[1.01] transition-all text-xs font-semibold px-4">
        {loading ? "Starting…" : "Run Committee"}
      </Button>
      {error && <span className="text-[10px] font-semibold text-destructive">{error}</span>}
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
    <Card className="rounded-lg border border-border/80 bg-[#fffdfd] shadow-sm overflow-hidden transition-all duration-300 hover:shadow-[0_12px_35px_rgba(156,90,60,0.03)]">
      <CardHeader className="flex flex-row items-center justify-between gap-4 pb-4 border-b border-border/40">
        <div>
          <CardTitle className="text-base font-bold font-elsie">Investment Committee debate</CardTitle>
          <CardDescription className="text-xs text-muted-foreground mt-0.5">
            Four independent partners, a Devil&apos;s Advocate challenge, then a
            Managing Partner recommendation — nothing averaged.
          </CardDescription>
        </div>
        <RunCommitteeButton founderId={founderId} onStarted={() => setRefreshKey((k) => k + 1)} />
      </CardHeader>
      <CardContent className="space-y-6 pt-6">
        {run && (
          <div className="flex items-center gap-2">
            <span className="inline-flex h-2 w-2 rounded-full bg-primary animate-pulse" />
            <Badge
              variant={
                run.status === "completed"
                  ? "secondary"
                  : run.status === "failed"
                    ? "destructive"
                    : "outline"
              }
              className="rounded-full text-[10px] px-2 py-0.5"
            >
              committee: {run.status}
            </Badge>
            {run.error && <span className="text-xs text-destructive font-semibold">{run.error}</span>}
          </div>
        )}

        {run && ACTIVE_STATUSES.has(run.status) && logs.length > 0 && (
          <div className="rounded-lg bg-[#281c1b] border border-border text-[#faece9] p-4 shadow-inner">
            <div className="flex items-center gap-2 border-b border-border/20 pb-2 mb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
              <Terminal className="h-3.5 w-3.5 text-primary" />
              Live reasoning trace
            </div>
            <ul className="space-y-1 text-[11px] font-mono leading-relaxed opacity-90 max-h-40 overflow-y-auto">
              {logs.map((l) => (
                <li key={l.id} className="flex gap-2">
                  <span className="text-primary/70 shrink-0 select-none">&gt;</span>
                  <span>{l.message}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {managingPartner && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-5 relative overflow-hidden">
            <div className="absolute right-4 top-4 opacity-5 pointer-events-none">
              <span className="font-elsie text-8xl font-black">MP</span>
            </div>
            <VerdictRule
              label="Managing Partner Synthesis"
              value={(managingPartner.output.recommendation ?? "unknown").replace("_", " ").toUpperCase()}
              suffix={
                managingPartner.confidence != null
                  ? `${Math.round(managingPartner.confidence * 100)}% confidence`
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
            <p className="mt-4 text-xs font-medium text-foreground/80 leading-relaxed border-t border-border/30 pt-3">{managingPartner.output.reasoning}</p>
            {!!managingPartner.output.key_strengths?.length && (
              <div className="mt-3.5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Key strengths</p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground font-medium pl-1">
                  {managingPartner.output.key_strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-emerald-600 font-bold shrink-0">+</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {!!managingPartner.output.key_risks?.length && (
              <div className="mt-3.5">
                <p className="text-[10px] font-bold text-primary uppercase tracking-wider">Key risks</p>
                <ul className="mt-1.5 space-y-1 text-xs text-muted-foreground font-medium pl-1">
                  {managingPartner.output.key_risks.map((s, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="text-rose-600 font-bold shrink-0">-</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="space-y-4">
          {AGENT_ORDER.filter((a) => outputsByAgent.has(a)).map((agentId) => {
            const o = outputsByAgent.get(agentId)!;
            const IconComponent = AGENT_ICONS[agentId] || User;
            const cardColorClasses = AGENT_COLORS[agentId] || "bg-[#fffdfd] border-border/80 text-foreground";
            return (
              <div key={agentId} className={cn("rounded-lg border p-4 transition-all duration-200 hover:scale-[1.01]", cardColorClasses)}>
                <div className="flex items-center justify-between gap-2 border-b border-current/10 pb-2 mb-2">
                  <div className="flex items-center gap-2">
                    <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-current/10 text-current">
                      <IconComponent className="h-3.5 w-3.5 shrink-0" />
                    </div>
                    <p className="text-xs font-extrabold font-elsie tracking-tight uppercase tracking-wider">{AGENT_LABELS[agentId] ?? agentId}</p>
                  </div>
                  {o.confidence != null && (
                    <Badge variant="outline" className="rounded-full text-[9px] font-bold border-current/25 text-current bg-current/5 py-0.5 px-2">{Math.round(o.confidence * 100)}% confidence</Badge>
                  )}
                </div>
                <p className="text-xs font-semibold text-foreground/80 leading-relaxed mb-3">{o.summary}</p>
                {!!o.output.strengths?.length && (
                  <div className="mt-1.5">
                    <p className="text-[9px] font-extrabold uppercase tracking-wide opacity-80">Strengths</p>
                    <ul className="mt-1 space-y-1 text-[11px] font-semibold text-muted-foreground/90 pl-1.5">
                      {o.output.strengths.map((s, i) => (
                        <li key={`s-${i}`} className="flex items-start gap-1">
                          <span className="text-emerald-700 shrink-0 font-bold">+</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {!!o.output.concerns?.length && (
                  <div className="mt-2.5">
                    <p className="text-[9px] font-extrabold uppercase tracking-wide opacity-80">Concerns</p>
                    <ul className="mt-1 space-y-1 text-[11px] font-semibold text-muted-foreground/90 pl-1.5">
                      {o.output.concerns.map((s, i) => (
                        <li key={`c-${i}`} className="flex items-start gap-1">
                          <span className="text-rose-700 shrink-0 font-bold">-</span>
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!run && (
          <p className="text-xs text-muted-foreground italic font-medium text-center py-4">
            No committee run recorded yet — click &quot;Run Committee&quot; above to initiate debate.
          </p>
        )}
      </CardContent>
    </Card>
  );
}
