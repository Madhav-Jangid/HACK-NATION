-- Portfolio: lightweight invested-founder tracking for the brief's Investment
-- Decision "adversarial & portfolio check" gate. Not a full portfolio-
-- management UI (explicitly out of scope per the brief) -- just enough
-- structured data (sector/stage/geography/check size) for the Managing
-- Partner to flag real concentration risk against founders actually invested
-- in, instead of the previous stand-in ("active" = merely tracked, not
-- invested).

alter table public.founders
  drop constraint if exists founders_status_check;

alter table public.founders
  add constraint founders_status_check
  check (status in ('new', 'researching', 'screened', 'active', 'rejected', 'invested'));

alter table public.founders
  add column if not exists sector text,
  add column if not exists stage text,
  add column if not exists geography text,
  add column if not exists check_amount numeric,
  add column if not exists invested_at timestamptz;
