-- VC Brain — Phase 5/6 scoring tables.
-- Run once in the Supabase Dashboard -> SQL Editor. Safe to re-run (IF NOT EXISTS guards).

-- ---------------------------------------------------------------------------
-- founder_scores — append-only history so Phase 6 can chart trend over time.
-- Phase 5 only ever inserts rows where is_cold_start_derived = true (the
-- public-footprint fallback path); Phase 6 will add the full multi-factor
-- Founder Score computation for founders with an actual track record.
-- ---------------------------------------------------------------------------
create table if not exists public.founder_scores (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders (id) on delete cascade,
  score numeric not null check (score >= 0 and score <= 100),
  confidence text not null check (confidence in ('low', 'medium', 'high')),
  is_cold_start_derived boolean not null default false,
  rationale jsonb not null default '[]',
  computed_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists founder_scores_founder_id_idx
  on public.founder_scores (founder_id, computed_at desc);

alter table public.founder_scores enable row level security;

drop policy if exists "founder_scores: authenticated read" on public.founder_scores;
create policy "founder_scores: authenticated read" on public.founder_scores
  for select using (auth.role() = 'authenticated');
