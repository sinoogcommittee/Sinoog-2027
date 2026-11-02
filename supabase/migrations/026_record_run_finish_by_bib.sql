-- Migration 026: Allow recording official run finish by Bib Number or QR Token
-- Enables instant finish recording when camera QR scanning fails or runner sprints past.

create or replace function public.record_run_finish_by_identifier(p_identifier text)
returns public.run_finish_records
language plpgsql
security definer
set search_path = public
as $$
declare
  v_token uuid;
  v_cleaned text;
begin
  if not public.has_role('admin') then
    raise exception 'Administrator access required.';
  end if;

  v_cleaned := trim(p_identifier);
  if position('|' in v_cleaned) > 0 then
    v_cleaned := split_part(v_cleaned, '|', 2);
  end if;

  -- Try parsing as UUID token
  begin
    v_token := v_cleaned::uuid;
  exception when others then
    -- Strip optional leading # (e.g. "#10001" -> "10001")
    v_cleaned := regexp_replace(v_cleaned, '^#', '');
    select qr_token into v_token
    from public.run_registrations
    where lower(bib_number) = lower(v_cleaned) and status = 'approved'
    limit 1;

    if v_token is null then
      raise exception 'No approved runner found with Bib #% or QR token.', v_cleaned;
    end if;
  end;

  return public.record_run_finish(v_token);
end;
$$;

revoke all on function public.record_run_finish_by_identifier(text) from public;
grant execute on function public.record_run_finish_by_identifier(text) to authenticated;
