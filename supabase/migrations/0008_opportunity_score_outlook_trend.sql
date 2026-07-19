-- VC Brain -- Market outlook (bullish/neutral/bear) and per-axis trend.
-- Run once in the Supabase Dashboard -> SQL Editor. Safe to re-run (IF NOT EXISTS guards).

-- Brief Section 2 item 6: the Market axis must be "rated bullish, neutral, or
-- bear" and every axis "shows trend (improving / declining / stable)". Both are
-- named, required MVP behavior, not derived/UI-only concerns, so they get real
-- columns on opportunity_scores rather than being buried in the rationale array.

alter table public.opportunity_scores
  add column if not exists outlook text
    check (outlook is null or outlook in ('bullish', 'neutral', 'bear'));

alter table public.opportunity_scores
  add column if not exists trend text
    check (trend is null or trend in ('improving', 'declining', 'stable'));
