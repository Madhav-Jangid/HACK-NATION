-- VC Brain — Phase 9 (Three Independent Investment Scores).
-- Run once in the Supabase Dashboard -> SQL Editor. Safe to re-run (IF NOT EXISTS guards).

-- ---------------------------------------------------------------------------
-- opportunity_scores — the brief's 3-axis screening (Founder / Market / Idea
-- vs Market), explicitly NEVER averaged into one number. Append-only per axis
-- so each axis gets its own trend, same pattern as founder_scores. Distinct
-- from founder_scores (that's the founder's lifelong Founder Score, persists
-- across companies) and committee_agent_outputs (free-form per-agent reasoning)
-- — this table is the structured per-opportunity numeric screening result.
-- ---------------------------------------------------------------------------
create table if not exists public.opportunity_scores (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders (id) on delete cascade,
  committee_run_id uuid references public.committee_runs (id) on delete set null,
  axis text not null check (axis in ('founder', 'market', 'idea_vs_market')),
  score numeric not null check (score >= 0 and score <= 100),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  rationale jsonb not null default '[]',
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists opportunity_scores_founder_axis_idx
  on public.opportunity_scores (founder_id, axis, computed_at desc);

alter table public.opportunity_scores enable row level security;

drop policy if exists "opportunity_scores: authenticated read" on public.opportunity_scores;
create policy "opportunity_scores: authenticated read" on public.opportunity_scores
  for select using (auth.role() = 'authenticated');
