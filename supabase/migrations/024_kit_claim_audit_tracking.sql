-- Migration 024: Kit Claim Audit Tracking Trigger
-- Automatically records every manual and QR race kit handover and cancellation
-- into public.audit_logs with the processing admin's actor ID.

create or replace function public.log_kit_claim_audit()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (TG_OP = 'INSERT') then
    insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
    values(
      NEW.claimed_by,
      'kit_claimed',
      'kit_claims',
      NEW.registration_id::text,
      jsonb_build_object(
        'bib_number', NEW.bib_number,
        'notes', NEW.notes,
        'claimed_at', NEW.claimed_at,
        'method', 'manual_or_qr_handover'
      )
    );
    return NEW;
  elsif (TG_OP = 'DELETE') then
    insert into public.audit_logs(actor_id, action, entity_table, entity_id, detail)
    values(
      auth.uid(),
      'kit_claim_cancelled',
      'kit_claims',
      OLD.registration_id::text,
      jsonb_build_object(
        'bib_number', OLD.bib_number,
        'cancelled_at', now()
      )
    );
    return OLD;
  end if;
  return null;
end;
$$;

drop trigger if exists trg_kit_claim_audit on public.kit_claims;
create trigger trg_kit_claim_audit
  after insert or delete on public.kit_claims
  for each row
  execute function public.log_kit_claim_audit();
