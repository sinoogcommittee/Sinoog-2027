import { useEffect, useState, type FormEvent, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  CheckCircle2,
  Clock,
  ArrowRight,
  AlertCircle,
  FileCheck,
  CreditCard,
  QrCode,
  ArrowLeft,
  Upload,
  Lock,
} from 'lucide-react';
import { PageHero } from '../../components/PageHero';
import {
  getRunEventAndCategories,
  getUserRegistration,
  submitRegistration,
  submitPaymentEvidence,
  type RunCategory,
  type RunEvent,
  type UserRegistrationState,
} from '../../features/run/runQueries';
import { getCurrentEdition } from '../../features/editions/editionQueries';
import { useAuth } from '../../features/auth/useAuth';
import { LoadingState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';
import { StatusBadge } from '../../components/StatusBadge';
import { QRCodeSVG } from 'qrcode.react';
import { getRunnerQrValue } from '../../features/run/runQueries';

export function RunRegistrationPage() {
  const { user, isDemoAdmin } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [registrationOpen, setRegistrationOpen] = useState(false);
  const [runEvent, setRunEvent] = useState<RunEvent | null>(null);
  const [categories, setCategories] = useState<RunCategory[]>([]);
  const [userState, setUserState] = useState<UserRegistrationState>({ registration: null, payment: null });

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
  const [clubName, setClubName] = useState('');
  const [emergencyName, setEmergencyName] = useState('');
  const [emergencyRelationship, setEmergencyRelationship] = useState('');
  const [emergencyMobile, setEmergencyMobile] = useState('');
  const [accessibilityNotes, setAccessibilityNotes] = useState('');
  const [acceptedWaiver, setAcceptedWaiver] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Payment Form Fields
  const [payerReference, setPayerReference] = useState('');
  const [paymentFile, setPaymentFile] = useState<File | null>(null);
  const [uploadingProof, setUploadingProof] = useState(false);

  const activeUserId = user?.id || (isDemoAdmin ? 'demo-user-123' : null);

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
          ed.registration_open
          && (!rEvent.registration_opens_at || now >= new Date(rEvent.registration_opens_at).getTime())
          && (!rEvent.registration_closes_at || now <= new Date(rEvent.registration_closes_at).getTime())
        );
        setRunEvent(rEvent);
        setCategories(rCats);
        if (rCats.length > 0) {
          setSelectedCategoryId(rCats[0].id);
        }

        if (activeUserId) {
          const regState = await getUserRegistration(rEvent.id, activeUserId);
          if (!mounted) return;
          setUserState(regState);
          if (regState.registration) {
            setParticipantName(regState.registration.participant_name);
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
  }, [activeUserId]);

  const selectedCategory = categories.find((c) => c.id === selectedCategoryId) || categories[0];

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
    if (!activeUserId) {
      setFormError('You must sign in or create an account to submit your registration.');
      return;
    }

    try {
      setSubmitting(true);
      setFormError(null);

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
    if (!payerReference.trim()) {
      toast('Please enter the transaction reference number from your receipt.', 'error');
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
        payerReference.trim(),
        paymentFile
      );
      toast(`Payment proof compressed to ${Math.max(1, Math.round(compression.compressedBytes / 1024))} KB and submitted.`, 'success');
      if (selectedCategory) {
        const updated = await getUserRegistration(selectedCategory.run_event_id, activeUserId || 'guest');
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
            <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '8px', padding: '2rem', boxShadow: 'var(--shadow)', marginBottom: '2rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid #eee', paddingBottom: '1rem', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                  <small style={{ color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Registration Reference</small>
                  <h2 style={{ fontSize: '1.8rem', color: 'var(--wine)', margin: 0, fontFamily: 'monospace' }}>
                    {reg.reference}
                  </h2>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <StatusBadge tone={reg.status === 'approved' ? 'success' : reg.status === 'rejected' ? 'danger' : 'warning'}>
                    Entry: {reg.status}
                  </StatusBadge>
                  {userState.payment && (
                    <StatusBadge tone={userState.payment.status === 'verified' ? 'success' : userState.payment.status === 'submitted' ? 'warning' : 'danger'}>
                      Payment: {userState.payment.status}
                    </StatusBadge>
                  )}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem', marginBottom: '1.5rem' }}>
                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)' }}>Participant</strong>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{reg.participant_name}</span>
                </div>

                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)' }}>Distance Category</strong>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>{cat?.name || 'Sinoog Run'}</span>
                </div>

                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)' }}>Official Kit Shirt</strong>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600 }}>Size {reg.shirt_size}</span>
                </div>

                <div>
                  <strong style={{ display: 'block', fontSize: '0.85rem', color: 'var(--muted)' }}>Registration Fee</strong>
                  <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--wine)' }}>{feeFormatted}</span>
                </div>
              </div>

              {reg.status === 'approved' && (
                <div className="runner-pass">
                  <div className="runner-pass__details">
                    <small>Official four-digit runner number</small>
                    <strong>{reg.bib_number || 'Pending'}</strong>
                    <h3>Registration approved</h3>
                    <p>Present this runner number and QR code during race-kit claiming and event recording.</p>
                  </div>
                  {qrValue ? (
                    <div className="runner-pass__qr" aria-label={`QR code for runner ${reg.bib_number}`}>
                      <QRCodeSVG value={qrValue} size={144} level="H" marginSize={2} />
                    </div>
                  ) : <QrCode size={48} aria-hidden="true" />}
                </div>
              )}

              {userState.result && (
                <div className="runner-result-card">
                  <div><small>Official finish time</small><strong>{Math.floor(userState.result.elapsed_milliseconds / 3600000).toString().padStart(2, '0')}:{Math.floor((userState.result.elapsed_milliseconds % 3600000) / 60000).toString().padStart(2, '0')}:{Math.floor((userState.result.elapsed_milliseconds % 60000) / 1000).toString().padStart(2, '0')}</strong></div>
                  <div><small>{reg.division === 'female' ? 'Female' : 'Male'} division place</small><strong>#{userState.result.division_rank}</strong></div>
                  <div><small>Category place</small><strong>#{userState.result.category_rank}</strong></div>
                  <div><small>Overall place</small><strong>#{userState.result.overall_rank}</strong></div>
                </div>
              )}

              {/* Payment Action Section */}
              {userState.payment && userState.payment.status !== 'verified' && (
                <div style={{ marginTop: '2rem', borderTop: '1px solid #eee', paddingTop: '1.5rem' }}>
                  <h3 style={{ fontSize: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
                    <CreditCard size={20} color="var(--wine)" />
                    {userState.payment.status === 'submitted' ? 'Payment Proof Under Review' : 'Submit Registration Payment'}
                  </h3>

                  {userState.payment.status === 'submitted' ? (
                    <div style={{ background: '#fefce8', border: '1px solid #fef08a', borderRadius: '6px', padding: '1rem', color: '#854d0e', fontSize: '0.92rem' }}>
                      <Clock size={16} style={{ display: 'inline', marginRight: '0.35rem', verticalAlign: '-2px' }} />
                      Your payment proof has been submitted and is currently being verified by the committee finance reviewer. You will be notified once confirmed.
                    </div>
                  ) : (
                    <>
                      <div style={{ background: '#faf8f4', border: '1px solid var(--line)', borderRadius: '6px', padding: '1.25rem', marginBottom: '1.5rem', fontSize: '0.92rem' }}>
                        <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>Pay the exact registration fee through GCash:</p>
                        <ul style={{ margin: 0, paddingLeft: '1.25rem', lineHeight: 1.6 }}>
                          <li><strong>GCash number:</strong> {runEvent?.gcash_number || '09260265423'}</li>
                          {runEvent?.gcash_account_name && <li><strong>Account name:</strong> {runEvent.gcash_account_name}</li>}
                          <li><strong>Amount:</strong> {feeFormatted}</li>
                        </ul>
                      </div>

                      <form onSubmit={(e) => void handlePaymentProofSubmit(e)} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                          <div>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                              Payment Method
                            </label>
                            <select
                              value="GCash"
                              disabled
                              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                            >
                              <option value="GCash">GCash</option>
                            </select>
                          </div>

                          <div>
                            <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                              Reference / Transaction ID <span style={{ color: '#c53030' }}>*</span>
                            </label>
                            <input
                              type="text"
                              required
                              placeholder="e.g. 1002348921"
                              value={payerReference}
                              onChange={(e) => setPayerReference(e.target.value)}
                              style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                            GCash Screenshot <span style={{ color: '#c53030' }}>*</span>
                          </label>
                          <input
                            type="file"
                            required
                            accept="image/jpeg,image/png,image/webp"
                            onChange={handlePaymentFileChange}
                            style={{ width: '100%', padding: '0.5rem 0', fontSize: '0.88rem' }}
                          />
                        </div>

                        <button
                          type="submit"
                          className="button button--primary"
                          disabled={uploadingProof}
                          style={{ alignSelf: 'flex-start' }}
                        >
                          <Upload size={16} /> {uploadingProof ? 'Uploading proof…' : 'Submit payment for verification'}
                        </button>
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
                <strong>Official registration is currently scheduled to open soon.</strong> The committee is finalizing the participant categories, timing systems, kit inclusions, and route safety.
              </span>
            </div>

            <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.75rem', marginBottom: '1.25rem' }}>
              Category Preview
            </h2>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem', marginBottom: '2.5rem' }}>
              {categories.map((c) => {
                const feeFormatted = (c.fee_centavos / 100).toLocaleString('en-PH', {
                  style: 'currency',
                  currency: 'PHP',
                });
                return (
                  <div key={c.id} style={{ background: '#fff', border: '1px solid var(--line)', padding: '1.5rem', borderRadius: '6px' }}>
                    <span className="activity-type activity-type--run">{c.distance_meters / 1000} KM</span>
                    <h3 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.3rem', margin: '0.5rem 0 0.25rem' }}>{c.name}</h3>
                    <p style={{ color: 'var(--wine)', fontWeight: 700, fontSize: '1.2rem', margin: '0.25rem 0 0.75rem' }}>
                      {feeFormatted}
                    </p>
                    <small style={{ color: 'var(--muted)', display: 'block', fontSize: '0.84rem' }}>
                      {c.kit_description}
                    </small>
                  </div>
                );
              })}
            </div>

            <div className="step-list">
              {['Select your category', 'Enter participant details', 'Accept the event waiver', 'Submit payment', 'Receive race bib & kit'].map((x, i) => (
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
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '6px', padding: '1rem 1.25rem', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#92400e', fontSize: '0.92rem' }}>
                <Lock size={18} />
                <span>Sign in to track your bib and payment under your account.</span>
              </div>
              <Link to="/login" className="button button--secondary button--sm">
                Sign in first
              </Link>
            </div>
          )}

          {/* Stepper Header */}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid var(--line)', paddingBottom: '0.75rem', marginBottom: '2rem' }}>
            <span style={{ fontWeight: step === 1 ? 700 : 500, color: step === 1 ? 'var(--wine)' : 'var(--muted)' }}>
              1. Distance
            </span>
            <span style={{ fontWeight: step === 2 ? 700 : 500, color: step === 2 ? 'var(--wine)' : 'var(--muted)' }}>
              2. Runner Info
            </span>
            <span style={{ fontWeight: step === 3 ? 700 : 500, color: step === 3 ? 'var(--wine)' : 'var(--muted)' }}>
              3. Emergency
            </span>
            <span style={{ fontWeight: step === 4 ? 700 : 500, color: step === 4 ? 'var(--wine)' : 'var(--muted)' }}>
              4. Review & Waiver
            </span>
          </div>

          {formError && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '6px', color: '#991b1b', marginBottom: '1.25rem', fontSize: '0.9rem' }}>
              <AlertCircle size={18} />
              <span>{formError}</span>
            </div>
          )}

          {/* Step 1: Category Selection */}
          {step === 1 && (
            <div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', marginBottom: '1rem' }}>
                Select Your Category
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                {categories.map((c) => {
                  const feeFormatted = (c.fee_centavos / 100).toLocaleString('en-PH', {
                    style: 'currency',
                    currency: 'PHP',
                  });
                  const isSelected = selectedCategoryId === c.id;
                  return (
                    <div
                      key={c.id}
                      onClick={() => setSelectedCategoryId(c.id)}
                      style={{
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
                        <span className="activity-type activity-type--run">{c.distance_meters / 1000} KM</span>
                        <h3 style={{ margin: '0.35rem 0', fontFamily: 'Fraunces, serif', fontSize: '1.2rem' }}>{c.name}</h3>
                        <p style={{ margin: 0, fontSize: '0.88rem', color: 'var(--muted)' }}>{c.kit_description}</p>
                      </div>
                      <div style={{ textAlign: 'right', minWidth: '100px' }}>
                        <span style={{ fontSize: '1.3rem', fontWeight: 700, color: 'var(--wine)' }}>
                          {feeFormatted}
                        </span>
                        <div style={{ fontSize: '0.78rem', color: 'var(--muted)' }}>
                          {c.capacity ? `${c.capacity} slots cap` : 'Open capacity'}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                <button type="button" className="button button--primary" onClick={handleNextToStep2}>
                  Next: Participant Info <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 2: Participant Details */}
          {step === 2 && (
            <div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', marginBottom: '1rem' }}>
                Participant Details
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                    Full Participant Name <span style={{ color: '#c53030' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maria Clara Santos"
                    value={participantName}
                    onChange={(e) => setParticipantName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                      Mobile Phone Number <span style={{ color: '#c53030' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0912 345 6789"
                      value={mobile}
                      onChange={(e) => setMobile(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                      Birth Date <span style={{ color: '#c53030' }}>*</span>
                    </label>
                    <input
                      type="date"
                      required
                      value={birthDate}
                      onChange={(e) => setBirthDate(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                    Race Division <span style={{ color: '#c53030' }}>*</span>
                  </label>
                  <select value={division} onChange={(e) => setDivision(e.target.value as 'male' | 'female')} required style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}>
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                  <small style={{ color: 'var(--muted)' }}>Used only for official race results and awarding rankings.</small>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                      Full Address <span style={{ color: '#c53030' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      value={locality}
                      onChange={(e) => setLocality(e.target.value)}
                      placeholder="House/Street, Barangay, Municipality, Province"
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                      Event Singlet / Shirt Size <span style={{ color: '#c53030' }}>*</span>
                    </label>
                    <select
                      value={shirtSize}
                      onChange={(e) => setShirtSize(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    >
                      <option value="XS">Extra Small (XS)</option>
                      <option value="S">Small (S)</option>
                      <option value="M">Medium (M)</option>
                      <option value="L">Large (L)</option>
                      <option value="XL">Extra Large (XL)</option>
                      <option value="2XL">Double Extra Large (2XL)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                    Running Club or Organization (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Bohol Runners Club"
                    value={clubName}
                    onChange={(e) => setClubName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="button button--ghost" onClick={() => setStep(1)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" className="button button--primary" onClick={handleNextToStep3}>
                  Next: Emergency Contact <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 3: Emergency Contact Details */}
          {step === 3 && (
            <div>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', marginBottom: '1rem' }}>
                Emergency Contact Details
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginBottom: '2rem' }}>
                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                    Contact Person Full Name <span style={{ color: '#c53030' }}>*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Juan Santos"
                    value={emergencyName}
                    onChange={(e) => setEmergencyName(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                      Relationship <span style={{ color: '#c53030' }}>*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Spouse / Parent / Sibling"
                      value={emergencyRelationship}
                      onChange={(e) => setEmergencyRelationship(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    />
                  </div>

                  <div>
                    <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                      Emergency Mobile Number <span style={{ color: '#c53030' }}>*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="0919 876 5432"
                      value={emergencyMobile}
                      onChange={(e) => setEmergencyMobile(e.target.value)}
                      style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontWeight: 600, fontSize: '0.88rem', marginBottom: '0.25rem' }}>
                    Medical Conditions or Assistance Requests (Confidential)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Any allergies, asthma, or medical notes for emergency responders…"
                    value={accessibilityNotes}
                    onChange={(e) => setAccessibilityNotes(e.target.value)}
                    style={{ width: '100%', padding: '0.6rem 0.75rem', borderRadius: '6px', border: '1px solid #d4c5b9' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="button button--ghost" onClick={() => setStep(2)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button type="button" className="button button--primary" onClick={handleNextToStep4}>
                  Next: Review & Waiver <ArrowRight size={16} />
                </button>
              </div>
            </div>
          )}

          {/* Step 4: Review, Waiver & Submit */}
          {step === 4 && (
            <form onSubmit={(e) => void handleRegistrationSubmit(e)}>
              <h2 style={{ fontFamily: 'Fraunces, serif', fontSize: '1.5rem', marginBottom: '1rem' }}>
                Review & Participation Agreement
              </h2>

              <div style={{ background: '#faf8f4', border: '1px solid var(--line)', borderRadius: '6px', padding: '1.25rem', marginBottom: '1.5rem' }}>
                <h3 style={{ fontSize: '1.1rem', margin: '0 0 0.75rem' }}>Summary</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.92rem' }}>
                  <div><strong>Runner:</strong> {participantName}</div>
                  <div><strong>Category:</strong> {selectedCategory.name}</div>
                  <div><strong>Division:</strong> {division === 'female' ? 'Female' : 'Male'}</div>
                  <div><strong>Mobile:</strong> {mobile}</div>
                  <div><strong>Shirt Size:</strong> {shirtSize}</div>
                  <div><strong>Full address:</strong> {locality}</div>
                  <div><strong>Fee:</strong> {(selectedCategory.fee_centavos / 100).toLocaleString('en-PH', { style: 'currency', currency: 'PHP' })}</div>
                </div>
              </div>

              <div style={{ background: '#fff', border: '1px solid var(--line)', borderRadius: '6px', padding: '1rem', maxHeight: '160px', overflowY: 'auto', fontSize: '0.85rem', color: '#555', marginBottom: '1.25rem' }}>
                <p style={{ margin: '0 0 0.5rem', fontWeight: 600 }}>PARTICIPANT WAIVER & RELEASE OF LIABILITY</p>
                <p>
                  I hereby certify that I am physically fit and sufficiently trained to participate in the Sinoog Run 2027. I assume all risks of road running, including traffic, weather conditions, and physical exertion. I release the Sto. Niño Parish Guinacot, the Sinoog Committee, and volunteers from any claims arising from my participation.
                </p>
                <p>
                  I consent to the collection and processing of my personal details strictly for race operations, kit allocation, and safety verification under the Data Privacy Act.
                </p>
              </div>

              <label style={{ display: 'flex', alignItems: 'flex-start', gap: '0.75rem', cursor: 'pointer', marginBottom: '1.75rem' }}>
                <input
                  type="checkbox"
                  required
                  checked={acceptedWaiver}
                  onChange={(e) => setAcceptedWaiver(e.target.checked)}
                  style={{ width: '18px', height: '18px', marginTop: '2px' }}
                />
                <span style={{ fontSize: '0.92rem', lineHeight: 1.4 }}>
                  I have read and agree to the <strong>Sinoog Run Waiver</strong> and <strong>Privacy Notice</strong>.
                </span>
              </label>

              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <button type="button" className="button button--ghost" onClick={() => setStep(3)}>
                  <ArrowLeft size={16} /> Back
                </button>
                <button
                  type="submit"
                  className="button button--primary"
                  disabled={submitting}
                >
                  <FileCheck size={16} /> {submitting ? 'Submitting registration…' : 'Submit registration'}
                </button>
              </div>
            </form>
          )}
        </div>
      </section>
    </>
  );
}
