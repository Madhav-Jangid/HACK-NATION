-- VC Brain — Phase 11/12 (Dashboard Watchlist + Recommendation Feed actions).
-- Run once in the Supabase Dashboard -> SQL Editor. Safe to re-run (IF NOT EXISTS guards).

-- ---------------------------------------------------------------------------
-- founder_actions — one row per (investor, founder, action). Unlike `founders`
-- (a shared pool), these are personal to the investor — owner-scoped RLS, not
-- shared authenticated read. Serves the Phase 11 dashboard's Watchlist widget
-- and the Phase 12 recommendation feed's Interested/Skip/Save buttons.
-- ---------------------------------------------------------------------------
create table if not exists public.founder_actions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  founder_id uuid not null references public.founders (id) on delete cascade,
  action text not null check (action in ('interested', 'skip', 'save')),
  created_at timestamptz not null default now(),
  unique (user_id, founder_id, action)
);

create index if not exists founder_actions_user_id_idx
  on public.founder_actions (user_id, created_at desc);

alter table public.founder_actions enable row level security;

drop policy if exists "founder_actions: owner read" on public.founder_actions;
create policy "founder_actions: owner read" on public.founder_actions
  for select using (auth.uid() = user_id);

drop policy if exists "founder_actions: owner write" on public.founder_actions;
create policy "founder_actions: owner write" on public.founder_actions
  for insert with check (auth.uid() = user_id);

drop policy if exists "founder_actions: owner delete" on public.founder_actions;
create policy "founder_actions: owner delete" on public.founder_actions
  for delete using (auth.uid() = user_id);
