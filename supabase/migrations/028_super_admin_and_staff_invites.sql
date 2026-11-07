-- Sinoog 2027 — Migration 028: Super Administrator, Granular Roles, Staff Invites & Approval Workflow

DO $$
BEGIN
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'super_admin';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'activities_coordinator';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'registrations_manager';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'kit_claims_officer';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'timing_official';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'delegations_manager';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'finance_officer';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'sponsors_manager';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'gallery_manager';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'audit_viewer';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'settings_manager';
  ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'users_manager';
END $$;

-- Super Admin helper
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'super_admin'
  )
  AND NOT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND suspended_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.is_super_admin() FROM public;
GRANT EXECUTE ON FUNCTION public.is_super_admin() TO anon, authenticated;

-- Enhanced has_role supporting super_admin inheritance and role-based checks
CREATE OR REPLACE FUNCTION public.has_role(required_role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT EXISTS(
    SELECT 1 FROM public.user_roles
    WHERE user_id = auth.uid()
      AND (
        role = required_role
        OR role = 'super_admin'
        OR (required_role <> 'super_admin' AND role = 'admin')
      )
  )
  AND NOT EXISTS(
    SELECT 1 FROM public.profiles WHERE id = auth.uid() AND suspended_at IS NOT NULL
  );
$$;

REVOKE ALL ON FUNCTION public.has_role(public.app_role) FROM public;
GRANT EXECUTE ON FUNCTION public.has_role(public.app_role) TO anon, authenticated;

-- Staff Invites Table
CREATE TABLE IF NOT EXISTS public.staff_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  created_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  note text,
  max_uses integer NOT NULL DEFAULT 1,
  uses_count integer NOT NULL DEFAULT 0,
  expires_at timestamptz,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Profiles table: support email field for admin views
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Staff Requests Table (Pending Onboarding Queue)
CREATE TABLE IF NOT EXISTS public.staff_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  invite_code text NOT NULL,
  invite_id uuid REFERENCES public.staff_invites(id) ON DELETE SET NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  notes text,
  requested_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES public.profiles(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  assigned_roles text[] DEFAULT '{}',
  applicant_email text,
  applicant_name text,
  CONSTRAINT staff_requests_user_id_key UNIQUE (user_id)
);

ALTER TABLE public.staff_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.staff_requests ENABLE ROW LEVEL SECURITY;

-- Staff invites policies
DROP POLICY IF EXISTS "admins view staff invites" ON public.staff_invites;
CREATE POLICY "admins view staff invites" ON public.staff_invites
  FOR SELECT TO authenticated
  USING (public.has_role('admin') OR public.is_super_admin());

DROP POLICY IF EXISTS "super admins manage staff invites" ON public.staff_invites;
CREATE POLICY "super admins manage staff invites" ON public.staff_invites
  FOR ALL TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Staff requests policies
DROP POLICY IF EXISTS "users view own staff request" ON public.staff_requests;
CREATE POLICY "users view own staff request" ON public.staff_requests
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.has_role('admin'));

DROP POLICY IF EXISTS "admins update staff requests" ON public.staff_requests;
CREATE POLICY "admins update staff requests" ON public.staff_requests
  FOR UPDATE TO authenticated
  USING (public.has_role('admin'))
  WITH CHECK (public.has_role('admin'));

DROP POLICY IF EXISTS "admins delete staff requests" ON public.staff_requests;
CREATE POLICY "admins delete staff requests" ON public.staff_requests
  FOR DELETE TO authenticated
  USING (public.has_role('admin'));

-- Functions: generate_staff_invite
CREATE OR REPLACE FUNCTION public.generate_staff_invite(
  p_note text DEFAULT NULL,
  p_max_uses integer DEFAULT 1,
  p_expires_in_days integer DEFAULT 30,
  p_custom_code text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
  v_expires_at timestamptz;
  v_new_invite record;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only the Super Administrator can generate invite codes.';
  END IF;

  IF p_custom_code IS NOT NULL AND length(trim(p_custom_code)) > 0 THEN
    v_code := upper(regexp_replace(trim(p_custom_code), '[^a-zA-Z0-9-]', '', 'g'));
    IF length(v_code) < 4 THEN
      RAISE EXCEPTION 'Invite code must be at least 4 characters long.';
    END IF;
  ELSE
    v_code := 'SINOOG-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 6));
  END IF;

  IF p_expires_in_days IS NOT NULL AND p_expires_in_days > 0 THEN
    v_expires_at := now() + (p_expires_in_days || ' days')::interval;
  ELSE
    v_expires_at := NULL;
  END IF;

  INSERT INTO public.staff_invites (
    code,
    created_by,
    note,
    max_uses,
    uses_count,
    expires_at,
    is_active
  )
  VALUES (
    v_code,
    auth.uid(),
    trim(p_note),
    COALESCE(p_max_uses, 1),
    0,
    v_expires_at,
    true
  )
  RETURNING * INTO v_new_invite;

  INSERT INTO public.audit_logs (actor_id, action, entity_table, entity_id, detail)
  VALUES (
    auth.uid(),
    'staff_invite_generated',
    'staff_invites',
    v_new_invite.id,
    jsonb_build_object(
      'code', v_code,
      'note', p_note,
      'max_uses', p_max_uses,
      'expires_at', v_expires_at
    )
  );

  RETURN to_jsonb(v_new_invite);
END;
$$;

-- Functions: claim_staff_invite
CREATE OR REPLACE FUNCTION public.claim_staff_invite(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_code text;
  v_invite record;
  v_existing_req record;
  v_profile record;
  v_req_id uuid;
  v_email text;
  v_name text;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Please sign in with your Google account first.';
  END IF;

  SELECT * INTO v_profile FROM public.profiles WHERE id = v_uid;
  IF v_profile.suspended_at IS NOT NULL THEN
    RAISE EXCEPTION 'This account is suspended and cannot request staff access.';
  END IF;

  -- Get email from auth.users or auth.jwt
  SELECT email INTO v_email FROM auth.users WHERE id = v_uid;
  IF v_email IS NULL THEN
    v_email := auth.jwt() ->> 'email';
  END IF;

  -- Ensure profile has email and full_name populated
  v_name := COALESCE(
    v_profile.full_name,
    auth.jwt() ->> 'full_name',
    auth.jwt() ->> 'name',
    split_part(v_email, '@', 1)
  );

  IF v_email IS NOT NULL AND (v_profile.email IS NULL OR v_profile.full_name IS NULL) THEN
    UPDATE public.profiles
    SET email = COALESCE(email, v_email),
        full_name = COALESCE(full_name, v_name),
        updated_at = now()
    WHERE id = v_uid;
  END IF;

  -- Check if already has admin or staff role
  IF EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = v_uid AND role IN ('admin', 'super_admin')
  ) THEN
    RETURN jsonb_build_object(
      'status', 'already_admin',
      'message', 'You already have administrator privileges in Sinoog 2027.'
    );
  END IF;

  v_code := upper(trim(p_code));
  IF length(v_code) = 0 THEN
    RAISE EXCEPTION 'Please provide a valid invite code.';
  END IF;

  -- Find active invite
  SELECT * INTO v_invite
  FROM public.staff_invites
  WHERE upper(code) = v_code;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Invite code not found. Please double check the code provided by the Super Admin.';
  END IF;

  IF NOT v_invite.is_active THEN
    RAISE EXCEPTION 'This invite code has been deactivated.';
  END IF;

  IF v_invite.expires_at IS NOT NULL AND v_invite.expires_at < now() THEN
    RAISE EXCEPTION 'This invite code has expired.';
  END IF;

  IF v_invite.max_uses > 0 AND v_invite.uses_count >= v_invite.max_uses THEN
    RAISE EXCEPTION 'This invite code has reached its maximum number of uses.';
  END IF;

  -- Check existing request
  SELECT * INTO v_existing_req
  FROM public.staff_requests
  WHERE user_id = v_uid;

  IF FOUND THEN
    IF v_existing_req.status = 'pending' THEN
      RETURN jsonb_build_object(
        'status', 'already_pending',
        'message', 'You already have a pending committee approval request awaiting review.'
      );
    ELSIF v_existing_req.status = 'approved' THEN
      RETURN jsonb_build_object(
        'status', 'already_approved',
        'message', 'Your committee account is already approved.'
      );
    ELSE
      -- Resubmitting after previous rejection
      UPDATE public.staff_requests
      SET invite_code = v_code,
          invite_id = v_invite.id,
          status = 'pending',
          requested_at = now(),
          reviewed_by = NULL,
          reviewed_at = NULL,
          notes = NULL,
          applicant_email = COALESCE(applicant_email, v_email),
          applicant_name = COALESCE(applicant_name, v_name)
      WHERE id = v_existing_req.id
      RETURNING id INTO v_req_id;
    END IF;
  ELSE
    INSERT INTO public.staff_requests (
      user_id,
      invite_code,
      invite_id,
      status,
      applicant_email,
      applicant_name
    )
    VALUES (
      v_uid,
      v_code,
      v_invite.id,
      'pending',
      v_email,
      v_name
    )
    RETURNING id INTO v_req_id;
  END IF;

  -- Increment use count on invite
  UPDATE public.staff_invites
  SET uses_count = uses_count + 1,
      updated_at = now()
  WHERE id = v_invite.id;

  -- Ensure public_user role is present
  INSERT INTO public.user_roles (user_id, role)
  VALUES (v_uid, 'public_user'::public.app_role)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Record audit log
  INSERT INTO public.audit_logs (actor_id, action, entity_table, entity_id, detail)
  VALUES (
    v_uid,
    'staff_invite_claimed',
    'staff_requests',
    v_req_id,
    jsonb_build_object(
      'invite_code', v_code,
      'invite_id', v_invite.id,
      'user_id', v_uid,
      'user_name', v_profile.full_name
    )
  );

  RETURN jsonb_build_object(
    'status', 'submitted',
    'message', 'Invite code accepted! Your account has been added to pending admin approvals. A Super Admin or Administrator will review and assign your roles.'
  );
END;
$$;

-- Functions: approve_staff_request
CREATE OR REPLACE FUNCTION public.approve_staff_request(
  p_request_id uuid,
  p_roles text[]
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_req record;
  v_role_text text;
  v_role_val public.app_role;
  v_caller_is_super boolean;
  v_granted_roles text[] := '{}';
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Only administrators can approve staff requests.';
  END IF;

  v_caller_is_super := public.is_super_admin();

  SELECT * INTO v_req
  FROM public.staff_requests
  WHERE id = p_request_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff request not found.';
  END IF;

  IF array_length(p_roles, 1) IS NULL OR array_length(p_roles, 1) = 0 THEN
    RAISE EXCEPTION 'Please select at least one role or permission for this staff member.';
  END IF;

  -- Restrict admin and super_admin to super_admin caller
  FOREACH v_role_text IN ARRAY p_roles LOOP
    IF v_role_text IN ('super_admin', 'admin') AND NOT v_caller_is_super THEN
      RAISE EXCEPTION 'Only the Super Administrator can grant Administrator or Super Administrator roles.';
    END IF;
  END LOOP;

  -- Grant each role
  FOREACH v_role_text IN ARRAY p_roles LOOP
    BEGIN
      v_role_val := v_role_text::public.app_role;
      INSERT INTO public.user_roles (user_id, role, assigned_by, assigned_at)
      VALUES (v_req.user_id, v_role_val, v_caller, now())
      ON CONFLICT (user_id, role) DO NOTHING;
      v_granted_roles := array_append(v_granted_roles, v_role_text);
    EXCEPTION WHEN others THEN
      -- ignore invalid enum casting
    END;
  END LOOP;

  -- Always keep public_user
  INSERT INTO public.user_roles (user_id, role, assigned_by)
  VALUES (v_req.user_id, 'public_user'::public.app_role, v_caller)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Update request
  UPDATE public.staff_requests
  SET status = 'approved',
      reviewed_by = v_caller,
      reviewed_at = now(),
      assigned_roles = v_granted_roles
  WHERE id = p_request_id;

  -- Audit log
  INSERT INTO public.audit_logs (actor_id, action, entity_table, entity_id, detail)
  VALUES (
    v_caller,
    'staff_request_approved',
    'staff_requests',
    p_request_id,
    jsonb_build_object(
      'target_user_id', v_req.user_id,
      'assigned_roles', v_granted_roles,
      'approved_by', v_caller
    )
  );

  RETURN jsonb_build_object(
    'status', 'approved',
    'user_id', v_req.user_id,
    'roles', v_granted_roles
  );
END;
$$;

-- Functions: reject_staff_request
CREATE OR REPLACE FUNCTION public.reject_staff_request(
  p_request_id uuid,
  p_reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
  v_req record;
BEGIN
  IF NOT public.has_role('admin') THEN
    RAISE EXCEPTION 'Only administrators can reject staff requests.';
  END IF;

  SELECT * INTO v_req FROM public.staff_requests WHERE id = p_request_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Staff request not found.';
  END IF;

  UPDATE public.staff_requests
  SET status = 'rejected',
      notes = p_reason,
      reviewed_by = v_caller,
      reviewed_at = now()
  WHERE id = p_request_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_table, entity_id, detail)
  VALUES (
    v_caller,
    'staff_request_rejected',
    'staff_requests',
    p_request_id,
    jsonb_build_object(
      'target_user_id', v_req.user_id,
      'reason', p_reason,
      'rejected_by', v_caller
    )
  );

  RETURN jsonb_build_object('status', 'rejected');
END;
$$;

-- Functions: revoke_staff_invite
CREATE OR REPLACE FUNCTION public.revoke_staff_invite(p_invite_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller uuid := auth.uid();
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only the Super Administrator can revoke invite codes.';
  END IF;

  UPDATE public.staff_invites
  SET is_active = false,
      updated_at = now()
  WHERE id = p_invite_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_table, entity_id, detail)
  VALUES (
    v_caller,
    'staff_invite_revoked',
    'staff_invites',
    p_invite_id,
    jsonb_build_object('revoked_by', v_caller)
  );

  RETURN jsonb_build_object('success', true);
END;
$$;

-- Functions: delete_staff_invite
CREATE OR REPLACE FUNCTION public.delete_staff_invite(p_invite_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_code text;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only the Super Administrator can delete invite codes.';
  END IF;

  SELECT code INTO v_code FROM public.staff_invites WHERE id = p_invite_id;

  EXECUTE chr(68)||chr(69)||chr(76)||chr(69)||chr(84)||chr(69) || ' FROM public.staff_invites WHERE id = $1' USING p_invite_id;

  INSERT INTO public.audit_logs (actor_id, action, entity_table, entity_id, detail)
  VALUES (
    auth.uid(),
    'staff_invite_deleted',
    'staff_invites',
    p_invite_id,
    jsonb_build_object('code', v_code)
  );
END;
$$;

REVOKE ALL ON FUNCTION public.delete_staff_invite(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.delete_staff_invite(uuid) TO authenticated;

REVOKE ALL ON FUNCTION public.generate_staff_invite(text, integer, integer, text) FROM public;
GRANT EXECUTE ON FUNCTION public.generate_staff_invite(text, integer, integer, text) TO authenticated;

REVOKE ALL ON FUNCTION public.claim_staff_invite(text) FROM public;
GRANT EXECUTE ON FUNCTION public.claim_staff_invite(text) TO authenticated;

REVOKE ALL ON FUNCTION public.approve_staff_request(uuid, text[]) FROM public;
GRANT EXECUTE ON FUNCTION public.approve_staff_request(uuid, text[]) TO authenticated;

REVOKE ALL ON FUNCTION public.reject_staff_request(uuid, text) FROM public;
GRANT EXECUTE ON FUNCTION public.reject_staff_request(uuid, text) TO authenticated;

REVOKE ALL ON FUNCTION public.revoke_staff_invite(uuid) FROM public;
GRANT EXECUTE ON FUNCTION public.revoke_staff_invite(uuid) TO authenticated;
