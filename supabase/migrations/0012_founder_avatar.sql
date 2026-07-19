-- Persona display: a real profile photo for the founder card, sourced from
-- whichever channel has one (currently GitHub's avatar_url; LinkedIn/Twitter
-- don't expose one without their own API access).

alter table public.founders
  add column if not exists avatar_url text;
