import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { LoadingState } from '../../features/ui/FeedbackStates';
import { useAuth } from '../../features/auth/useAuth';
import { useToast } from '../../features/ui/useToast';
import { supabase } from '../../lib/supabase';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import {
  formatElapsed,
  getRunEventAndCategories,
  getUserRegistration,
  type RunCategory,
  type RunEvent,
  type UserRegistrationState,
} from '../../features/run/runQueries';
import { StatusBadge } from '../../components/StatusBadge';

export function AccountPage() {
  const { user, profile, loading: authLoading, isAdmin, isDemoAdmin, refresh, signOut } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [locality, setLocality] = useState('');
  const [saving, setSaving] = useState(false);
  const [registrationState, setRegistrationState] = useState<UserRegistrationState>({ registration: null, payment: null, consents: [] });
  const [runEvent, setRunEvent] = useState<RunEvent | null>(null);
  const [categories, setCategories] = useState<RunCategory[]>([]);

  useEffect(() => {
    const profileSyncTimer = window.setTimeout(() => {
      setFullName(profile?.full_name || '');
      setMobile(profile?.mobile || '');
      setLocality(profile?.locality || '');
    }, 0);
    return () => window.clearTimeout(profileSyncTimer);
  }, [profile]);

  useEffect(() => {
    if (!user?.id) return;
    let active = true;
    void (async () => {
      try {
        const edition = await getCurrentEdition();
        const { event, categories: categoryList } = await getRunEventAndCategories(edition.id);
        const state = await getUserRegistration(event.id, user.id);
        if (!active) return;
        setRunEvent(event);
        setCategories(categoryList);
        setRegistrationState(state);
      } catch (error: unknown) {
        if (active) toast(error instanceof Error ? error.message : 'Unable to load your run registration.', 'error');
      }
    })();
    return () => { active = false; };
  }, [user?.id, toast]);

  if (authLoading) {
    return (
      <div style={{ minHeight: '50vh', display: 'grid', placeItems: 'center' }}>
        <LoadingState message="Loading your runner account…" />
      </div>
    );
  }

  if (!user && !isDemoAdmin) {
    return <Navigate to="/runner/login?next=/account" replace />;
  }

  async function handleSave(e: FormEvent) {
    e.preventDefault();
    if (!supabase || !user) {
      toast('Sign in with a runner account to update your profile.', 'error');
      return;
    }
    setSaving(true);
    try {
      const { error } = await supabase.from('profiles').upsert({
        id: user.id,
        full_name: fullName.trim() || null,
        mobile: mobile.trim() || null,
        locality: locality.trim() || null,
      });
      if (error) throw error;
      await refresh();
      toast('Account details saved.', 'success');
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to save profile.', 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <section className="section">
      <div className="container narrow">
        <p className="eyebrow">Sinoog Run account</p>
        <h1 style={{ fontFamily: 'Fraunces, serif', marginBottom: '0.5rem' }}>My runner profile</h1>
        <p style={{ color: 'var(--muted)', marginBottom: '1.5rem' }}>
          {user?.email || (isDemoAdmin ? 'Demo session' : '')}
        </p>

        <div className="admin-panel" style={{ padding: '1.25rem', marginBottom: '1.5rem' }}>
          <form onSubmit={(e) => void handleSave(e)} style={{ display: 'grid', gap: '1rem' }}>
            <label>
              Full name
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                autoComplete="name"
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
              />
            </label>
            <label>
              Mobile number
              <input
                type="tel"
                value={mobile}
                onChange={(e) => setMobile(e.target.value)}
                autoComplete="tel"
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
              />
            </label>
            <label>
              Address
              <input
                type="text"
                value={locality}
                onChange={(e) => setLocality(e.target.value)}
                autoComplete="street-address"
                placeholder="House/Street, Barangay, Municipality, Province"
                style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
              />
            </label>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <Button type="submit" disabled={saving || isDemoAdmin}>
                {saving ? 'Saving…' : 'Save profile'}
              </Button>
              <Button type="button" variant="secondary" to="/run/register">
                Run registration
              </Button>
              {isAdmin && (
                <Button type="button" variant="ghost" to="/admin">
                  Committee workspace
                </Button>
              )}
            </div>
          </form>
        </div>

        {registrationState.registration && (() => {
          const registration = registrationState.registration;
          const category = categories.find((item) => item.id === registration.category_id);
          const termsConsent = registrationState.consents.find((item) => item.consent_type === 'terms');
          const privacyConsent = registrationState.consents.find((item) => item.consent_type === 'privacy');
          const guardianConsent = registrationState.consents.find((item) => item.consent_type === 'guardian');
          return (
            <section className="runner-account-registration" aria-labelledby="runner-registration-details">
              <div className="runner-account-registration__heading">
                <div>
                  <p className="eyebrow">Sinoog Run 2027</p>
                  <h2 id="runner-registration-details">My registration details</h2>
                  <p>{registration.reference}</p>
                </div>
                <StatusBadge tone={registration.status === 'approved' ? 'success' : registration.status === 'rejected' ? 'danger' : 'warning'}>{registration.status}</StatusBadge>
              </div>

              <dl className="runner-account-details">
                <div><dt>Category</dt><dd>{category?.name || 'Sinoog Run'}</dd></div>
                <div><dt>Registration fee</dt><dd>{(registration.fee_centavos / 100).toLocaleString('en-PH', { style: 'currency', currency: registration.currency })}</dd></div>
                <div><dt>Participant name</dt><dd>{registration.participant_name}</dd></div>
                <div><dt>Registration email</dt><dd>{registration.registration_email || user?.email || 'Not available'}</dd></div>
                <div><dt>Division</dt><dd>{registration.division === 'female' ? 'Female' : registration.division === 'male' ? 'Male' : 'Not provided'}</dd></div>
                <div><dt>Birth date</dt><dd>{registration.birth_date || 'Not provided'}</dd></div>
                <div><dt>Mobile number</dt><dd>{registration.mobile}</dd></div>
                <div className="runner-account-details__wide"><dt>Address</dt><dd>{registration.locality || 'Not provided'}</dd></div>
                <div><dt>Shirt size</dt><dd>{registration.shirt_size || 'Not provided'}</dd></div>
                <div><dt>Club / team</dt><dd>{registration.club_name || 'None'}</dd></div>
                <div><dt>Emergency contact</dt><dd>{registration.emergency_name}</dd></div>
                <div><dt>Relationship</dt><dd>{registration.emergency_relationship || 'Not provided'}</dd></div>
                <div><dt>Emergency mobile</dt><dd>{registration.emergency_mobile}</dd></div>
                <div className="runner-account-details__wide"><dt>Medical / assistance notes</dt><dd>{registration.accessibility_notes || 'None'}</dd></div>
                <div><dt>Bib number</dt><dd>{registration.bib_number ? `#${registration.bib_number}` : 'Assigned after approval'}</dd></div>
                <div><dt>Registration submitted</dt><dd>{registration.submitted_at ? new Date(registration.submitted_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'Not submitted'}</dd></div>
                <div><dt>Registration approved</dt><dd>{registration.approved_at ? new Date(registration.approved_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' }) : 'Pending approval'}</dd></div>
                <div><dt>Payment</dt><dd>{registrationState.payment ? `${registrationState.payment.method} · ${registrationState.payment.status}` : 'No payment record'}</dd></div>
                <div><dt>Official result</dt><dd>{registrationState.result ? formatElapsed(registrationState.result.elapsed_milliseconds) : 'Not recorded'}</dd></div>
                {registration.review_notes && <div className="runner-account-details__wide"><dt>Committee notes</dt><dd>{registration.review_notes}</dd></div>}
              </dl>

              <div className="runner-account-waiver">
                <h3>Waiver and privacy consent</h3>
                <p>{runEvent?.terms_body || 'The event waiver text will appear here once published by the committee.'}</p>
                <ul>
                  <li><strong>Event waiver:</strong> {termsConsent?.accepted ? `Accepted · ${termsConsent.version} · ${new Date(termsConsent.accepted_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}` : 'No acceptance recorded'}</li>
                  <li><strong>Privacy notice:</strong> {privacyConsent?.accepted ? `Accepted · ${privacyConsent.version} · ${new Date(privacyConsent.accepted_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}` : 'No acceptance recorded'}</li>
                  {guardianConsent && <li><strong>Parent / guardian consent:</strong> {guardianConsent.accepted ? `Accepted · ${guardianConsent.version} · ${new Date(guardianConsent.accepted_at).toLocaleString('en-PH', { timeZone: 'Asia/Manila' })}` : 'No acceptance recorded'}</li>}
                </ul>
              </div>
            </section>
          );
        })()}

        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
          <Link to="/run">Sinoog Run details</Link>
          <button type="button" className="button button--ghost" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </div>
    </section>
  );
}
