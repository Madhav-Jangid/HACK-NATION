# Supabase schema

No Supabase CLI is installed in this environment, so migrations here are plain SQL
files, applied by hand for now.

## How to apply

1. Open the Supabase Dashboard for this project → **SQL Editor**.
2. Paste the contents of `migrations/0001_init.sql` and run it. It's idempotent
   (guarded with `if not exists` / `drop policy if exists`), so it's safe to re-run.
3. Paste and run `migrations/0002_founder_scores.sql` (Phase 5/6 scoring table) the
   same way — also idempotent.

## What it creates

- `investment_thesis` — one row per investor (Phase 1), RLS-scoped so each investor
  only sees/edits their own row.
- `founders` — shared pool for both inbound applications and outbound-discovered
  candidates (Phase 2), readable by any signed-in investor; writes are AI/research-
  driven via the Python backend's service-role key (bypasses RLS), not yet exposed
  to authenticated writes.
- `founder_memory` — per-fact structured memory (Phase 4/5), one row per collected
  claim, source-tagged with a `confidence` column the Phase 7 trust layer will use.
- `research_jobs` / `research_logs` — pipeline run tracking + the "live research
  progress" log feed (Phase 3).

- `founder_scores` — append-only Founder Score history (Phase 5/6). Phase 5 only
  writes rows where `is_cold_start_derived = true` (the public-footprint fallback
  path for founders with no GitHub/launches/research/social/company-site signal at
  all); Phase 6 adds the full multi-factor score for founders with an actual track
  record.

Later phases (3-axis opportunity scores, trust/evidence records, memos, committee
agent outputs) will get their own migration files here as those phases are built —
see `implementation.md` for what's coming.
