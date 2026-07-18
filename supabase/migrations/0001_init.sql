-- VC Brain — initial schema (Phase 0 tables)
-- Run this once in the Supabase Dashboard -> SQL Editor (or via `supabase db push`
-- once the CLI is linked). Safe to re-run: everything is guarded with IF NOT EXISTS.

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- updated_at helper
-- ---------------------------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ---------------------------------------------------------------------------
-- investment_thesis — Phase 1. One row per investor (auth.users), the
-- fund-specific lens every recommendation is filtered/scored through.
-- ---------------------------------------------------------------------------
create table if not exists public.investment_thesis (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sectors text[] not null default '{}',
  stage text[] not null default '{}',
  geography text[] not null default '{}',
  check_size_min numeric,
  check_size_max numeric,
  ownership_target numeric,
  risk_appetite text,
  preferred_founder_type text,
  minimum_traction text,
  excluded_industries text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id)
);

drop trigger if exists set_updated_at on public.investment_thesis;
create trigger set_updated_at
  before update on public.investment_thesis
  for each row execute function public.set_updated_at();

alter table public.investment_thesis enable row level security;

drop policy if exists "thesis: owner read" on public.investment_thesis;
create policy "thesis: owner read" on public.investment_thesis
  for select using (auth.uid() = user_id);

drop policy if exists "thesis: owner write" on public.investment_thesis;
create policy "thesis: owner write" on public.investment_thesis
  for insert with check (auth.uid() = user_id);

drop policy if exists "thesis: owner update" on public.investment_thesis;
create policy "thesis: owner update" on public.investment_thesis
  for update using (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- founders — Phase 2. Shared pool: both inbound applications and outbound
-- discovery land here so both tracks feed one funnel.
-- ---------------------------------------------------------------------------
create table if not exists public.founders (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  company_name text,
  company_website text,
  github_url text,
  linkedin_url text,
  twitter_url text,
  deck_storage_path text, -- Supabase Storage object path, if a deck was uploaded
  source text not null check (source in ('inbound', 'outbound')),
  source_channel text, -- e.g. 'application', 'github_scan', 'producthunt', 'hackathon'
  status text not null default 'new'
    check (status in ('new', 'researching', 'screened', 'active', 'rejected')),
  is_cold_start boolean not null default false, -- Phase 5: no GitHub/funding/network
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists set_updated_at on public.founders;
create trigger set_updated_at
  before update on public.founders
  for each row execute function public.set_updated_at();

alter table public.founders enable row level security;

-- Shared read access for any signed-in investor; writes are AI/research-driven
-- (Python backend, service role — bypasses RLS) or added later via a dedicated
-- inbound-application route, not granted here yet.
drop policy if exists "founders: authenticated read" on public.founders;
create policy "founders: authenticated read" on public.founders
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- founder_memory — Phase 4/5. Nothing discarded: every fact, deduped,
-- timestamped, and tagged by source.
-- ---------------------------------------------------------------------------
create table if not exists public.founder_memory (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders (id) on delete cascade,
  category text not null check (category in (
    'education', 'experience', 'project', 'open_source', 'award',
    'company', 'research', 'patent', 'funding', 'social', 'other'
  )),
  payload jsonb not null default '{}',
  source_url text,
  source_type text, -- e.g. 'github', 'linkedin', 'producthunt', 'news', 'deck'
  confidence numeric, -- Phase 7 trust layer hooks into this per-claim
  collected_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists founder_memory_founder_id_idx
  on public.founder_memory (founder_id);

alter table public.founder_memory enable row level security;

drop policy if exists "founder_memory: authenticated read" on public.founder_memory;
create policy "founder_memory: authenticated read" on public.founder_memory
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- research_jobs — Phase 3. One row per research pipeline run for a founder.
-- ---------------------------------------------------------------------------
create table if not exists public.research_jobs (
  id uuid primary key default gen_random_uuid(),
  founder_id uuid not null references public.founders (id) on delete cascade,
  triggered_by text not null check (triggered_by in ('inbound', 'outbound')),
  status text not null default 'queued'
    check (status in ('queued', 'running', 'completed', 'failed')),
  started_at timestamptz,
  completed_at timestamptz,
  error text,
  created_at timestamptz not null default now()
);

create index if not exists research_jobs_founder_id_idx
  on public.research_jobs (founder_id);

alter table public.research_jobs enable row level security;

drop policy if exists "research_jobs: authenticated read" on public.research_jobs;
create policy "research_jobs: authenticated read" on public.research_jobs
  for select using (auth.role() = 'authenticated');

-- ---------------------------------------------------------------------------
-- research_logs — Phase 3 frontend "live research progress" feed.
-- ---------------------------------------------------------------------------
create table if not exists public.research_logs (
  id uuid primary key default gen_random_uuid(),
  research_job_id uuid not null references public.research_jobs (id) on delete cascade,
  step text not null, -- e.g. 'searching_github', 'normalizing', 'building_memory'
  message text,
  level text not null default 'info' check (level in ('info', 'warn', 'error')),
  created_at timestamptz not null default now()
);

create index if not exists research_logs_job_id_idx
  on public.research_logs (research_job_id);

alter table public.research_logs enable row level security;

drop policy if exists "research_logs: authenticated read" on public.research_logs;
create policy "research_logs: authenticated read" on public.research_logs
  for select using (auth.role() = 'authenticated');
