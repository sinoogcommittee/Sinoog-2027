-- Correct the confirmed start of the 2027 novena from January 9 to January 6.
-- The Sinoog Run remains on January 9, 2027.
update public.editions
set novena_start_date='2027-01-06'::date
where year=2027
  and novena_start_date is distinct from '2027-01-06'::date;

-- Correct the optional draft placeholder if migration 003 was applied.
-- Preserve its placeholder time while moving only the date.
update public.activities a
set starts_at=a.starts_at - interval '3 days'
from public.editions e
where a.edition_id=e.id
  and e.year=2027
  and a.title='Opening Novena Mass'
  and a.type='mass'
  and a.status='draft'
  and a.starts_at::date='2027-01-06'::date;

select year,run_date,novena_start_date,fiesta_date
from public.editions
where year=2027;
