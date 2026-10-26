-- Correct the confirmed start of the 2027 novena to January 6.
-- The Sinoog Run remains on January 9, 2027.
update public.editions
set novena_start_date = '2027-01-06'::date
where year = 2027
  and novena_start_date is distinct from '2027-01-06'::date;

-- Correct an older optional draft placeholder only when it has a wrong date.
-- Preserve its local Manila time and do nothing when it is already January 6.
update public.activities a
set starts_at = (
  '2027-01-06'::date + (a.starts_at at time zone 'Asia/Manila')::time
) at time zone 'Asia/Manila'
from public.editions e
where a.edition_id = e.id
  and e.year = 2027
  and a.title = 'Opening Novena Mass'
  and a.type = 'mass'
  and a.status = 'draft'
  and (a.starts_at at time zone 'Asia/Manila')::date <> '2027-01-06'::date;

select year, run_date, novena_start_date, fiesta_date
from public.editions
where year = 2027;
