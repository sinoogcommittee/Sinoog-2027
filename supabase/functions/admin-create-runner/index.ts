import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

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
  const { data: role } = await serviceClient.from('user_roles').select('role')
    .eq('user_id', caller.id).eq('role', 'admin').maybeSingle();
  if (!role) return json({ error: 'Administrator access is required.' }, 403);

  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'The submitted form is invalid.' }, 400);
  }

  const required = [
    'email', 'temporary_password', 'run_event_id', 'category_id', 'participant_name',
    'division', 'birth_date', 'mobile', 'locality', 'shirt_size', 'emergency_name',
    'emergency_relationship', 'emergency_mobile',
  ];
  const missing = required.filter((field) => !String(body[field] ?? '').trim());
  if (missing.length || body.offline_consent_confirmed !== true) {
    return json({ error: 'Complete all required runner fields and confirm the signed waiver.' }, 400);
  }
  if (!['male', 'female'].includes(String(body.division))) {
    return json({ error: 'Select a valid runner division.' }, 400);
  }
  if (String(body.temporary_password).length < 8) {
    return json({ error: 'The temporary password must contain at least 8 characters.' }, 400);
  }

  const email = String(body.email).trim().toLowerCase();
  const { data: created, error: createError } = await serviceClient.auth.admin.createUser({
    email,
    password: String(body.temporary_password),
    email_confirm: true,
    user_metadata: { full_name: String(body.participant_name).trim() },
  });
  if (createError || !created.user) {
    return json({ error: createError?.message || 'Unable to create the runner login.' }, 400);
  }

  const { data: registration, error: registrationError } = await serviceClient.rpc(
    'admin_register_cash_runner',
    {
      p_admin_id: caller.id,
      p_user_id: created.user.id,
      p_run_event_id: body.run_event_id,
      p_category_id: body.category_id,
      p_participant_name: String(body.participant_name).trim(),
      p_division: body.division,
      p_birth_date: body.birth_date,
      p_mobile: String(body.mobile).trim(),
      p_full_address: String(body.locality).trim(),
      p_shirt_size: String(body.shirt_size).trim(),
      p_club_name: String(body.club_name ?? '').trim(),
      p_emergency_name: String(body.emergency_name).trim(),
      p_emergency_relationship: String(body.emergency_relationship).trim(),
      p_emergency_mobile: String(body.emergency_mobile).trim(),
      p_accessibility_notes: String(body.accessibility_notes ?? '').trim(),
      p_offline_consent_confirmed: true,
    },
  );

  if (registrationError || !registration) {
    await serviceClient.auth.admin.deleteUser(created.user.id);
    return json({ error: registrationError?.message || 'Unable to save the cash registration.' }, 400);
  }

  return json({ registration });
});
