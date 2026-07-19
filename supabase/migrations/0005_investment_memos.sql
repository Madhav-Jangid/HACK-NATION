-- VC Brain — Phase 10 (Investment Memo Generator).
-- Run once in the Supabase Dashboard -> SQL Editor. Safe to re-run (IF NOT EXISTS guards).

-- ---------------------------------------------------------------------------
-- investment_memos — one row per committee run's generated memo. Append-only
-- (a founder can be re-committee'd later with fresh evidence); the frontend
-- shows the latest by founder_id.
-- ---------------------------------------------------------------------------
create table if not exists public.investment_memos (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders (id) on delete cascade,
  committee_run_id uuid references public.committee_runs (id) on delete set null,
  content text not null, -- markdown
  generated_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists investment_memos_founder_id_idx
  on public.investment_memos (founder_id, generated_at desc);

alter table public.investment_memos enable row level security;

drop policy if exists "investment_memos: authenticated read" on public.investment_memos;
create policy "investment_memos: authenticated read" on public.investment_memos
  for select using (auth.role() = 'authenticated');
