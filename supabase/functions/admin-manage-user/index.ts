import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const staffRoles = ['admin', 'news_in_charge', 'delegation_head'] as const;
type StaffRole = typeof staffRoles[number];

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

function defaultKey(variable: string): string | undefined {
  try {
    const values = JSON.parse(Deno.env.get(variable) || '{}') as Record<string, string>;
    return values.default || Object.values(values)[0];
  } catch {
    return undefined;
  }
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (request.method !== 'POST') return json({ error: 'Method not allowed.' }, 405);

  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || defaultKey('SUPABASE_PUBLISHABLE_KEYS');
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || defaultKey('SUPABASE_SECRET_KEYS');
  if (!supabaseUrl || !anonKey || !serviceRoleKey) {
    return json({ error: 'The server function is missing its Supabase secrets.' }, 500);
  }

  const authorization = request.headers.get('Authorization');
  if (!authorization) return json({ error: 'Please sign in as an administrator.' }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
  });
  const { data: { user: caller }, error: callerError } = await callerClient.auth.getUser();
  if (callerError || !caller) return json({ error: 'Your administrator session is invalid.' }, 401);

  const serviceClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
  const { data: callerRole } = await serviceClient.from('user_roles').select('role')
    .eq('user_id', caller.id).eq('role', 'admin').maybeSingle();
  if (!callerRole) return json({ error: 'Administrator access is required.' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'The submitted request is invalid.' }, 400);
  }

  const action = String(body.action ?? '');

  if (action === 'create') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const fullName = String(body.full_name ?? '').trim();
    const mobile = String(body.mobile ?? '').trim();
    const locality = String(body.locality ?? '').trim();
    const password = String(body.password ?? '');
    const roles = Array.isArray(body.roles)
      ? [...new Set(body.roles.map(String).filter((role): role is StaffRole => staffRoles.includes(role as StaffRole)))]
      : [];

    if (!email || !email.includes('@')) return json({ error: 'Enter a valid staff email address.' }, 400);
    if (!fullName) return json({ error: 'Enter the staff member’s full name.' }, 400);
    if (password.length < 8) return json({ error: 'The temporary password must contain at least 8 characters.' }, 400);
    if (roles.length === 0) return json({ error: 'Assign at least one staff role.' }, 400);

    const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });
    if (createError || !created.user) {
      return json({ error: createError?.message || 'The staff account could not be created.' }, 400);
    }

    const createdUserId = created.user.id;
    const { error: profileError } = await serviceClient.from('profiles').update({
      full_name: fullName,
      mobile: mobile || null,
      locality: locality || null,
      suspended_at: null,
    }).eq('id', createdUserId);
    if (profileError) {
      await serviceClient.auth.admin.deleteUser(createdUserId);
      return json({ error: 'The staff profile could not be created.' }, 500);
    }

    const { error: roleError } = await serviceClient.from('user_roles').upsert([
      { user_id: createdUserId, role: 'public_user', assigned_by: caller.id },
      ...roles.map((role) => ({ user_id: createdUserId, role, assigned_by: caller.id })),
    ], { onConflict: 'user_id,role' });
    if (roleError) {
      await serviceClient.auth.admin.deleteUser(createdUserId);
      return json({ error: 'The staff roles could not be assigned.' }, 500);
    }

    const { data: callerProfile } = await serviceClient.from('profiles').select('full_name').eq('id', caller.id).maybeSingle();
    const { error: auditError } = await serviceClient.from('audit_logs').insert({
      actor_id: caller.id,
      action: 'admin_staff_created',
      entity_table: 'auth.users',
      entity_id: createdUserId,
      detail: {
        created_user: { id: createdUserId, email, full_name: fullName, roles },
        created_by: { id: caller.id, email: caller.email ?? null, full_name: callerProfile?.full_name ?? null },
      },
    });
    if (auditError) {
      await serviceClient.auth.admin.deleteUser(createdUserId);
      return json({ error: 'The staff account was not kept because its audit record could not be created.' }, 500);
    }

    return json({
      user: {
        id: createdUserId,
        email,
        full_name: fullName,
        mobile: mobile || null,
        locality: locality || null,
        suspended_at: null,
        created_at: created.user.created_at,
        updated_at: created.user.updated_at ?? created.user.created_at,
        roles: ['public_user', ...roles],
      },
    }, 201);
  }

  const userId = String(body.user_id ?? '');
  if (!userId) return json({ error: 'Select a user account.' }, 400);

  const { data: targetAuth, error: targetError } = await serviceClient.auth.admin.getUserById(userId);
  if (targetError || !targetAuth.user) return json({ error: 'The user account was not found.' }, 404);

  const loadDetails = async () => {
    const [{ data: profile, error: profileError }, { data: roles, error: rolesError }] = await Promise.all([
      serviceClient.from('profiles').select('*').eq('id', userId).single(),
      serviceClient.from('user_roles').select('role').eq('user_id', userId),
    ]);
    if (profileError) throw profileError;
    if (rolesError) throw rolesError;
    return {
      id: userId,
      email: targetAuth.user.email ?? null,
      full_name: profile.full_name,
      mobile: profile.mobile,
      locality: profile.locality,
      suspended_at: profile.suspended_at,
      created_at: profile.created_at,
      updated_at: profile.updated_at,
      roles: (roles ?? []).map((row) => row.role),
    };
  };

  const loadDeletionContext = async () => {
    const [{ data: profile, error: profileError }, { data: registrations, error: registrationError }] = await Promise.all([
      serviceClient.from('profiles').select('full_name,suspended_at').eq('id', userId).single(),
      serviceClient.from('run_registrations').select('id,status,reference').eq('user_id', userId),
    ]);
    if (profileError) throw profileError;
    if (registrationError) throw registrationError;

    const registrationRows = registrations ?? [];
    const registrationIds = registrationRows.map((row) => row.id);
    let paymentIds: string[] = [];
    let evidencePaths: string[] = [];
    if (registrationIds.length > 0) {
      const { data: payments, error: paymentError } = await serviceClient
        .from('payments').select('id').in('registration_id', registrationIds);
      if (paymentError) throw paymentError;
      paymentIds = (payments ?? []).map((row) => row.id);
      if (paymentIds.length > 0) {
        const { data: evidence, error: evidenceError } = await serviceClient
          .from('payment_evidence').select('object_path').in('payment_id', paymentIds);
        if (evidenceError) throw evidenceError;
        evidencePaths = [...new Set((evidence ?? []).map((row) => row.object_path).filter(Boolean))];
      }
    }

    const preservedChecks = await Promise.all([
      serviceClient.from('posts').select('id', { count: 'exact', head: true }).or(`created_by.eq.${userId},updated_by.eq.${userId}`),
      serviceClient.from('activities').select('id', { count: 'exact', head: true }).or(`created_by.eq.${userId},updated_by.eq.${userId}`),
      serviceClient.from('audit_logs').select('id', { count: 'exact', head: true }).eq('actor_id', userId),
    ]);
    const preservedContentCount = preservedChecks.reduce((total, result) => total + (result.count ?? 0), 0);
    const allRejectedOrCancelled = registrationRows.length > 0 && registrationRows.every((row) =>
      row.status === 'rejected' || row.status === 'cancelled'
    );
    const eligibility = profile.suspended_at
      ? 'suspended'
      : registrationRows.length === 0
        ? 'no_registration'
        : allRejectedOrCancelled
          ? 'rejected_or_cancelled'
          : 'active_registration';

    return {
      preview: {
        eligible: eligibility !== 'active_registration',
        eligibility,
        registration_count: registrationRows.length,
        payment_evidence_count: evidencePaths.length,
        preserved_content_count: preservedContentCount,
      },
      evidencePaths,
      targetName: profile.full_name ?? null,
      registrationReferences: registrationRows.map((row) => row.reference),
    };
  };

  if (action === 'get') {
    try {
      return json({ user: await loadDetails() });
    } catch {
      return json({ error: 'Unable to load the complete user record.' }, 500);
    }
  }

  if (action === 'delete-preview') {
    if (userId === caller.id) return json({ error: 'You cannot delete the administrator account currently signed in.' }, 400);
    try {
      const context = await loadDeletionContext();
      return json({ preview: context.preview });
    } catch {
      return json({ error: 'Unable to inspect this account’s related records.' }, 500);
    }
  }

  if (action === 'update') {
    const email = String(body.email ?? '').trim().toLowerCase();
    const fullName = String(body.full_name ?? '').trim();
    const mobile = String(body.mobile ?? '').trim();
    const locality = String(body.locality ?? '').trim();
    const newPassword = String(body.new_password ?? '');
    const suspended = body.suspended === true;
    const roles = Array.isArray(body.roles)
      ? [...new Set(body.roles.map(String).filter((role): role is StaffRole => staffRoles.includes(role as StaffRole)))]
      : [];

    if (!email || !email.includes('@')) return json({ error: 'Enter a valid email address.' }, 400);
    if (!fullName) return json({ error: 'Enter the user’s full name.' }, 400);
    if (newPassword && newPassword.length < 8) {
      return json({ error: 'The new password must contain at least 8 characters.' }, 400);
    }
    if (userId === caller.id && suspended) {
      return json({ error: 'You cannot suspend the administrator account currently signed in.' }, 400);
    }

    const { data: currentAdminRole } = await serviceClient.from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (currentAdminRole && !roles.includes('admin')) {
      const { count } = await serviceClient.from('user_roles').select('user_id', { count: 'exact', head: true })
        .eq('role', 'admin');
      if ((count ?? 0) <= 1) return json({ error: 'The last administrator role cannot be removed.' }, 409);
    }

    const authUpdate: {
      email: string;
      email_confirm: boolean;
      user_metadata: Record<string, unknown>;
      password?: string;
    } = {
      email,
      email_confirm: true,
      user_metadata: { ...(targetAuth.user.user_metadata ?? {}), full_name: fullName },
    };
    if (newPassword) authUpdate.password = newPassword;
    const { error: authError } = await serviceClient.auth.admin.updateUserById(userId, authUpdate);
    if (authError) return json({ error: authError.message }, 400);

    const { error: profileError } = await serviceClient.from('profiles').update({
      full_name: fullName,
      mobile: mobile || null,
      locality: locality || null,
      suspended_at: suspended ? new Date().toISOString() : null,
    }).eq('id', userId);
    if (profileError) return json({ error: profileError.message }, 400);

    const { error: deleteRoleError } = await serviceClient.from('user_roles').delete()
      .eq('user_id', userId).in('role', [...staffRoles]);
    if (deleteRoleError) return json({ error: deleteRoleError.message }, 400);

    const roleRows = ['public_user', ...roles].map((role) => ({
      user_id: userId,
      role,
      assigned_by: caller.id,
    }));
    const { error: roleError } = await serviceClient.from('user_roles').upsert(roleRows, {
      onConflict: 'user_id,role',
    });
    if (roleError) return json({ error: roleError.message }, 400);

    await serviceClient.from('audit_logs').insert({
      actor_id: caller.id,
      action: 'admin_user_updated',
      entity_table: 'profiles',
      entity_id: userId,
      detail: { email_changed: email !== targetAuth.user.email, password_reset: Boolean(newPassword), roles, suspended },
    });

    return json({ user: { ...(await loadDetails()), email } });
  }

  if (action === 'delete') {
    if (userId === caller.id) return json({ error: 'You cannot delete the administrator account currently signed in.' }, 400);

    const { data: targetAdminRole } = await serviceClient.from('user_roles').select('role')
      .eq('user_id', userId).eq('role', 'admin').maybeSingle();
    if (targetAdminRole) {
      const { count } = await serviceClient.from('user_roles').select('user_id', { count: 'exact', head: true })
        .eq('role', 'admin');
      if ((count ?? 0) <= 1) return json({ error: 'The last administrator account cannot be deleted.' }, 409);
    }

    let deletionContext: Awaited<ReturnType<typeof loadDeletionContext>>;
    try {
      deletionContext = await loadDeletionContext();
    } catch {
      return json({ error: 'Unable to inspect this account’s related records.' }, 500);
    }
    if (!deletionContext.preview.eligible) {
      return json({ error: 'This account has an active or approved registration. Reject the registration or suspend the account before deleting it.' }, 409);
    }

    const { data: callerProfile } = await serviceClient.from('profiles').select('full_name').eq('id', caller.id).maybeSingle();
    const auditDetail = {
      status: 'authorized',
      deleted_user: {
        id: userId,
        email: targetAuth.user.email ?? null,
        full_name: deletionContext.targetName,
      },
      deleted_by: {
        id: caller.id,
        email: caller.email ?? null,
        full_name: callerProfile?.full_name ?? null,
      },
      eligibility: deletionContext.preview.eligibility,
      registration_references: deletionContext.registrationReferences,
      registration_count: deletionContext.preview.registration_count,
      payment_evidence_count: deletionContext.preview.payment_evidence_count,
      preserved_content_count: deletionContext.preview.preserved_content_count,
    };
    const { data: auditRow, error: auditError } = await serviceClient.from('audit_logs').insert({
      actor_id: caller.id,
      action: 'admin_user_delete_authorized',
      entity_table: 'auth.users',
      entity_id: userId,
      detail: auditDetail,
    }).select('id').single();
    if (auditError || !auditRow) return json({ error: 'The deletion was stopped because the audit record could not be created.' }, 500);

    const { error: deleteError } = await serviceClient.auth.admin.deleteUser(userId);
    if (deleteError) {
      await serviceClient.from('audit_logs').update({
        action: 'admin_user_delete_failed',
        detail: { ...auditDetail, status: 'failed', error: deleteError.message },
      }).eq('id', auditRow.id);
      return json({ error: 'The account could not be deleted. Run migration 010_admin_account_deletion.sql, then try again.' }, 409);
    }

    const storageErrors: string[] = [];
    for (let start = 0; start < deletionContext.evidencePaths.length; start += 100) {
      const batch = deletionContext.evidencePaths.slice(start, start + 100);
      const { error: storageError } = await serviceClient.storage.from('payment-evidence').remove(batch);
      if (storageError) storageErrors.push(storageError.message);
    }
    await serviceClient.from('audit_logs').update({
      action: 'admin_user_deleted',
      detail: {
        ...auditDetail,
        status: 'deleted',
        deleted_at: new Date().toISOString(),
        payment_evidence_removed: deletionContext.evidencePaths.length,
        storage_cleanup_errors: storageErrors,
      },
    }).eq('id', auditRow.id);

    return json({ deleted: true, storage_cleanup_warning: storageErrors.length > 0 });
  }

  return json({ error: 'Unsupported user-management action.' }, 400);
});
