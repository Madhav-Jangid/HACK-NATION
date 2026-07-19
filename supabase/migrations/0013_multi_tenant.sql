-- VC Brain -- Multi-tenant isolation.
--
-- Every table below was built with a single shared "authenticated read" RLS
-- policy: any signed-in investor could see every founder/research job/
-- committee run/memo in the database, regardless of who sourced or ran it.
-- That was fine for a single-fund demo, but with real signups this means
-- every user sees the exact same pipeline -- there was no per-investor
-- isolation at all. This migration adds an owner (`user_id`) to `founders`
-- and rewrites every dependent table's RLS to scope through that ownership,
-- so each signed-up investor gets their own founders/pipeline/scores/memos.
--
-- Run once in the Supabase Dashboard -> SQL Editor. Safe to re-run (DROP IF
-- EXISTS + IF NOT EXISTS guards throughout).

-- ---------------------------------------------------------------------------
-- founders: add the owner column. Existing rows (pre-multi-tenant demo data)
-- are backfilled to whichever user signed up first, purely so they remain
-- visible to *someone* instead of becoming permanently orphaned once RLS
-- tightens -- new rows going forward always carry a real owner.
-- ---------------------------------------------------------------------------
alter table public.founders
  add column if not exists user_id uuid references auth.users (id) on delete cascade;

update public.founders
set user_id = (select id from auth.users order by created_at asc limit 1)
where user_id is null;

do $$
begin
  if not exists (select 1 from public.founders where user_id is null) then
    alter table public.founders alter column user_id set not null;
  end if;
end $$;

create index if not exists founders_user_id_idx on public.founders (user_id, created_at desc);

drop policy if exists "founders: authenticated read" on public.founders;
drop policy if exists "founders: owner read" on public.founders;
create policy "founders: owner read" on public.founders
  for select using (auth.uid() = user_id);

drop policy if exists "founders: owner insert" on public.founders;
create policy "founders: owner insert" on public.founders
  for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Direct founder_id children: owner-scoped via a single join to founders.
-- ---------------------------------------------------------------------------
drop policy if exists "founder_memory: authenticated read" on public.founder_memory;
drop policy if exists "founder_memory: owner read" on public.founder_memory;
create policy "founder_memory: owner read" on public.founder_memory
  for select using (
    exists (select 1 from public.founders f where f.id = founder_memory.founder_id and f.user_id = auth.uid())
  );

drop policy if exists "research_jobs: authenticated read" on public.research_jobs;
drop policy if exists "research_jobs: owner read" on public.research_jobs;
create policy "research_jobs: owner read" on public.research_jobs
  for select using (
    exists (select 1 from public.founders f where f.id = research_jobs.founder_id and f.user_id = auth.uid())
  );

drop policy if exists "committee_runs: authenticated read" on public.committee_runs;
drop policy if exists "committee_runs: owner read" on public.committee_runs;
create policy "committee_runs: owner read" on public.committee_runs
  for select using (
    exists (select 1 from public.founders f where f.id = committee_runs.founder_id and f.user_id = auth.uid())
  );

drop policy if exists "opportunity_scores: authenticated read" on public.opportunity_scores;
drop policy if exists "opportunity_scores: owner read" on public.opportunity_scores;
create policy "opportunity_scores: owner read" on public.opportunity_scores
  for select using (
    exists (select 1 from public.founders f where f.id = opportunity_scores.founder_id and f.user_id = auth.uid())
  );

drop policy if exists "investment_memos: authenticated read" on public.investment_memos;
drop policy if exists "investment_memos: owner read" on public.investment_memos;
create policy "investment_memos: owner read" on public.investment_memos
  for select using (
    exists (select 1 from public.founders f where f.id = investment_memos.founder_id and f.user_id = auth.uid())
  );

drop policy if exists "diligence_gaps: authenticated read" on public.diligence_gaps;
drop policy if exists "diligence_gaps: owner read" on public.diligence_gaps;
create policy "diligence_gaps: owner read" on public.diligence_gaps
  for select using (
    exists (select 1 from public.founders f where f.id = diligence_gaps.founder_id and f.user_id = auth.uid())
  );

drop policy if exists "founder_scores: authenticated read" on public.founder_scores;
drop policy if exists "founder_scores: owner read" on public.founder_scores;
create policy "founder_scores: owner read" on public.founder_scores
  for select using (
    exists (select 1 from public.founders f where f.id = founder_scores.founder_id and f.user_id = auth.uid())
  );

-- ---------------------------------------------------------------------------
-- Two-hop children: research_logs -> research_jobs -> founders,
-- committee_logs / committee_agent_outputs -> committee_runs -> founders.
-- ---------------------------------------------------------------------------
drop policy if exists "research_logs: authenticated read" on public.research_logs;
drop policy if exists "research_logs: owner read" on public.research_logs;
create policy "research_logs: owner read" on public.research_logs
  for select using (
    exists (
      select 1 from public.research_jobs rj
      join public.founders f on f.id = rj.founder_id
      where rj.id = research_logs.research_job_id and f.user_id = auth.uid()
    )
  );

drop policy if exists "committee_logs: authenticated read" on public.committee_logs;
drop policy if exists "committee_logs: owner read" on public.committee_logs;
create policy "committee_logs: owner read" on public.committee_logs
  for select using (
    exists (
      select 1 from public.committee_runs cr
      join public.founders f on f.id = cr.founder_id
      where cr.id = committee_logs.committee_run_id and f.user_id = auth.uid()
    )
  );

drop policy if exists "committee_agent_outputs: authenticated read" on public.committee_agent_outputs;
drop policy if exists "committee_agent_outputs: owner read" on public.committee_agent_outputs;
create policy "committee_agent_outputs: owner read" on public.committee_agent_outputs
  for select using (
    exists (
      select 1 from public.committee_runs cr
      join public.founders f on f.id = cr.founder_id
      where cr.id = committee_agent_outputs.committee_run_id and f.user_id = auth.uid()
    )
  );

-- NOTE: the `decks` storage bucket (0009_deck_storage_bucket.sql) still grants
-- shared authenticated read/upload -- deck files aren't yet scoped per-owner
-- (would need a user-id-prefixed storage path convention). Left as a known
-- gap since decks aren't otherwise identified as sensitive per-tenant data in
-- the current schema; tighten later if that changes.
