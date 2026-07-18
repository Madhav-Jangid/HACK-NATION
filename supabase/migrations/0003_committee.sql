-- VC Brain — Phase 8 (Autonomous Investment Committee) tables.
-- Run once in the Supabase Dashboard -> SQL Editor. Safe to re-run (IF NOT EXISTS guards).

-- ---------------------------------------------------------------------------
-- committee_runs — one row per investment-committee analysis pass for a
-- founder. Re-runnable (e.g. after fresh research), same job-tracking shape as
-- research_jobs so the frontend can reuse the same live-progress pattern.
-- ---------------------------------------------------------------------------
create table if not exists public.committee_runs (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders (id) on delete cascade,
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists committee_runs_founder_id_idx
  on public.committee_runs (founder_id, created_at desc);

alter table public.committee_runs enable row level security;

drop policy if exists "committee_runs: authenticated read" on public.committee_runs;
create policy "committee_runs: authenticated read" on public.committee_runs
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- committee_logs — live progress feed for a committee run (mirrors
-- research_logs's role for research_jobs).
-- ---------------------------------------------------------------------------
create table if not exists public.committee_logs (
  id uuid primary key default gen_random_uuid(),
  committee_run_id uuid not null references public.committee_runs (id) on delete cascade,
  step text not null, -- e.g. 'agent_technical', 'agent_devils_advocate'
  message text,
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists committee_logs_run_id_idx
  on public.committee_logs (committee_run_id);

alter table public.committee_logs enable row level security;

drop policy if exists "committee_logs: authenticated read" on public.committee_logs;
create policy "committee_logs: authenticated read" on public.committee_logs
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- committee_agent_outputs — one row per agent per run. The Managing Partner's
-- row (agent = 'managing_partner') carries the final recommendation; every
-- other agent's row is an input to it, all visible for traceability.
-- ---------------------------------------------------------------------------
create table if not exists public.committee_agent_outputs (
  id uuid primary key default gen_random_uuid(),
  committee_run_id uuid not null references public.committee_runs (id) on delete cascade,
  agent text not null check (agent in (
    'technical', 'founder', 'market', 'risk', 'devils_advocate', 'managing_partner'
  )),
  summary text not null,
  output jsonb not null default '{}', -- strengths/concerns/citations, or final recommendation fields
  confidence numeric,
  created_at timestamptz not null default now()
);

create index if not exists committee_agent_outputs_run_id_idx
  on public.committee_agent_outputs (committee_run_id);

alter table public.committee_agent_outputs enable row level security;

drop policy if exists "committee_agent_outputs: authenticated read" on public.committee_agent_outputs;
create policy "committee_agent_outputs: authenticated read" on public.committee_agent_outputs
  for select using (auth.role() = 'authenticated');
