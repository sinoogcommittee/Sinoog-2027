-- Migration 025: Update 3K Category Kit Description & Normalize 3K Shirt Sizes
-- For 3K Fun Run / Family Walk, an event shirt is provided with sizes only (no singlet or full sub choice).

begin;

-- 1. Update the official kit description for 3K in public.run_categories
update public.run_categories
set kit_description = 'Official Sinoog 2027 Event Shirt, Race Bib, Finisher Ribbon, Post-race Refreshment'
where name ilike '%3K%' or distance_meters = 3000;

-- 2. Clean-up: Normalize any existing 3K registrations previously saved as 'Singlet (Size)' to just the size (e.g. 'L')
update public.run_registrations r
set shirt_size = substring(r.shirt_size from '\(([A-Za-z0-9]+)\)')
from public.run_categories c
where r.category_id = c.id
  and (c.name ilike '%3K%' or c.distance_meters = 3000)
  and r.shirt_size ilike 'Singlet (%)';

commit;
