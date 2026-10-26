-- Assign the first website administrator.
-- Run once in Supabase SQL Editor after creating this Auth user.
do $$
declare
  target_user_id uuid;
begin
  select id into target_user_id
  from auth.users
  where lower(email)=lower('rieldiango24@gmail.com')
  limit 1;

  if target_user_id is null then
    raise exception 'Auth user rieldiango24@gmail.com was not found';
  end if;

  insert into public.profiles(id,full_name)
  select target_user_id, coalesce(raw_user_meta_data->>'full_name','Website Administrator')
  from auth.users where id=target_user_id
  on conflict(id) do nothing;

  insert into public.user_roles(user_id,role)
  values
    (target_user_id,'public_user'::public.app_role),
    (target_user_id,'admin'::public.app_role)
  on conflict(user_id,role) do nothing;

  raise notice 'Administrator role assigned to rieldiango24@gmail.com';
end $$;

select p.id,p.full_name,u.email,array_agg(r.role order by r.role) as roles
from public.profiles p
join auth.users u on u.id=p.id
join public.user_roles r on r.user_id=p.id
where lower(u.email)=lower('rieldiango24@gmail.com')
group by p.id,p.full_name,u.email;
