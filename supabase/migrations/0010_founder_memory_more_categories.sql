-- VC Brain -- widen founder_memory categories for deeper research collection
-- (LinkedIn-without-a-URL discovery, company registration/registry, board
-- members/team). Run once in the Supabase Dashboard -> SQL Editor.

alter table public.founder_memory
  drop constraint if exists founder_memory_category_check;

alter table public.founder_memory
  add constraint founder_memory_category_check
  check (category in (
    'education', 'experience', 'project', 'open_source', 'award',
    'company', 'research', 'patent', 'funding', 'social', 'team',
    'registration', 'other'
  ));
