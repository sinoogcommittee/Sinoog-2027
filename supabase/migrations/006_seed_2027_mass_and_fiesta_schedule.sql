-- Sinoog 2027 draft Mass and fiesta schedule
-- Source: Sto. Niño Parish 2026 schedule posters supplied by the committee.
-- Adapted to January 6-16, 2027. Celebrants are intentionally left blank.
-- Run manually in the Supabase SQL Editor after migrations 001-005.
-- Safe to rerun: existing rows with the same edition/title are updated only while
-- they are drafts and have no confirmed celebrant; missing rows are inserted.

begin;

-- Ensure the edition retains the committee-confirmed dates.
update public.editions
set
  novena_start_date = '2027-01-06'::date,
  fiesta_date = '2027-01-15'::date,
  run_date = '2027-01-09'::date
where year = 2027;

-- Normalize the optional placeholder names so they do not remain as duplicates.
update public.activities a
set
  title = 'Novena Mass - Day 1',
  starts_at = '2027-01-06 17:00:00+08'::timestamptz,
  ends_at = null,
  venue = 'Sto. Niño Parish Church, Guinacot',
  celebrant = null,
  sort_order = 1
from public.editions e
where a.edition_id = e.id
  and e.year = 2027
  and a.type = 'mass'
  and a.title = 'Opening Novena Mass'
  and a.status = 'draft'
  and (a.celebrant is null or lower(a.celebrant) = 'to be announced');

update public.activities a
set
  title = 'Fiesta Mass - 10:00 AM',
  starts_at = '2027-01-15 10:00:00+08'::timestamptz,
  ends_at = null,
  venue = 'Sto. Niño Parish Church, Guinacot',
  celebrant = null,
  sort_order = 2
from public.editions e
where a.edition_id = e.id
  and e.year = 2027
  and a.type = 'mass'
  and a.title = 'Pontifical Mass'
  and a.status = 'draft'
  and (a.celebrant is null or lower(a.celebrant) = 'to be announced');

with schedule(type, title, description, starts_at, venue, sort_order) as (
  values
    ('mass',  'Novena Mass - Day 1', 'First day of the novena Masses.',                    '2027-01-06 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 2', 'Second day of the novena Masses.',                   '2027-01-07 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 3', 'Third day of the novena Masses.',                    '2027-01-08 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 4', 'Fourth day of the novena Masses.',                   '2027-01-09 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 5', 'Fifth day of the novena Masses. Sunday schedule.',   '2027-01-10 16:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 6', 'Sixth day of the novena Masses.',                    '2027-01-11 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 7', 'Seventh day of the novena Masses.',                  '2027-01-12 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 8', 'Eighth day of the novena Masses.',                   '2027-01-13 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Vesper Mass',          'Vesper Mass on the ninth day of the novena.',        '2027-01-14 16:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Fiesta Mass - 6:00 AM','Early Fiesta Mass.',                                '2027-01-15 06:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Fiesta Mass - 10:00 AM','Main Fiesta Mass.',                                '2027-01-15 10:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 2),
    ('mass',  'Liwas sa Fiesta - Holy Mass','Holy Mass for Liwas sa Fiesta.',               '2027-01-16 06:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('other', 'Liwas sa Fiesta - Sakay-Sakay','Traditional Sakay-Sakay activity.',          '2027-01-16 08:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 2)
), edition as (
  select id
  from public.editions
  where year = 2027
)
update public.activities a
set
  type = s.type,
  description = s.description,
  starts_at = s.starts_at,
  ends_at = null,
  venue = s.venue,
  celebrant = null,
  sort_order = s.sort_order,
  updated_at = now()
from schedule s, edition e
where a.edition_id = e.id
  and a.title = s.title
  and a.status = 'draft'
  and (a.celebrant is null or lower(a.celebrant) = 'to be announced');

with schedule(type, title, description, starts_at, venue, sort_order) as (
  values
    ('mass',  'Novena Mass - Day 1', 'First day of the novena Masses.',                    '2027-01-06 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 2', 'Second day of the novena Masses.',                   '2027-01-07 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 3', 'Third day of the novena Masses.',                    '2027-01-08 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 4', 'Fourth day of the novena Masses.',                   '2027-01-09 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 5', 'Fifth day of the novena Masses. Sunday schedule.',   '2027-01-10 16:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 6', 'Sixth day of the novena Masses.',                    '2027-01-11 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 7', 'Seventh day of the novena Masses.',                  '2027-01-12 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Novena Mass - Day 8', 'Eighth day of the novena Masses.',                   '2027-01-13 17:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Vesper Mass',          'Vesper Mass on the ninth day of the novena.',        '2027-01-14 16:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Fiesta Mass - 6:00 AM','Early Fiesta Mass.',                                '2027-01-15 06:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('mass',  'Fiesta Mass - 10:00 AM','Main Fiesta Mass.',                                '2027-01-15 10:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 2),
    ('mass',  'Liwas sa Fiesta - Holy Mass','Holy Mass for Liwas sa Fiesta.',               '2027-01-16 06:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 1),
    ('other', 'Liwas sa Fiesta - Sakay-Sakay','Traditional Sakay-Sakay activity.',          '2027-01-16 08:00:00+08'::timestamptz, 'Sto. Niño Parish Church, Guinacot', 2)
), edition as (
  select id
  from public.editions
  where year = 2027
)
insert into public.activities (
  edition_id,
  type,
  title,
  description,
  starts_at,
  ends_at,
  venue,
  celebrant,
  status,
  sort_order
)
select
  e.id,
  s.type,
  s.title,
  s.description,
  s.starts_at,
  null,
  s.venue,
  null,
  'draft'::public.content_status,
  s.sort_order
from edition e
cross join schedule s
where not exists (
  select 1
  from public.activities a
  where a.edition_id = e.id
    and a.title = s.title
);

commit;

-- Review result. Celebrant should remain null and every item should be draft.
select
  a.title,
  a.starts_at at time zone 'Asia/Manila' as local_start,
  a.celebrant,
  a.status,
  a.sort_order
from public.activities a
join public.editions e on e.id = a.edition_id
where e.year = 2027
  and a.starts_at >= '2027-01-06 00:00:00+08'::timestamptz
  and a.starts_at < '2027-01-17 00:00:00+08'::timestamptz
order by a.starts_at, a.sort_order;

