import { supabase } from '../../lib/supabase';
import type { DbRunRegistration } from '../../types';

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
  terms_version: string | null;
  terms_body: string | null;
  privacy_version: string | null;
  privacy_body: string | null;
}

export const FALLBACK_RUN_EVENT: RunEvent = {
  id: 'current-run-2027',
  edition_id: 'current-2027',
  title: 'Sinoog Run 2027: Dagan Alang Kang Señor Sto. Niño',
  registration_opens_at: '2026-11-01T00:00:00+08:00',
  registration_closes_at: '2027-01-05T23:59:59+08:00',
  terms_version: '2027-v1',
  terms_body: 'By registering for the Sinoog Run 2027, the participant certifies physical fitness and assumes all ordinary risks associated with road running. Medical teams and water stations will be deployed along all routes.',
  privacy_version: '2027-v1',
  privacy_body: 'Personal data collected will be used strictly for race registration, emergency contact, bib allocation, and finisher verification by the Sto. Niño Parish Sinoog Committee.',
};

export const FALLBACK_CATEGORIES: RunCategory[] = [
  {
    id: 'cat-3k',
    run_event_id: 'current-run-2027',
    name: '3K Fun Run / Family Walk',
    distance_meters: 3000,
    fee_centavos: 35000, // ₱350.00
    capacity: 250,
    min_age: 7,
    max_age: 80,
    kit_description: 'Official Sinoog 2027 Singlet, Race Bib, Finisher Ribbon, Post-race Refreshment',
    published: true,
    sort_order: 1,
  },
  {
    id: 'cat-5k',
    run_event_id: 'current-run-2027',
    name: '5K Community Stride',
    distance_meters: 5000,
    fee_centavos: 45000, // ₱450.00
    capacity: 200,
    min_age: 12,
    max_age: 75,
    kit_description: 'Official Sinoog 2027 Singlet, Race Bib, Finisher Medal, Hydration Support',
    published: true,
    sort_order: 2,
  },
  {
    id: 'cat-10k',
    run_event_id: 'current-run-2027',
    name: '10K Coastal Challenge',
    distance_meters: 10000,
    fee_centavos: 60000, // ₱600.00
    capacity: 150,
    min_age: 15,
    max_age: 70,
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
    let { data: eventData } = await supabase
      .from('run_events')
      .select('*')
      .eq('edition_id', editionId)
      .maybeSingle();

    if (!eventData) {
      // Create run event row if missing for current edition
      const { data: createdEvent } = await supabase
        .from('run_events')
        .insert({
          edition_id: editionId,
          title: FALLBACK_RUN_EVENT.title,
          terms_version: FALLBACK_RUN_EVENT.terms_version,
          terms_body: FALLBACK_RUN_EVENT.terms_body,
          privacy_version: FALLBACK_RUN_EVENT.privacy_version,
          privacy_body: FALLBACK_RUN_EVENT.privacy_body,
        })
        .select()
        .single();
      eventData = createdEvent;
    }

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
  user_id: string;
  participant_name: string;
  birth_date: string;
  mobile: string;
  locality: string;
  shirt_size: string;
  club_name?: string | null;
  emergency_name: string;
  emergency_relationship: string;
  emergency_mobile: string;
  accessibility_notes?: string | null;
  fee_centavos: number;
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
    evidence?: Array<{ id: string; object_path: string; uploaded_at: string }>;
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
        return { registration: null, payment: null };
      }
    }
    return { registration: null, payment: null };
  }

  try {
    const { data: regData } = await supabase
      .from('run_registrations')
      .select('*')
      .eq('run_event_id', runEventId)
      .eq('user_id', userId)
      .maybeSingle();

    if (!regData) {
      return { registration: null, payment: null };
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
        evidence: evidenceData?.map((e) => ({
          id: e.id,
          object_path: e.object_path,
          uploaded_at: e.uploaded_at,
        })),
      };
    }

    return { registration, payment: paymentObj };
  } catch (err) {
    console.warn('Error fetching user registration:', err);
    return { registration: null, payment: null };
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
      user_id: payload.user_id,
      participant_name: payload.participant_name,
      birth_date: payload.birth_date,
      mobile: payload.mobile,
      locality: payload.locality,
      shirt_size: payload.shirt_size,
      club_name: payload.club_name || null,
      emergency_name: payload.emergency_name,
      emergency_relationship: payload.emergency_relationship,
      emergency_mobile: payload.emergency_mobile,
      accessibility_notes: payload.accessibility_notes || null,
      fee_centavos: payload.fee_centavos,
      currency: 'PHP',
      status: 'submitted',
      submitted_at: new Date().toISOString(),
      reviewed_by: null,
      reviewed_at: null,
      review_notes: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const state: UserRegistrationState = {
      registration: mockReg,
      payment: {
        id: 'demo-pay-' + Date.now(),
        method: 'GCash',
        amount_centavos: payload.fee_centavos,
        payer_reference: null,
        status: 'unpaid',
      },
    };

    localStorage.setItem(`demo_reg_${payload.user_id}`, JSON.stringify(state));
    return mockReg;
  }

  // 1. Insert registration
  const { data: reg, error: regError } = await supabase
    .from('run_registrations')
    .insert({
      run_event_id: payload.run_event_id,
      category_id: payload.category_id,
      user_id: payload.user_id,
      participant_name: payload.participant_name,
      birth_date: payload.birth_date,
      mobile: payload.mobile,
      locality: payload.locality,
      shirt_size: payload.shirt_size,
      club_name: payload.club_name || null,
      emergency_name: payload.emergency_name,
      emergency_relationship: payload.emergency_relationship,
      emergency_mobile: payload.emergency_mobile,
      accessibility_notes: payload.accessibility_notes || null,
      fee_centavos: payload.fee_centavos,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (regError || !reg) {
    throw new Error(regError?.message || 'Registration submission failed.');
  }

  // 2. Insert initial payment record
  await supabase.from('payments').insert({
    registration_id: reg.id,
    method: 'Manual Payment',
    amount_centavos: payload.fee_centavos,
    currency: 'PHP',
    status: 'unpaid',
  });

  // 3. Record consents
  await supabase.from('registration_consents').insert([
    {
      registration_id: reg.id,
      consent_type: 'terms',
      version: '2027-v1',
      accepted: true,
    },
    {
      registration_id: reg.id,
      consent_type: 'privacy',
      version: '2027-v1',
      accepted: true,
    },
  ]);

  return reg as DbRunRegistration;
}

export async function submitPaymentEvidence(
  paymentId: string,
  userId: string,
  method: string,
  payerReference: string,
  file: File
): Promise<void> {
  if (!supabase) {
    // In demo mode update local storage
    const stored = localStorage.getItem(`demo_reg_${userId}`);
    if (stored) {
      const state = JSON.parse(stored) as UserRegistrationState;
      if (state.payment) {
        state.payment.status = 'submitted';
        state.payment.method = method;
        state.payment.payer_reference = payerReference;
        state.payment.evidence = [
          {
            id: 'demo-ev-' + Date.now(),
            object_path: URL.createObjectURL(file),
            uploaded_at: new Date().toISOString(),
          },
        ];
        localStorage.setItem(`demo_reg_${userId}`, JSON.stringify(state));
      }
    }
    return;
  }

  // Upload file to private bucket under user's UUID folder: `${userId}/${paymentId}-${Date.now()}.${ext}`
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg';
  const objectPath = `${userId}/${paymentId}-${Date.now()}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from('payment-evidence')
    .upload(objectPath, file, {
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw new Error(`Evidence upload failed: ${uploadError.message}`);
  }

  // Insert payment_evidence record
  const { error: evError } = await supabase.from('payment_evidence').insert({
    payment_id: paymentId,
    object_path: objectPath,
    original_name: file.name,
    mime_type: file.type,
    bytes: file.size,
  });

  if (evError) {
    throw new Error(evError.message);
  }

  // Update payments record
  const { error: payError } = await supabase
    .from('payments')
    .update({
      method,
      payer_reference: payerReference,
      status: 'submitted',
      submitted_at: new Date().toISOString(),
    })
    .eq('id', paymentId);

  if (payError) {
    throw new Error(payError.message);
  }
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

  const { error } = await supabase
    .from('run_registrations')
    .update({
      status,
      review_notes: reviewNotes || null,
      reviewed_at: new Date().toISOString(),
    })
    .eq('id', id);

  if (error) {
    throw new Error(error.message);
  }
}

