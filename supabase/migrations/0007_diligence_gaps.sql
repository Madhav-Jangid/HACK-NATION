-- VC Brain -- Diligence truth-gap check.
-- Run once in the Supabase Dashboard -> SQL Editor. Safe to re-run (IF NOT EXISTS guards).

-- ---------------------------------------------------------------------------
-- diligence_gaps -- the brief's flow diagram has a distinct Diligence stage
-- that verifies evidence externally AND logs gaps as a first-class output,
-- feeding back into Memory -- not just a pass/fail verify step folded into
-- committee prose. One row per unverified or missing claim found during a
-- committee run, surfaced in the memo's "missing data must be explicitly
-- flagged" requirement instead of living only inside a partner agent's
-- free-form concerns list.
-- ---------------------------------------------------------------------------
create table if not exists public.diligence_gaps (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders (id) on delete cascade,
  committee_run_id uuid references public.committee_runs (id) on delete set null,
  claim text not null,
  gap_type text not null check (gap_type in ('missing', 'unverified', 'contradicted')),
  note text,
  source_agent text,
  created_at timestamptz not null default now()
);

create index if not exists diligence_gaps_founder_id_idx
  on public.diligence_gaps (founder_id, created_at desc);

create index if not exists diligence_gaps_run_id_idx
  on public.diligence_gaps (committee_run_id);

alter table public.diligence_gaps enable row level security;

drop policy if exists "diligence_gaps: authenticated read" on public.diligence_gaps;
create policy "diligence_gaps: authenticated read" on public.diligence_gaps
  for select using (auth.role() = 'authenticated');
