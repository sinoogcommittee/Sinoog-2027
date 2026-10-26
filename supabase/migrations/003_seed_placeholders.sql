-- Optional development placeholders. Run only after 001 and 002.
with e as (
  select id from public.editions where year=2027
), seed(type,title,starts_at,venue,celebrant,status,sort_order) as (
  values
    ('run',      'Sinoog Run 2027',     '2027-01-09 05:00:00+08'::timestamptz, 'Guinacot, Guindulman', null::text,        'draft'::public.content_status, 10),
    ('mass',     'Opening Novena Mass',  '2027-01-09 18:00:00+08'::timestamptz, 'Sto. Niño Parish',      'To be announced', 'draft'::public.content_status, 20),
    ('mass',     'Pontifical Mass',      '2027-01-15 09:00:00+08'::timestamptz, 'Sto. Niño Parish',      'To be announced', 'draft'::public.content_status, 30),
    ('festival', 'Sinoog Festival 2027', '2027-01-15 13:00:00+08'::timestamptz, 'Guinacot, Guindulman', null::text,        'draft'::public.content_status, 40)
)
insert into public.activities(edition_id,type,title,starts_at,venue,celebrant,status,sort_order)
select e.id,s.type,s.title,s.starts_at,s.venue,s.celebrant,s.status,s.sort_order
from e cross join seed s
where not exists (
  select 1 from public.activities a
  where a.edition_id=e.id and a.type=s.type and a.title=s.title and a.starts_at=s.starts_at
);

with e as (select id from public.editions where year=2027)
insert into public.run_events(edition_id,title) select id,'Sinoog Run 2027' from e on conflict(edition_id) do nothing;

-- All seeded schedules remain drafts. Confirm times before publishing.
