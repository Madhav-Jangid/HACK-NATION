-- VC Brain -- Storage bucket for pitch decks (brief Section 2 item 4: "Apply:
-- deck + company name is the minimum bar"). Run once in the Supabase Dashboard
-- -> SQL Editor. Safe to re-run (ON CONFLICT / IF NOT EXISTS guards).

insert into storage.buckets (id, name, public)
values ('decks', 'decks', false)
on conflict (id) do nothing;

-- Any authenticated investor can upload a deck on a founder's behalf (the
-- inbound application form) and read decks back for review -- decks aren't
-- per-investor-owned data, they're shared pipeline input like founders/
-- founder_memory elsewhere in this schema.
drop policy if exists "decks: authenticated upload" on storage.objects;
create policy "decks: authenticated upload" on storage.objects
  for insert
  with check (bucket_id = 'decks' and auth.role() = 'authenticated');

drop policy if exists "decks: authenticated read" on storage.objects;
create policy "decks: authenticated read" on storage.objects
  for select
  using (bucket_id = 'decks' and auth.role() = 'authenticated');
