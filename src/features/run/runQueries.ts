import { supabase } from '../../lib/supabase';
import type { DbRunRegistration } from '../../types';
import { compressPaymentImage } from './compressPaymentImage';

export const EMERGENCY_RELATIONSHIPS = [
  'Parent',
  'Spouse',
  'Sibling',
  'Child',
  'Guardian',
  'Relative',
  'Friend',
  'Other',
] as const;

export type ManualPaymentMethod = 'GCash' | 'Cash';
export interface CashPaymentReceiver { user_id: string; full_name: string }

export interface RunCategory {
  id: string;
  run_event_id: string;
  name: string;
  distance_meters: number;
  fee_centavos: number;
  capacity: number | null;
  min_age: number | null;
  max_age: number | null;
  kit_description: string | null;
  published: boolean;
  sort_order: number;
}

export interface RunEvent {
  id: string;
  edition_id: string;
  title: string;
  registration_opens_at: string | null;
  registration_closes_at: string | null;
  race_starts_at: string | null;
  official_started_at: string | null;
  official_started_by: string | null;
  gcash_number: string | null;
  gcash_account_name: string | null;
  terms_version: string | null;
  terms_body: string | null;
  privacy_version: string | null;
  privacy_body: string | null;
}

export const FALLBACK_RUN_EVENT: RunEvent = {
  id: 'current-run-2027',
  edition_id: 'current-2027',
  title: 'Sinoog Run 2027: Dagan Alang Kang Señor Sto. Niño',
  registration_opens_at: null,
  registration_closes_at: null,
  race_starts_at: null,
  official_started_at: null,
  official_started_by: null,
  gcash_number: '09260265423',
  gcash_account_name: null,
  terms_version: '2027-v2',
  terms_body: 'I confirm that the submitted information is accurate, that I am fit for my selected category, and that I accept the ordinary risks of a public-road running event. I will follow route, safety, and medical instructions. I authorize reasonable emergency assistance. Registration fees are generally non-refundable after submission or approval, subject to the committee policy for duplicate payments, clear payment errors, or full event cancellation.',
  privacy_version: '2027-v2',
  privacy_body: 'The Sinoog Committee will use registration, contact, emergency, payment, consent, bib, QR, and timing information for event operations, safety, accounting, results, and audit. Private contact, emergency, payment-evidence, and QR-token data will not be published.',
};

export const FALLBACK_CATEGORIES: RunCategory[] = [
  {
    id: 'cat-3k',
    run_event_id: 'current-run-2027',
    name: '3K Fun Run / Family Walk',
    distance_meters: 3000,
    fee_centavos: 50000,
    capacity: null,
    min_age: null,
    max_age: null,
    kit_description: 'Official Sinoog 2027 Singlet, Race Bib, Finisher Ribbon, Post-race Refreshment',
    published: true,
    sort_order: 1,
  },
  {
    id: 'cat-5k',
    run_event_id: 'current-run-2027',
    name: '5K Community Stride',
    distance_meters: 5000,
    fee_centavos: 80000,
    capacity: null,
    min_age: null,
    max_age: null,
    kit_description: 'Official Sinoog 2027 Singlet, Race Bib, Finisher Medal, Hydration Support',
    published: true,
    sort_order: 2,
  },
  {
    id: 'cat-10k',
    run_event_id: 'current-run-2027',
    name: '10K Sto. Niño Fiesta Loop',
    distance_meters: 10000,
    fee_centavos: 100000,
    capacity: null,
    min_age: null,
    max_age: null,
    kit_description: 'Official Sinoog 2027 Singlet, Timing Bib, Heavy Cast Finisher Medal, Energy Station & Hot Meal',
    published: true,
    sort_order: 3,
  },
];

export async function getRunEventAndCategories(editionId: string): Promise<{
  event: RunEvent;
  categories: RunCategory[];
}> {
  if (!supabase) {
    return { event: FALLBACK_RUN_EVENT, categories: FALLBACK_CATEGORIES };
  }

  try {
    const { data: eventData } = await supabase
      .from('run_events')
      .select('*')
      .eq('edition_id', editionId)
      .maybeSingle();

    const currentEvent = (eventData as RunEvent) || FALLBACK_RUN_EVENT;

    const { data: catData } = await supabase
      .from('run_categories')
      .select('*')
      .eq('run_event_id', currentEvent.id)
      .eq('published', true)
      .order('sort_order', { ascending: true });

    let categories = (catData as RunCategory[]) || [];
    if (categories.length === 0) {
      categories = FALLBACK_CATEGORIES;
    }

    return { event: currentEvent, categories };
  } catch (err) {
    console.warn('Failed to load run event from Supabase, using defaults:', err);
    return { event: FALLBACK_RUN_EVENT, categories: FALLBACK_CATEGORIES };
  }
}

export interface RegistrationInput {
  run_event_id: string;
  category_id: string;
  participant_name: string;
  division: 'male' | 'female';
  birth_date: string;
  mobile: string;
  locality: string;
  shirt_size: string;
  club_name?: string | null;
  emergency_name: string;
  emergency_relationship: string;
  emergency_mobile: string;
  accessibility_notes?: string | null;
  guardian_consent?: boolean;
}

export interface AdminCashRegistrationInput extends RegistrationInput {
  email: string;
  temporary_password: string;
  offline_consent_confirmed: boolean;
}

export async function adminCreateCashRunner(
  payload: AdminCashRegistrationInput
): Promise<DbRunRegistration> {
  if (!supabase) throw new Error('Supabase must be configured to create a runner account.');

  const { data, error } = await supabase.functions.invoke('admin-create-runner', {
    body: payload,
  });
  if (error) throw new Error(error.message || 'Unable to create the runner account.');
  if (!data?.registration) throw new Error(data?.error || 'The runner account was not created.');
  return data.registration as DbRunRegistration;
}

export interface UserRegistrationState {
  registration: DbRunRegistration | null;
  payment: {
    id: string;
    method: string;
    amount_centavos: number;
    payer_reference: string | null;
    status: 'unpaid' | 'submitted' | 'verified' | 'rejected' | 'refunded';
    rejection_reason?: string | null;
    received_by?: string | null;
    evidence?: Array<{ id: string; object_path: string; uploaded_at: string }>;
  } | null;
  consents: Array<{
    id: string;
    consent_type: 'terms' | 'privacy' | 'guardian' | 'marketing';
    version: string;
    accepted: boolean;
    accepted_at: string;
  }>;
  result?: {
    finished_at: string;
    elapsed_milliseconds: number;
    division_rank: number;
    category_rank: number;
    overall_rank: number;
  } | null;
  kitClaim?: {
    registration_id: string;
    bib_number: string | null;
    claimed_at: string;
    claimed_by: string | null;
    notes: string | null;
  } | null;
}

export async function getUserRegistration(
  runEventId: string,
  userId: string
): Promise<UserRegistrationState> {
  if (!supabase) {
    // Check localStorage in demo mode
    const stored = localStorage.getItem(`demo_reg_${userId}`);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as UserRegistrationState;
        return parsed;
      } catch {
        return { registration: null, payment: null, consents: [] };
      }
    }
    return { registration: null, payment: null, consents: [] };
  }

  try {
    const { data: regData } = await supabase
      .from('run_registrations')
      .select('*')
      .eq('run_event_id', runEventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!regData) {
      return { registration: null, payment: null, consents: [] };
    }

    const registration = regData as DbRunRegistration;

    // Fetch related payment
    const { data: payData } = await supabase
      .from('payments')
      .select('*')
      .eq('registration_id', registration.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    let paymentObj = null;
    if (payData) {
      const { data: evidenceData } = await supabase
        .from('payment_evidence')
        .select('*')
        .eq('payment_id', payData.id);

      paymentObj = {
        id: payData.id,
        method: payData.method,
        amount_centavos: payData.amount_centavos,
        payer_reference: payData.payer_reference,
        status: payData.status,
        rejection_reason: payData.rejection_reason,
        received_by: payData.received_by,
        evidence: evidenceData?.map((e) => ({
          id: e.id,
          object_path: e.object_path,
          uploaded_at: e.uploaded_at,
        })),
      };
    }
    const [{ data: resultData }, { data: consentData, error: consentError }, { data: kitData }] = await Promise.all([
      supabase.rpc('get_my_run_result', { p_registration_id: registration.id }),
      supabase.from('registration_consents').select('id,consent_type,version,accepted,accepted_at')
        .eq('registration_id', registration.id).order('accepted_at', { ascending: true }),
      supabase.from('kit_claims').select('*').eq('registration_id', registration.id).maybeSingle(),
    ]);
    if (consentError) throw new Error(consentError.message);
    return {
      registration,
      payment: paymentObj,
      consents: consentData ?? [],
      result: resultData?.[0] ?? null,
      kitClaim: kitData ?? null,
    };
  } catch (err) {
    console.warn('Error fetching user registration:', err);
    return { registration: null, payment: null, consents: [] };
  }
}

export async function submitRegistration(payload: RegistrationInput): Promise<DbRunRegistration> {
  const reference = 'SR-' + Math.random().toString(36).substring(2, 8).toUpperCase();

  if (!supabase) {
    // Demo mode local persistence
    const mockReg: DbRunRegistration = {
      id: 'demo-reg-' + Date.now(),
      reference,
      run_event_id: payload.run_event_id,
      category_id: payload.category_id,
      user_id: 'demo-user-123',
      participant_name: payload.participant_name,
      division: payload.division,
      birth_date: payload.birth_date,
      mobile: payload.mobile,
      locality: payload.locality,
      shirt_size: payload.shirt_size,
      club_name: payload.club_name || null,
      emergency_name: payload.emergency_name,
      emergency_relationship: payload.emergency_relationship,
      emergency_mobile: payload.emergency_mobile,
      accessibility_notes: payload.accessibility_notes || null,
      fee_centavos: FALLBACK_CATEGORIES.find((category) => category.id === payload.category_id)?.fee_centavos ?? 0,
      currency: 'PHP',
      status: 'submitted',
      registration_email: 'runner@sinoog.local',
      submitted_at: new Date().toISOString(),
      approved_at: null,
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      bib_number: null,
      qr_token: null,
      registration_source: 'online',
      registered_by: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const state: UserRegistrationState = {
      registration: mockReg,
      payment: {
        id: 'demo-pay-' + Date.now(),
        method: 'GCash',
        amount_centavos: FALLBACK_CATEGORIES.find((category) => category.id === payload.category_id)?.fee_centavos ?? 0,
        payer_reference: null,
        status: 'unpaid',
      },
      consents: [
        { id: 'demo-terms', consent_type: 'terms', version: '2027-v2', accepted: true, accepted_at: new Date().toISOString() },
        { id: 'demo-privacy', consent_type: 'privacy', version: '2027-v2', accepted: true, accepted_at: new Date().toISOString() },
        ...(payload.guardian_consent ? [{ id: 'demo-guardian', consent_type: 'guardian' as const, version: '2027-v2', accepted: true, accepted_at: new Date().toISOString() }] : []),
      ],
    };

    localStorage.setItem('demo_reg_demo-user-123', JSON.stringify(state));
    return mockReg;
  }

  const { data: reg, error } = await supabase.rpc('submit_run_registration', {
    p_run_event_id: payload.run_event_id,
    p_category_id: payload.category_id,
    p_participant_name: payload.participant_name,
    p_division: payload.division,
    p_birth_date: payload.birth_date,
    p_mobile: payload.mobile,
    p_locality: payload.locality,
    p_shirt_size: payload.shirt_size,
    p_club_name: payload.club_name || '',
    p_emergency_name: payload.emergency_name,
    p_emergency_relationship: payload.emergency_relationship,
    p_emergency_mobile: payload.emergency_mobile,
    p_accessibility_notes: payload.accessibility_notes || '',
  });
  if (error || !reg) throw new Error(error?.message || 'Registration submission failed.');
  if (payload.guardian_consent) {
    const registration = reg as DbRunRegistration;
    const { error: guardianError } = await supabase.from('registration_consents').upsert({
      registration_id: registration.id,
      consent_type: 'guardian',
      version: '2027-v2',
      accepted: true,
    }, { onConflict: 'registration_id,consent_type,version' });
    if (guardianError) throw new Error(`Registration saved, but guardian consent could not be recorded: ${guardianError.message}`);
  }
  return reg as DbRunRegistration;
}

export async function getCashPaymentReceivers(): Promise<CashPaymentReceiver[]> {
  if (!supabase) return [{ user_id: 'demo-admin', full_name: 'Sinoog Administrator' }];
  const { data, error } = await supabase.rpc('list_cash_payment_receivers');
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function submitPaymentEvidence(
  paymentId: string,
  userId: string,
  payment: { method: ManualPaymentMethod; payerReference?: string; receivedBy?: string },
  file: File
): Promise<{ originalBytes: number; compressedBytes: number }> {
  const compressedFile = await compressPaymentImage(file);
  if (!supabase) {
    // In demo mode update local storage
    const stored = localStorage.getItem(`demo_reg_${userId}`);
    if (stored) {
      const state = JSON.parse(stored) as UserRegistrationState;
      if (state.payment) {
        state.payment.status = 'submitted';
        state.payment.method = payment.method;
        state.payment.payer_reference = payment.method === 'GCash' ? payment.payerReference || null : null;
        state.payment.received_by = payment.method === 'Cash' ? payment.receivedBy || null : null;
        state.payment.evidence = [
          {
            id: 'demo-ev-' + Date.now(),
            object_path: URL.createObjectURL(compressedFile),
            uploaded_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem(`demo_reg_${userId}`, JSON.stringify(state));
      }
    }
    return { originalBytes: file.size, compressedBytes: compressedFile.size };
  }

  // Upload file to private bucket under user's UUID folder: `${userId}/${paymentId}-${Date.now()}.${ext}`
  const objectPath = `${userId}/${paymentId}-${Date.now()}.webp`;

  const { error: uploadError } = await supabase.storage
    .from('payment-evidence')
    .upload(objectPath, compressedFile, {
      contentType: compressedFile.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Evidence upload failed: ${uploadError.message}`);
  }

  // Insert payment_evidence record
  const { error: evError } = await supabase.from('payment_evidence').insert({
    payment_id: paymentId,
    object_path: objectPath,
    original_name: compressedFile.name,
    mime_type: compressedFile.type,
    bytes: compressedFile.size,
  });

  if (evError) {
    await supabase.storage.from('payment-evidence').remove([objectPath]);
    throw new Error(evError.message);
  }

  // Update payments record
  const { error: payError } = await supabase.rpc('mark_manual_payment_submitted', {
    p_payment_id: paymentId,
    p_method: payment.method,
    p_payer_reference: payment.method === 'GCash' ? payment.payerReference || null : null,
    p_received_by: payment.method === 'Cash' ? payment.receivedBy || null : null,
  });

  if (payError) {
    await supabase.from('payment_evidence').delete().eq('payment_id', paymentId).eq('object_path', objectPath);
    await supabase.storage.from('payment-evidence').remove([objectPath]);
    throw new Error(payError.message);
  }
  return { originalBytes: file.size, compressedBytes: compressedFile.size };
}

export async function getAllRegistrationsForAdmin(): Promise<DbRunRegistration[]> {
  if (!supabase) {
    return [];
  }

  const { data, error } = await supabase
    .from('run_registrations')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data as DbRunRegistration[]) ?? [];
}

export async function updateRegistrationReview(
  id: string,
  status: 'approved' | 'needs_changes' | 'rejected' | 'cancelled',
  reviewNotes?: string
): Promise<void> {
  if (!supabase) return;

  const { error } = await supabase.rpc('review_run_registration', {
    p_registration_id: id,
    p_status: status,
    p_review_notes: reviewNotes || '',
  });

  if (error) {
    throw new Error(error.message);
  }
}

export async function deleteRejectedRegistration(id: string): Promise<void> {
  if (!supabase) return;
  const { data: objectPaths, error } = await supabase.rpc('delete_rejected_run_registration', {
    p_registration_id: id,
  });
  if (error) throw new Error(error.message);
  if (objectPaths?.length) {
    const { error: storageError } = await supabase.storage.from('payment-evidence').remove(objectPaths);
    if (storageError) console.warn('Rejected registration was deleted, but payment-file cleanup failed:', storageError);
  }
}

export interface AdminPaymentDetails {
  id: string;
  method: string;
  amount_centavos: number;
  payer_reference: string | null;
  status: 'unpaid' | 'submitted' | 'verified' | 'rejected' | 'refunded';
  submitted_at: string | null;
  received_by: string | null;
  evidence: Array<{ id: string; object_path: string; signed_url: string | null; bytes: number | null }>;
}

export async function getAdminPaymentDetails(registrationId: string): Promise<AdminPaymentDetails | null> {
  if (!supabase) return null;
  const { data: payment, error } = await supabase.from('payments').select('*')
    .eq('registration_id', registrationId).order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (error) throw new Error(error.message);
  if (!payment) return null;
  const { data: evidence, error: evidenceError } = await supabase.from('payment_evidence').select('*')
    .eq('payment_id', payment.id).order('uploaded_at', { ascending: false });
  if (evidenceError) throw new Error(evidenceError.message);
  const signedEvidence = await Promise.all((evidence ?? []).map(async (item) => {
    const { data } = await supabase!.storage.from('payment-evidence').createSignedUrl(item.object_path, 300);
    return { id: item.id, object_path: item.object_path, signed_url: data?.signedUrl ?? null, bytes: item.bytes };
  }));
  return {
    id: payment.id,
    method: payment.method,
    amount_centavos: payment.amount_centavos,
    payer_reference: payment.payer_reference,
    status: payment.status,
    submitted_at: payment.submitted_at,
    received_by: payment.received_by,
    evidence: signedEvidence,
  };
}

export async function updateRunEventSettings(
  id: string,
  updates: Pick<RunEvent, 'registration_opens_at' | 'registration_closes_at' | 'race_starts_at' | 'gcash_number' | 'gcash_account_name'>
): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('run_events').update(updates).eq('id', id);
  if (error) throw new Error(error.message);
}

export function getRunnerQrValue(registration: Pick<DbRunRegistration, 'qr_token'>): string | null {
  return registration.qr_token ? `SINOOG-2027|${registration.qr_token}` : null;
}

export interface TimingDashboardRow extends DbRunRegistration {
  finish: {
    finished_at: string;
    elapsed_milliseconds: number;
    recorded_by: string | null;
  } | null;
}

export async function startOfficialRun(runEventId: string): Promise<string> {
  if (!supabase) return new Date().toISOString();
  const { data, error } = await supabase.rpc('start_run_timing', { p_run_event_id: runEventId });
  if (error || !data) throw new Error(error?.message || 'Unable to start official timing.');
  return data;
}

export async function resetOfficialRun(runEventId: string): Promise<number> {
  if (!supabase) return 0;
  const { data, error } = await supabase.rpc('reset_run_timing', { p_run_event_id: runEventId });
  if (error) throw new Error(error.message);
  return data ?? 0;
}

export async function recordRunnerFinish(qrValue: string): Promise<void> {
  if (!supabase) return;
  const token = qrValue.includes('|') ? qrValue.split('|').pop()?.trim() : qrValue.trim();
  if (!token) throw new Error('The QR code is invalid.');
  const { error } = await supabase.rpc('record_run_finish', { p_qr_token: token });
  if (error) throw new Error(error.message);
}

export async function getTimingDashboard(runEventId: string): Promise<TimingDashboardRow[]> {
  if (!supabase) return [];
  const [{ data: registrations, error: registrationError }, { data: finishes, error: finishError }] = await Promise.all([
    supabase.from('run_registrations').select('*').eq('run_event_id', runEventId).eq('status', 'approved'),
    supabase.from('run_finish_records').select('*').eq('run_event_id', runEventId),
  ]);
  if (registrationError) throw new Error(registrationError.message);
  if (finishError) throw new Error(finishError.message);
  const finishByRegistration = new Map((finishes ?? []).map((finish) => [finish.registration_id, finish]));
  return ((registrations as DbRunRegistration[]) ?? []).map((registration) => ({
    ...registration,
    finish: finishByRegistration.get(registration.id) ?? null,
  }));
}

export function formatElapsed(milliseconds: number): string {
  const totalSeconds = Math.floor(milliseconds / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return [hours, minutes, seconds].map((part) => String(part).padStart(2, '0')).join(':');
}

export interface KitClaimRow extends DbRunRegistration {
  category_name: string;
  kit_claim: {
    registration_id: string;
    bib_number: string | null;
    claimed_at: string;
    claimed_by: string | null;
    claimed_by_name: string | null;
    notes: string | null;
  } | null;
}

export async function getKitClaimsDashboard(runEventId: string): Promise<KitClaimRow[]> {
  if (!supabase) return [];
  const [
    { data: registrations, error: regError },
    { data: categories, error: catError },
    { data: claims, error: claimError },
    { data: profiles, error: profError },
  ] = await Promise.all([
    supabase
      .from('run_registrations')
      .select('*')
      .eq('run_event_id', runEventId)
      .eq('status', 'approved')
      .order('bib_number', { ascending: true }),
    supabase.from('run_categories').select('id, name').eq('run_event_id', runEventId),
    supabase.from('kit_claims').select('*'),
    supabase.from('profiles').select('id, full_name'),
  ]);

  if (regError) throw new Error(regError.message);
  if (catError) throw new Error(catError.message);
  if (claimError) throw new Error(claimError.message);
  if (profError) throw new Error(profError.message);

  const categoryMap = new Map((categories ?? []).map((c) => [c.id, c.name]));
  const profileMap = new Map((profiles ?? []).map((p) => [p.id, p.full_name]));

  const claimByRegistration = new Map(
    (claims ?? []).map((claim) => [
      claim.registration_id,
      {
        ...claim,
        claimed_by_name: claim.claimed_by ? profileMap.get(claim.claimed_by) ?? 'Staff member' : 'Staff member',
      },
    ])
  );

  return ((registrations as DbRunRegistration[]) ?? []).map((reg) => ({
    ...reg,
    category_name: categoryMap.get(reg.category_id) ?? 'Run',
    kit_claim: claimByRegistration.get(reg.id) ?? null,
  }));
}

export async function claimRaceKit(input: {
  registrationId: string;
  bibNumber?: string | null;
  notes?: string | null;
}): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data: authData } = await supabase.auth.getUser();
  if (!authData?.user) throw new Error('You must be signed in to record kit claims.');

  const { error } = await supabase.from('kit_claims').insert({
    registration_id: input.registrationId,
    bib_number: input.bibNumber?.trim() || null,
    claimed_at: new Date().toISOString(),
    claimed_by: authData.user.id,
    notes: input.notes?.trim() || null,
  });

  if (error) {
    if (error.code === '23505' || error.message?.includes('duplicate key')) {
      throw new Error('This race kit has already been claimed.');
    }
    throw new Error(error.message);
  }
}

export async function cancelRaceKitClaim(registrationId: string): Promise<void> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.from('kit_claims').delete().eq('registration_id', registrationId);
  if (error) throw new Error(error.message);
}

export async function getKitClaimForRegistration(registrationId: string): Promise<{
  registration_id: string;
  bib_number: string | null;
  claimed_at: string;
  claimed_by: string | null;
  notes: string | null;
} | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from('kit_claims')
    .select('*')
    .eq('registration_id', registrationId)
    .maybeSingle();
  if (error) return null;
  return data;
}

