/**
 * Sinoog 2027 — Sinoog Run Registration Page (P1-011 M3 upgrade)
 *
 * Implements the 4-step runner registration wizard, payment proof submission,
 * status tracking, QR pass display, and singlet size chart dialog.
 *
 * Upgraded to use M3 components:
 *  - Button (filled, tonal, outlined, text)
 *  - TextField, SelectField, TextArea, Checkbox
 *  - Dialog (singlet size chart)
 *  - InlineMessage (form validation and error feedback)
 *
 * All business logic, eligibility checks, Supabase calls, and state transitions
 * are strictly preserved with 100% payload parity.
 */

import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  ArrowRight,
  AlertCircle,
  FileCheck,
  QrCode,
  ArrowLeft,
  Upload,
  Lock,
  Copy,
  Check,
  Ruler,
} from 'lucide-react';
import { PageHero } from '../../components/PageHero';
import { Button } from '../../components/Button';
import { TextField } from '../../components/m3/TextField';
import { SelectField } from '../../components/m3/SelectField';
import { TextArea } from '../../components/m3/TextArea';
import { Checkbox } from '../../components/m3/Checkbox';
import { Dialog } from '../../components/m3/Dialog';
import { LoadingState, InlineMessage } from '../../features/ui/FeedbackStates';
import { StatusBadge } from '../../components/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import {
  getRunEventAndCategories,
  getUserRegistration,
  deleteRejectedRegistration,
  submitRegistration,
  submitPaymentEvidence,
  getCashPaymentReceivers,
  getRunnerQrValue,
  EMERGENCY_RELATIONSHIPS,
  type RunCategory,
  type RunEvent,
  type UserRegistrationState,
  type CashPaymentReceiver,
  type ManualPaymentMethod,
} from '../../features/run/runQueries';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { useAuth } from '../../features/auth/useAuth';
import { useToast } from '../../features/ui/useToast';
import { supabase } from '../../lib/supabase';

function ageOnDate(birthDate: string, eventDate: string): number | null {
  if (!birthDate || !eventDate) return null;
  const birth = new Date(`${birthDate}T00:00:00Z`);
  const event = new Date(`${eventDate.slice(0, 10)}T00:00:00Z`);
  if (Number.isNaN(birth.getTime()) || Number.isNaN(event.getTime())) return null;
  let age = event.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    event.getUTCMonth() < birth.getUTCMonth() ||
    (event.getUTCMonth() === birth.getUTCMonth() && event.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) age -= 1;
  return age;
}

export function RunRegistrationPage() {
  const { user, profile, isDemoAdmin, refresh } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [runEvent, setRunEvent] = useState<RunEvent | null>(null);
  const [categories, setCategories] = useState<RunCategory[]>([]);
  const [userState, setUserState] = useState<UserRegistrationState>({
    registration: null,
    payment: null,
    consents: [],
  });

  // Wizard Step
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Form Fields
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [participantName, setParticipantName] = useState('');
  const [division, setDivision] = useState<'male' | 'female'>('male');
  const [mobile, setMobile] = useState('');
  const [locality, setLocality] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [shirtSize, setShirtSize] = useState('M');
  const [sizeChartOpen, setSizeChartOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [clubName, setClubName] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyMobile, setEmergencyMobile] = useState('');
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [acceptedWaiver, setAcceptedWaiver] = useState(false);
  const [acceptedGuardianConsent, setAcceptedGuardianConsent] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Payment Form Fields
  const [payerReference, setPayerReference] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<ManualPaymentMethod>('GCash');
  const [cashReceiverId, setCashReceiverId] = useState('');
  const [cashReceivers, setCashReceivers] = useState<CashPaymentReceiver[]>([]);
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);
  const [restartingRegistration, setRestartingRegistration] = useState(false);

  const activeUserId = user?.id || (isDemoAdmin ? 'demo-user-123' : null);
  const profileName =
    profile?.full_name ||
    (typeof user?.user_metadata?.full_name === 'string' ? user.user_metadata.full_name : '');
  const profileMobile = profile?.mobile || '';
  const profileAddress = profile?.locality || '';

  useEffect(() => {
    let mounted = true;
    void (async () => {
      try {
        const ed = await getCurrentEdition();
        if (!mounted) return;
        const { event: rEvent, categories: rCats } = await getRunEventAndCategories(ed.id);
        if (!mounted) return;
        const now = Date.now();
        setRegistrationOpen(
          ed.registration_open &&
            (!rEvent.registration_opens_at ||
              now >= new Date(rEvent.registration_opens_at).getTime()) &&
            (!rEvent.registration_closes_at ||
              now <= new Date(rEvent.registration_closes_at).getTime())
        );
        setRunEvent(rEvent);
        setCategories(rCats);
        if (activeUserId) {
          try {
            const receivers = await getCashPaymentReceivers();
            if (!mounted) return;
            setCashReceivers(receivers);
            setCashReceiverId((current) => current || receivers[0]?.user_id || '');
          } catch (receiverError) {
            console.warn('Cash receiver list is not available yet:', receiverError);
          }
        }
        if (rCats.length > 0) {
          setSelectedCategoryId(rCats[0].id);
        }

        if (activeUserId) {
          const regState = await getUserRegistration(rEvent.id, activeUserId);
          if (!mounted) return;
          setUserState(regState);
          if (regState.registration) {
            setParticipantName(regState.registration.participant_name);
          } else {
            setParticipantName(profileName);
            setMobile(profileMobile);
            setLocality(profileAddress);
          }
        }
      } catch (err: unknown) {
        if (!mounted) return;
        console.error('Failed to load run registration data:', err);
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [activeUserId, profileName, profileMobile, profileAddress]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];
  const ageAtRace = ageOnDate(birthDate, runEvent?.race_starts_at || '2027-01-09');
  const requiresGuardianConsent = ageAtRace !== null && ageAtRace < 18;

  const handleRegisterAgain = async () => {
    const registration = userState.registration;
    if (!registration || registration.status !== 'rejected') return;
    if (
      !window.confirm(
        'Remove this rejected entry and start a new registration? Your previous payment proof will also be removed.'
      )
    )
      return;

    try {
      setRestartingRegistration(true);
      await deleteRejectedRegistration(registration.id);
      setUserState({ registration: null, payment: null, consents: [] });
      setSelectedCategoryId(registration.category_id);
      setStep(1);
      toast('Your rejected entry was cleared. You can register again now.', 'success');
    } catch (error: unknown) {
      toast(error instanceof Error ? error.message : 'Unable to restart registration.', 'error');
    } finally {
      setRestartingRegistration(false);
    }
  };

  const handleNextToStep2 = () => {
    if (!selectedCategoryId) {
      setFormError('Please select a distance category.');
      return;
    }
    setFormError(null);
    setStep(2);
  };

  const handleNextToStep3 = () => {
    if (!participantName.trim() || !mobile.trim() || !locality.trim() || !birthDate) {
      setFormError('Please fill in all required participant details.');
      return;
    }
    setFormError(null);
    setStep(3);
  };

  const handleNextToStep4 = () => {
    if (!emergencyName.trim() || !emergencyRelationship.trim() || !emergencyMobile.trim()) {
      setFormError('Emergency contact information is required for safety.');
      return;
    }
    setFormError(null);
    setStep(4);
  };

  const handleRegistrationSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!acceptedWaiver) {
      setFormError('You must accept the event waiver and terms of participation.');
      return;
    }
    if (requiresGuardianConsent && !acceptedGuardianConsent) {
      setFormError(
        'A parent or legal guardian must accept the guardian consent for a runner under 18.'
      );
      return;
    }
    if (!activeUserId) {
      setFormError('You must sign in or create an account to submit your registration.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

      if (supabase && user) {
        const { error: profileError } = await supabase.from('profiles').upsert({
          id: user.id,
          full_name: participantName.trim() || null,
          mobile: mobile.trim() || null,
          locality: locality.trim() || null,
        });
        if (profileError)
          throw new Error(`Unable to update your runner profile: ${profileError.message}`);
        await refresh();
      }

      const reg = await submitRegistration({
        run_event_id: selectedCategory.run_event_id,
        category_id: selectedCategory.id,
        participant_name: participantName.trim(),
        division,
        birth_date: birthDate,
        mobile: mobile.trim(),
        locality: locality.trim(),
        shirt_size: shirtSize,
        club_name: clubName.trim() || null,
        emergency_name: emergencyName.trim(),
        emergency_relationship: emergencyRelationship.trim(),
        emergency_mobile: emergencyMobile.trim(),
        accessibility_notes: accessibilityNotes.trim() || null,
        guardian_consent: requiresGuardianConsent,
      });

      toast(`Registration submitted! Reference: ${reg.reference}`, 'success');
      // Refresh state
      const updated = await getUserRegistration(selectedCategory.run_event_id, activeUserId);
      setUserState(updated);
    } catch (err: unknown) {
      console.error('Registration failed:', err);
      setFormError(err instanceof Error ? err.message : 'Registration failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePaymentFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setPaymentFile(e.target.files[0]);
    }
  };

  const handlePaymentProofSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!userState.payment) return;
    if (paymentMethod === 'GCash' && !payerReference.trim()) {
      toast('Please enter the transaction reference number from your receipt.', 'error');
      return;
    }
    if (paymentMethod === 'Cash' && !cashReceiverId) {
      toast('Please select the administrator who received your cash payment.', 'error');
      return;
    }
    if (!paymentFile) {
      toast('Please attach your payment screenshot or proof file.', 'error');
      return;
    }

    try {
      setUploadingProof(true);
      const compression = await submitPaymentEvidence(
        userState.payment.id,
        activeUserId || 'guest',
        {
          method: paymentMethod,
          payerReference: payerReference.trim(),
          receivedBy: cashReceiverId,
        },
        paymentFile
      );
      toast(
        `Payment proof compressed to ${Math.max(
          1,
          Math.round(compression.compressedBytes / 1024)
        )} KB and submitted.`,
        'success'
      );
      if (selectedCategory) {
        const updated = await getUserRegistration(
          selectedCategory.run_event_id,
          activeUserId || 'guest'
        );
        setUserState(updated);
      }
      setPaymentFile(null);
      setPayerReference('');
    } catch (err: unknown) {
      console.error('Payment upload failed:', err);
      toast(err instanceof Error ? err.message : 'Failed to upload proof.', 'error');
    } finally {
      setUploadingProof(false);
    }
  };

  const copyText = async (key: string, value: string) => {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(
        () => setCopiedKey((current) => (current === key ? null : current)),
        2000
      );
    } catch {
      toast('Unable to copy. Please select the text manually.', 'error');
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: '60vh', display: 'grid', placeItems: 'center' }}>
        <LoadingState message="Loading Sinoog Run registration portal…" />
      </div>
    );
  }

  // View 1: User is already registered
  if (userState.registration) {
    const reg = userState.registration;
    const cat = categories.find((c) => c.id === reg.category_id) || categories[0];
    const feeFormatted = (reg.fee_centavos / 100).toLocaleString('en-PH', {
      style: 'currency',
      currency: 'PHP',
    });
    const qrValue = getRunnerQrValue(reg);

    return (
      <>
        <PageHero
          eyebrow="Sinoog Run 2027 · Registration Confirmed"
          title="My Registration"
          description={`Your entry reference is ${reg.reference}. Track your verification and claim details below.`}
        />

        <section className="section">
          <div className="container narrow">
            <div
              style={{
                background: '#fff',
                border: '1px solid var(--line)',
                borderRadius: '8px',
                padding: '2rem',
                boxShadow: 'var(--shadow)',
                marginBottom: '2rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  borderBottom: '1px solid #eee',
                  paddingBottom: '1rem',
                  marginBottom: '1.5rem',
                  flexWrap: 'wrap',
                  gap: '1rem',
                }}
              >
                <div>
                  <small
                    style={{
                      color: 'var(--muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.1em',
                    }}
                  >
                    Registration Reference
                  </small>
                  <div className="copy-field">
                    <h2
                      style={{
                        fontSize: '1.8rem',
                        color: 'var(--wine)',
                        margin: 0,
                        fontFamily: 'monospace',
                      }}
                    >
                      {reg.reference}
                    </h2>
                    <button
                      type="button"
                      className="copy-field__btn"
                      onClick={() => void copyText('reference', reg.reference)}
                      aria-label="Copy registration reference"
                    >
                      {copiedKey === 'reference' ? <Check size={16} /> : <Copy size={16} />}
                      {copiedKey === 'reference' ? 'Copied' : 'Copy'}
                    </button>
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusBadge
                    tone={
                      reg.status === 'approved'
                        ? 'success'
                        : reg.status === 'rejected'
                          ? 'danger'
                          : 'warning'
                    }
                  >
                    Entry: {reg.status}
                  </StatusBadge>
                  {userState.payment && (
                    <StatusBadge
                      tone={
                        userState.payment.status === 'verified'
                          ? 'success'
                          : userState.payment.status === 'submitted'
                            ? 'warning'
                            : 'danger'
                      }
                    >
                      Payment: {userState.payment.status}
                    </StatusBadge>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Participant
                  </strong>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {reg.participant_name}
                  </span>
                </div>

                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Distance Category
                  </strong>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>
                    {cat?.name || 'Sinoog Run'}
                  </span>
                </div>

                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Official Kit Shirt
                  </strong>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Size {reg.shirt_size}</span>
                </div>

                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)' }}>
                    Registration Fee
                  </strong>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--wine)' }}>
                    {feeFormatted}
                  </span>
                </div>
              </div>

              {reg.status === 'approved' && (
                <div className="runner-pass">
                  <div className="runner-pass__details">
                    <small>Official four-digit runner number</small>
                    <strong>{reg.bib_number || 'Pending'}</strong>
                    <h3>Registration approved</h3>
                    <p>
                      Present this runner number and QR code during race-kit claiming and event
                      recording.
                    </p>
                  </div>
                  {qrValue ? (
                    <div
                      className="runner-pass__qr"
                      aria-label={`QR code for runner ${reg.bib_number}`}
                    >
                      <QRCodeSVG value={qrValue} size={144} level="H" marginSize={2} />
                    </div>
                  ) : (
                    <QrCode size={48} aria-hidden="true" />
                  )}
                </div>
              )}

              {reg.status === 'rejected' && (
                <div className="registration-retry-panel">
                  <AlertCircle size={22} aria-hidden="true" />
                  <div>
                    <h3>Registration was rejected</h3>
                    <p>
                      {reg.review_notes ||
                        'Review the required details, then start a new registration when ready.'}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="filled"
                    disabled={restartingRegistration}
                    loading={restartingRegistration}
                    onClick={() => void handleRegisterAgain()}
                  >
                    Register again
                  </Button>
                </div>
              )}

              {userState.result && (
                <div className="runner-result-card">
                  <div>
                    <small>Official finish time</small>
                    <strong>
                      {Math.floor(userState.result.elapsed_milliseconds / 3600000)
                        .toString()
                        .padStart(2, '0')}
                      :
                      {Math.floor((userState.result.elapsed_milliseconds % 3600000) / 60000)
                        .toString()
                        .padStart(2, '0')}
                      :
                      {Math.floor((userState.result.elapsed_milliseconds % 60000) / 1000)
                        .toString()
                        .padStart(2, '0')}
                    </strong>
                  </div>
                  <div>
                    <small>{reg.division === 'female' ? 'Female' : 'Male'} division place</small>
                    <strong>#{userState.result.division_rank}</strong>
                  </div>
                  <div>
                    <small>Category place</small>
                    <strong>#{userState.result.category_rank}</strong>
                  </div>
                  <div>
                    <small>Overall place</small>
                    <strong>#{userState.result.overall_rank}</strong>
                  </div>
                </div>
              )}

              {/* Payment Action Section */}
              {userState.payment && userState.payment.status !== 'verified' && (
                <div
                  style={{
                    background: '#fcfbf7',
                    border: '1px solid #e7ded4',
                    borderRadius: '8px',
                    padding: '1.5rem',
                    marginTop: '2rem',
                  }}
                >
                  <h3
                    style={{
                      fontFamily: 'Fraunces, serif',
                      fontSize: '1.3rem',
                      margin: '0 0 0.5rem',
                    }}
                  >
                    Payment Verification
                  </h3>
                  <p style={{ fontSize: '0.92rem', color: '#555', marginBottom: '1.25rem' }}>
                    {userState.payment.status === 'submitted'
                      ? 'Payment evidence submitted! The committee is reviewing your transaction.'
                      : 'Please settle your registration fee using one of the approved manual payment methods below.'}
                  </p>

                  {userState.payment.status === 'submitted' ? (
                    <div
                      style={{
                        padding: '1rem',
                        background: '#e6fffa',
                        border: '1px solid #b2f5ea',
                        borderRadius: '6px',
                        color: '#234e52',
                        fontSize: '0.9rem',
                      }}
                    >
                      <p style={{ margin: 0 }}>
                        <strong>Reference:</strong> {userState.payment.payer_reference || 'N/A'} (
                        {userState.payment.method})
                      </p>
                      <p style={{ margin: '0.25rem 0 0' }}>
                        Your registration will be approved once payment is reconciled with committee
                        records.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div
                        style={{
                          background: '#fff',
                          border: '1px solid var(--line)',
                          borderRadius: '6px',
                          padding: '1rem',
                          marginBottom: '1.25rem',
                        }}
                      >
                        <h4 style={{ margin: '0 0 0.5rem', fontSize: '0.95rem' }}>
                          Payment Instructions
                        </h4>
                        <ul
                          style={{
                            margin: 0,
                            paddingLeft: '1.2rem',
                            fontSize: '0.88rem',
                            color: '#444',
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '0.35rem',
                          }}
                        >
                          {paymentMethod === 'GCash' && runEvent?.gcash_number && (
                            <li>
                              <strong>GCash number:</strong> {runEvent.gcash_number}{' '}
                              <Button
                                type="button"
                                variant="text"
                                size="small"
                                onClick={() => void copyText('gcash', runEvent.gcash_number || '')}
                                aria-label="Copy GCash number"
                              >
                                {copiedKey === 'gcash' ? 'Copied' : 'Copy'}
                              </Button>
                            </li>
                          )}
                          {paymentMethod === 'GCash' && runEvent?.gcash_account_name && (
                            <li>
                              <strong>Account name:</strong> {runEvent.gcash_account_name}
                            </li>
                          )}
                          <li>
                            <strong>Amount:</strong> {feeFormatted}
                          </li>
                          {paymentMethod === 'Cash' && (
                            <li>Ask for a receipt and upload a clear photo as proof.</li>
                          )}
                        </ul>
                      </div>

                      <form
                        onSubmit={(e) => void handlePaymentProofSubmit(e)}
                        style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}
                      >
                        <div
                          className="responsive-two-column"
                          style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                        >
                          <SelectField
                            label="Payment Method"
                            value={paymentMethod}
                            onChange={(e) =>
                              setPaymentMethod(e.target.value as ManualPaymentMethod)
                            }
                          >
                            <option value="GCash">GCash</option>
                            <option value="Cash">Cash</option>
                          </SelectField>

                          {paymentMethod === 'GCash' ? (
                            <TextField
                              label="Reference / Transaction ID"
                              required
                              placeholder="e.g. 1002348921"
                              value={payerReference}
                              onChange={(e) => setPayerReference(e.target.value)}
                            />
                          ) : (
                            <SelectField
                              label="Cash received by"
                              required
                              value={cashReceiverId}
                              onChange={(e) => setCashReceiverId(e.target.value)}
                            >
                              <option value="">Select administrator</option>
                              {cashReceivers.map((receiver) => (
                                <option key={receiver.user_id} value={receiver.user_id}>
                                  {receiver.full_name}
                                </option>
                              ))}
                            </SelectField>
                          )}
                        </div>

                        <div>
                          <label
                            style={{
                              display: 'block',
                              fontWeight: 600,
                              fontSize: 'var(--md-sys-typescale-label-large-size)',
                              color: 'var(--md-sys-color-on-surface-variant)',
                              marginBottom: 'var(--md-space-1)',
                            }}
                          >
                            {paymentMethod === 'GCash'
                              ? 'GCash Screenshot'
                              : 'Proof of Cash Payment'}{' '}
                            <span style={{ color: 'var(--md-sys-color-error)' }}>*</span>
                          </label>
                          <input
                            type="file"
                            required
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePaymentFileChange}
                            style={{ width: '100%', padding: '0.5rem 0', fontSize: '0.88rem' }}
                          />
                        </div>

                        <Button
                          type="submit"
                          variant="filled"
                          disabled={uploadingProof}
                          loading={uploadingProof}
                          leadingIcon={<Upload size={16} />}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          Submit payment for verification
                        </Button>
                      </form>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </section>
      </>
    );
  }

  // View 2: Registration Closed by Committee
  if (!registrationOpen) {
    return (
      <>
        <PageHero
          eyebrow="Sinoog Run 2027"
          title="Registration Opens Soon"
          description="Prepare for the opening community run on January 9, 2027 in Guinacot, Guindulman, Bohol."
        />
        <section className="section">
          <div className="container narrow">
            <div className="notice" style={{ marginBottom: '2rem' }}>
              <CheckCircle2 size={24} />
              <span>
                <strong>Official registration is currently scheduled to open soon.</strong> The
                committee is finalizing the participant categories, timing systems, kit inclusions,
                and route safety.
              </span>
            </div>

            <h2
              style={{
                fontFamily: 'Fraunces, serif',
                fontSize: '1.75rem',
                marginBottom: '1.25rem',
              }}
            >
              Category Preview
            </h2>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
                gap: '1.25rem',
                marginBottom: '2.5rem',
              }}
            >
              {categories.map((c) => {
                const feeFormatted = (c.fee_centavos / 100).toLocaleString('en-PH', {
                  style: 'currency',
                  currency: 'PHP',
                });
                return (
                  <div
                    key={c.id}
                    style={{
                      background: '#fff',
                      border: '1px solid var(--line)',
                      padding: '1.5rem',
                      borderRadius: '6px',
                    }}
                  >
                    <span className="activity-type activity-type--run">
                      {c.distance_meters / 1000} KM
                    </span>
                    <h3
                      style={{
                        fontFamily: 'Fraunces, serif',
                        fontSize: '1.3rem',
                        margin: '0.5rem 0 0.25rem',
                      }}
                    >
                      {c.name}
                    </h3>
                    <p
                      style={{
                        color: 'var(--wine)',
                        fontWeight: 700,
                        fontSize: '1.2rem',
                        margin: '0.25rem 0 0.75rem',
                      }}
                    >
                      {feeFormatted}
                    </p>
                    <small
                      style={{ color: 'var(--muted)', display: 'block', fontSize: '0.84rem' }}
                    >
                      {c.kit_description}
                    </small>
                  </div>
                );
              })}
            </div>

            <div className="step-list">
              {[
                'Select your category',
                'Enter participant details',
                'Accept the event waiver',
                'Submit payment',
                'Receive race bib & kit',
              ].map((x, i) => (
                <div key={x}>
                  <span>{i + 1}</span>
                  <p>{x}</p>
                  {i < 4 && <i />}
                </div>
              ))}
            </div>
          </div>
        </section>
      </>
    );
  }

  // View 3: Registration is Open! Multi-step registration form
  return (
    <>
      <PageHero
        eyebrow="Sinoog Run · January 9, 2027"
        title="Runner Registration"
        description="Fill out the official entry form to participate in Sinoog Run 2027."
      />

      <section className="section">
        <div className="container narrow">
          {!user && !isDemoAdmin && (
            <div
              style={{
                background: '#fef3c7',
                border: '1px solid #fde68a',
                borderRadius: '6px',
                padding: '1rem 1.25rem',
                marginBottom: '1.5rem',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                flexWrap: 'wrap',
                gap: '0.75rem',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  color: '#92400e',
                  fontSize: '0.92rem',
                }}
              >
                <Lock size={18} />
                <span>Sign in to track your bib and payment under your account.</span>
              </div>
              <Button to="/signin" variant="outlined" size="small">
                Sign in first
              </Button>
            </div>
          )}

          {/* Stepper Header */}
          <ol
            className="registration-stepper registration-stepper--pills"
            aria-label="Registration progress"
          >
            {[
              { n: 1 as const, label: 'Distance' },
              { n: 2 as const, label: 'Runner Info' },
              { n: 3 as const, label: 'Emergency' },
              { n: 4 as const, label: 'Review & Waiver' },
            ].map((item) => (
              <li
                key={item.n}
                className={step === item.n ? 'is-active' : step > item.n ? 'is-done' : ''}
                aria-current={step === item.n ? 'step' : undefined}
              >
                <span className="registration-stepper__num">{item.n}</span>
                <span className="registration-stepper__label">{item.label}</span>
              </li>
            ))}
          </ol>

          {formError && (
            <div style={{ marginBottom: '1.25rem' }}>
              <InlineMessage tone="error">{formError}</InlineMessage>
            </div>
          )}

          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div>
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                Select Your Category
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                {categories.map((c) => {
                  const feeFormatted = (c.fee_centavos / 100).toLocaleString('en-PH', {
                    style: 'currency',
                    currency: 'PHP',
                  });
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <button
                      type="button"
                      key={c.id}
                      className="registration-category-option"
                      onClick={() => setSelectedCategoryId(c.id)}
                      aria-pressed={isSelected}
                      style={{
                        width: '100%',
                        textAlign: 'left',
                        color: 'inherit',
                        padding: '1.25rem',
                        borderRadius: '8px',
                        border: isSelected ? '2px solid var(--wine)' : '1px solid var(--line)',
                        background: isSelected ? '#faf5f2' : '#fff',
                        cursor: 'pointer',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <div>
                        <span className="activity-type activity-type--run">
                          {c.distance_meters / 1000} KM
                        </span>
                        <h3
                          style={{
                            margin: '0.35rem 0',
                            fontFamily: 'Fraunces, serif',
                            fontSize: '1.2rem',
                          }}
                        >
                          {c.name}
                        </h3>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>
                          {c.kit_description}
                        </p>
                      </div>
                      <div
                        className="registration-category-option__price"
                        style={{ textAlign: 'right', minWidth: '100px' }}
                      >
                        <span
                          style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--wine)' }}
                        >
                          {feeFormatted}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                          {c.capacity ? `${c.capacity} slots cap` : 'Open capacity'}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <Button
                  type="button"
                  variant="filled"
                  onClick={handleNextToStep2}
                >
                  Next: Participant Info <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Participant Details */}
          {step === 2 && (
            <div>
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                Participant Details
              </h2>
              <div className="notice" style={{ marginTop: 0, marginBottom: '1.25rem' }}>
                <CheckCircle2 size={18} />
                <span>
                  <strong>Loaded from your runner profile</strong>
                  Your name, mobile number, and address are reused here. Any correction you make
                  will also update your profile.
                </span>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                <TextField
                  label="Full Participant Name"
                  required
                  placeholder="e.g. Maria Clara Santos"
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                />

                <div
                  className="responsive-two-column"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                >
                  <TextField
                    label="Mobile Phone Number"
                    type="tel"
                    required
                    placeholder="0912 345 6789"
                    value={mobile}
                    onChange={(e) => setMobile(e.target.value)}
                  />

                  <TextField
                    label="Birth Date"
                    type="date"
                    required
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                  />
                </div>

                <SelectField
                  label="Race Division"
                  required
                  value={division}
                  onChange={(e) => setDivision(e.target.value as 'male' | 'female')}
                  helperText="Used only for official race results and awarding rankings."
                >
                  <option value="male">Male</option>
                  <option value="female">Female</option>
                </SelectField>

                <div
                  className="responsive-two-column"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                >
                  <TextField
                    label="Address"
                    required
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    placeholder="House/Street, Barangay, Municipality, Province"
                  />

                  <div>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'flex-end',
                        marginBottom: '0.25rem',
                      }}
                    >
                      <Button
                        type="button"
                        variant="text"
                        size="small"
                        leadingIcon={<Ruler size={14} aria-hidden />}
                        onClick={() => setSizeChartOpen(true)}
                      >
                        Size chart
                      </Button>
                    </div>
                    <SelectField
                      label="Event Singlet / Shirt Size"
                      value={shirtSize}
                      onChange={(e) => setShirtSize(e.target.value)}
                    >
                      <option value="XS">Extra Small (XS)</option>
                      <option value="S">Small (S)</option>
                      <option value="M">Medium (M)</option>
                      <option value="L">Large (L)</option>
                      <option value="XL">Extra Large (XL)</option>
                      <option value="2XL">Double Extra Large (2XL)</option>
                    </SelectField>
                  </div>
                </div>

                <TextField
                  label="Running Club or Organization (Optional)"
                  placeholder="e.g. Bohol Runners Club"
                  value={clubName}
                  onChange={(e) => setClubName(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  type="button"
                  variant="outlined"
                  leadingIcon={<ArrowLeft size={16} />}
                  onClick={() => setStep(1)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="filled"
                  onClick={handleNextToStep3}
                >
                  Next: Emergency Contact <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact Details */}
          {step === 3 && (
            <div>
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                Emergency Contact Details
              </h2>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '1rem',
                  marginBottom: '2rem',
                }}
              >
                <TextField
                  label="Contact Person Full Name"
                  required
                  placeholder="e.g. Juan Santos"
                  value={emergencyName}
                  onChange={(e) => setEmergencyName(e.target.value)}
                />

                <div
                  className="responsive-two-column"
                  style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}
                >
                  <SelectField
                    label="Relationship"
                    required
                    value={emergencyRelationship}
                    onChange={(e) => setEmergencyRelationship(e.target.value)}
                  >
                    <option value="">Select relationship</option>
                    {EMERGENCY_RELATIONSHIPS.map((relationship) => (
                      <option key={relationship} value={relationship}>
                        {relationship}
                      </option>
                    ))}
                  </SelectField>

                  <TextField
                    label="Emergency Mobile Number"
                    type="tel"
                    required
                    placeholder="0919 876 5432"
                    value={emergencyMobile}
                    onChange={(e) => setEmergencyMobile(e.target.value)}
                  />
                </div>

                <TextArea
                  label="Medical Conditions or Assistance Requests (Confidential)"
                  rows={2}
                  placeholder="Any allergies, asthma, or medical notes for emergency responders…"
                  value={accessibilityNotes}
                  onChange={(e) => setAccessibilityNotes(e.target.value)}
                />
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  type="button"
                  variant="outlined"
                  leadingIcon={<ArrowLeft size={16} />}
                  onClick={() => setStep(2)}
                >
                  Back
                </Button>
                <Button
                  type="button"
                  variant="filled"
                  onClick={handleNextToStep4}
                >
                  Next: Review &amp; Waiver <ArrowRight size={16} />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Review, Waiver & Submit */}
          {step === 4 && (
            <form onSubmit={(e) => void handleRegistrationSubmit(e)}>
              <h2
                style={{
                  fontFamily: 'Fraunces, serif',
                  fontSize: '1.5rem',
                  marginBottom: '1rem',
                }}
              >
                Review &amp; Participation Agreement
              </h2>

              <div
                style={{
                  background: '#faf8f4',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  padding: '1.25rem',
                  marginBottom: '1.5rem',
                }}
              >
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem' }}>Summary</h3>
                <div
                  className="responsive-two-column"
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 1fr',
                    gap: '0.75rem',
                    fontSize: '0.92rem',
                  }}
                >
                  <div>
                    <strong>Runner:</strong> {participantName}
                  </div>
                  <div>
                    <strong>Category:</strong> {selectedCategory.name}
                  </div>
                  <div>
                    <strong>Division:</strong> {division === 'female' ? 'Female' : 'Male'}
                  </div>
                  <div>
                    <strong>Mobile:</strong> {mobile}
                  </div>
                  <div>
                    <strong>Shirt Size:</strong> {shirtSize}
                  </div>
                  <div>
                    <strong>Address:</strong> {locality}
                  </div>
                  <div>
                    <strong>Fee:</strong>{' '}
                    {(selectedCategory.fee_centavos / 100).toLocaleString('en-PH', {
                      style: 'currency',
                      currency: 'PHP',
                    })}
                  </div>
                </div>
              </div>

              <div
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: '6px',
                  padding: '1rem',
                  maxHeight: '220px',
                  overflowY: 'auto',
                  fontSize: '0.85rem',
                  color: '#555',
                  marginBottom: '1.25rem',
                }}
              >
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>
                  PARTICIPANT WAIVER &amp; RELEASE OF LIABILITY
                </p>
                <p>
                  {runEvent?.terms_body ||
                    'I confirm my fitness, accept the ordinary risks of the event, will follow safety instructions, and authorize reasonable emergency assistance.'}
                </p>
                <p>
                  {runEvent?.privacy_body ||
                    'I consent to the use of my registration information for event operations, safety, payment review, bib and QR allocation, timing, results, and audit.'}
                </p>
                <p>
                  Registration fees are generally non-refundable after submission or approval.
                  Duplicate payments, clear payment errors, and a full event cancellation are
                  reviewed under the committee policy.
                </p>
                <p>
                  <Link to="/terms" target="_blank">
                    Read the complete terms, waiver, guardian consent, and refund policy
                  </Link>{' '}
                  ·{' '}
                  <Link to="/privacy" target="_blank">
                    Read the privacy notice
                  </Link>
                </p>
              </div>

              <div style={{ marginBottom: '1.75rem' }}>
                <Checkbox
                  required
                  checked={acceptedWaiver}
                  onChange={(e) => setAcceptedWaiver(e.target.checked)}
                  label={
                    <span>
                      I have read and agree to the <strong>Sinoog Run Terms and Waiver</strong>,{' '}
                      <strong>Refund Policy</strong>, and <strong>Privacy Notice</strong> (version{' '}
                      {runEvent?.terms_version || '2027-v2'}).
                    </span>
                  }
                />
              </div>

              {requiresGuardianConsent && (
                <div
                  style={{
                    marginBottom: '1.75rem',
                    padding: '1rem',
                    border: '1px solid var(--gold)',
                    borderRadius: '6px',
                    background: '#fff9e8',
                  }}
                >
                  <Checkbox
                    required
                    checked={acceptedGuardianConsent}
                    onChange={(e) => setAcceptedGuardianConsent(e.target.checked)}
                    label={
                      <span>
                        <strong>Parent / legal guardian consent:</strong> I have authority to consent
                        for this runner, permit participation, accept the agreement on the runner’s
                        behalf to the extent permitted by law, authorize reasonable emergency
                        assistance, and confirm the emergency-contact information is accurate.
                      </span>
                    }
                  />
                </div>
              )}

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <Button
                  type="button"
                  variant="outlined"
                  leadingIcon={<ArrowLeft size={16} />}
                  onClick={() => setStep(3)}
                >
                  Back
                </Button>
                <Button
                  type="submit"
                  variant="filled"
                  disabled={submitting}
                  loading={submitting}
                  leadingIcon={<FileCheck size={16} />}
                >
                  Submit registration
                </Button>
              </div>
            </form>
          )}
        </div>
      </section>

      {/* Singlet size chart modal via M3 Dialog primitive */}
      <Dialog
        open={sizeChartOpen}
        title="Event singlet size guide"
        onClose={() => setSizeChartOpen(false)}
        actions={
          <Button type="button" variant="text" onClick={() => setSizeChartOpen(false)}>
            Close
          </Button>
        }
      >
        <p style={{ marginBottom: '1rem' }}>
          Choose the size that best matches your usual fit. Final kit sizing follows the supplier
          chart when published.
        </p>
        <table className="size-chart-table">
          <thead>
            <tr>
              <th>Size</th>
              <th>Chest (in)</th>
              <th>Length (in)</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>XS</td>
              <td>32–34</td>
              <td>25</td>
            </tr>
            <tr>
              <td>S</td>
              <td>34–36</td>
              <td>26</td>
            </tr>
            <tr>
              <td>M</td>
              <td>36–38</td>
              <td>27</td>
            </tr>
            <tr>
              <td>L</td>
              <td>38–40</td>
              <td>28</td>
            </tr>
            <tr>
              <td>XL</td>
              <td>40–42</td>
              <td>29</td>
            </tr>
            <tr>
              <td>2XL</td>
              <td>42–44</td>
              <td>30</td>
            </tr>
          </tbody>
        </table>
      </Dialog>
    </>
  );
}
