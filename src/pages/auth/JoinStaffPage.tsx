import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ShieldCheck, Clock, CheckCircle2, AlertCircle, ArrowRight, RefreshCw, KeyRound } from 'lucide-react';
import { useAuth } from '../../features/auth/useAuth';
import { GoogleSignInButton } from '../../features/auth/GoogleSignInButton';
import { claimStaffInviteCode, getMyStaffRequest } from '../../features/staff/staffInviteQueries';
import type { DbStaffRequest } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/m3/Card';
import { TextField } from '../../components/m3/TextField';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingState } from '../../features/ui/FeedbackStates';
import { useToast } from '../../features/ui/useToast';

export function JoinStaffPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isStaff, isAdmin, isSuperAdmin, loading: authLoading, refresh } = useAuth();
  const { toast } = useToast();

  const [inviteCode, setInviteCode] = useState(() => (searchParams.get('code') || '').toUpperCase());
  const [myRequest, setMyRequest] = useState<DbStaffRequest | null>(null);
  const [loadingRequest, setLoadingRequest] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleError, setGoogleError] = useState('');

  useEffect(() => {
    if (!user) return;
    let mounted = true;

    async function loadRequest() {
      setLoadingRequest(true);
      try {
        if (!user) return;
        const req = await getMyStaffRequest(user.id);
        if (mounted) setMyRequest(req);
      } catch (err) {
        console.warn('Load staff request error:', err);
      } finally {
        if (mounted) setLoadingRequest(false);
      }
    }

    void loadRequest();
    return () => {
      mounted = false;
    };
  }, [user]);

  async function handleClaim(e: FormEvent) {
    e.preventDefault();
    const cleanCode = inviteCode.trim().toUpperCase();
    if (!cleanCode) {
      toast('Please enter a committee invite code.', 'error');
      return;
    }

    if (!user) {
      // Save in sessionStorage before Google sign in
      sessionStorage.setItem('sinoog_pending_staff_invite', cleanCode);
      return;
    }

    setSubmitting(true);
    try {
      const res = await claimStaffInviteCode(cleanCode);
      toast(res.message, 'success');
      await refresh();
      if (user) {
        const req = await getMyStaffRequest(user.id);
        setMyRequest(req);
      }
    } catch (err: unknown) {
      toast(err instanceof Error ? err.message : 'Unable to claim invite code.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRefreshStatus() {
    if (!user) return;
    setLoadingRequest(true);
    try {
      await refresh();
      const req = await getMyStaffRequest(user.id);
      setMyRequest(req);
      if (req?.status === 'approved') {
        toast('Your account has been approved! Redirecting to workspace…', 'success');
        navigate('/admin');
      } else {
        toast('Checked status: your request is still awaiting administrator review.', 'info');
      }
    } catch {
      toast('Failed to refresh status.', 'error');
    } finally {
      setLoadingRequest(false);
    }
  }

  // Pre-save invite code in sessionStorage whenever user clicks Google sign-in
  function handleBeforeGoogle() {
    const cleanCode = inviteCode.trim().toUpperCase();
    if (cleanCode) {
      sessionStorage.setItem('sinoog_pending_staff_invite', cleanCode);
    }
  }

  if (authLoading) {
    return (
      <section className="auth-page" style={{ minHeight: '70vh', display: 'grid', placeItems: 'center' }}>
        <LoadingState message="Loading committee registration…" />
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-card" style={{ maxWidth: '580px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <ShieldCheck size={28} style={{ color: 'var(--md-sys-color-primary)' }} />
          <p className="eyebrow" style={{ margin: 0 }}>Committee Onboarding</p>
        </div>

        <h1 style={{ fontSize: '1.75rem', marginBottom: '8px' }}>Join Committee Staff</h1>
        <p style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.92rem', marginBottom: '24px' }}>
          Committee members use an invite code provided by the Super Administrator to sign up with their Google account
          and request operational access.
        </p>

        {/* State A: User is already an approved staff or administrator */}
        {user && (isSuperAdmin || isAdmin || isStaff) && (
          <Card variant="filled" style={{ padding: 'var(--md-space-4)', marginBottom: '20px', background: 'rgba(52, 168, 83, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <CheckCircle2 size={24} style={{ color: '#2e7d32', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', color: '#1b5e20', fontSize: '1.05rem', marginBottom: '4px' }}>
                  {isSuperAdmin ? 'Super Administrator Account' : isAdmin ? 'Administrator Account' : 'Committee Staff Access Active'}
                </strong>
                <p style={{ fontSize: '0.88rem', margin: '0 0 12px 0', color: 'var(--md-sys-color-on-surface)' }}>
                  You are signed in as <strong>{user.email}</strong> and already have active committee permissions.
                </p>
                <Button variant="filled" leadingIcon={<ArrowRight size={16} />} onClick={() => navigate('/admin')}>
                  Go to Committee Workspace
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* State B: User has a pending request awaiting review */}
        {user && myRequest?.status === 'pending' && !(isSuperAdmin || isAdmin) && (
          <Card variant="outlined" style={{ padding: 'var(--md-space-4)', marginBottom: '20px', borderColor: 'var(--md-sys-color-primary)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <Clock size={24} style={{ color: 'var(--md-sys-color-primary)', flexShrink: 0, marginTop: '2px' }} />
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
                  <strong style={{ fontSize: '1.05rem' }}>Awaiting Committee Approval</strong>
                  <StatusBadge tone="warning">Pending Review</StatusBadge>
                </div>
                <p style={{ fontSize: '0.88rem', color: 'var(--md-sys-color-on-surface-variant)', margin: '0 0 12px 0' }}>
                  Your Google account (<strong>{user.email}</strong>) has claimed invite code{' '}
                  <code style={{ padding: '2px 6px', background: 'var(--md-sys-color-surface-container-high)', borderRadius: '4px', fontWeight: 600 }}>
                    {myRequest.invite_code}
                  </code>
                  . The Super Administrator or Committee Admin will review your account and assign your specific page roles shortly.
                </p>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <Button variant="outlined" leadingIcon={<RefreshCw size={15} />} disabled={loadingRequest} onClick={() => void handleRefreshStatus()}>
                    {loadingRequest ? 'Checking…' : 'Check Approval Status'}
                  </Button>
                  <Button variant="ghost" to="/account">
                    Go to Runner Account
                  </Button>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* State C: User was rejected or not yet claimed */}
        {user && myRequest?.status === 'rejected' && (
          <Card variant="filled" style={{ padding: 'var(--md-space-4)', marginBottom: '20px', background: 'rgba(217, 48, 37, 0.08)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              <AlertCircle size={22} style={{ color: '#d93025', flexShrink: 0, marginTop: '2px' }} />
              <div>
                <strong style={{ color: '#c5221f' }}>Previous Request Not Approved</strong>
                <p style={{ fontSize: '0.88rem', margin: '4px 0 0 0', color: 'var(--md-sys-color-on-surface)' }}>
                  {myRequest.notes || 'Your previous committee request was declined. If you received a new invite code, you may submit it below.'}
                </p>
              </div>
            </div>
          </Card>
        )}

        {/* If user is not yet approved or not yet signed in */}
        {(!user || (!isStaff && !isAdmin && !isSuperAdmin && myRequest?.status !== 'pending')) && (
          <form onSubmit={(e) => void handleClaim(e)}>
            <div style={{ marginBottom: '16px' }}>
              <TextField
                label="Staff Invite Code"
                placeholder="e.g. SINOOG-ABC123"
                value={inviteCode}
                onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                required
                autoComplete="off"
                leadingIcon={<KeyRound size={17} />}
              />
              <small style={{ color: 'var(--md-sys-color-on-surface-variant)', fontSize: '0.78rem', display: 'block', marginTop: '4px' }}>
                Ask the Super Administrator for this code if you have not received one.
              </small>
            </div>

            {user ? (
              <Button type="submit" variant="filled" disabled={submitting || !inviteCode.trim()} style={{ width: '100%', marginBottom: '16px' }}>
                {submitting ? 'Submitting request…' : 'Submit Invite Code for Approval'}
              </Button>
            ) : (
              <div style={{ marginTop: '16px' }} onClick={handleBeforeGoogle}>
                <GoogleSignInButton
                  nextPath={`/join-staff${inviteCode.trim() ? `?code=${encodeURIComponent(inviteCode.trim())}` : ''}`}
                  onError={setGoogleError}
                />
              </div>
            )}

            {googleError && (
              <p style={{ color: 'var(--md-sys-color-error)', fontSize: '0.85rem', marginTop: '8px' }}>
                {googleError}
              </p>
            )}
          </form>
        )}

        {/* Note that staff members can run too */}
        <div style={{ marginTop: '20px', padding: '12px 14px', background: 'var(--md-sys-color-surface-container-low)', borderRadius: '10px', border: '1px solid var(--md-sys-color-outline-variant)' }}>
          <strong style={{ fontSize: '0.88rem', display: 'block', marginBottom: '2px', color: 'var(--md-sys-color-on-surface)' }}>
            Staff members can run too!
          </strong>
          <p style={{ margin: 0, fontSize: '0.82rem', color: 'var(--md-sys-color-on-surface-variant)' }}>
            Joining as committee staff does not restrict your runner registration. You can register for the 3K, 5K, 10K, or 21K run at <Link to="/run/register">Run Registration</Link> and view your digital runner pass anytime on your <Link to="/account">Runner Account</Link>.
          </p>
        </div>

        <div style={{ borderTop: '1px solid var(--md-sys-color-outline-variant)', marginTop: '24px', paddingTop: '16px', display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
          <Link to="/login" style={{ color: 'var(--md-sys-color-primary)' }}>
            Already have staff credentials? Staff sign in
          </Link>
          <Link to="/" style={{ color: 'var(--md-sys-color-on-surface-variant)' }}>
            Return to Public Site
          </Link>
        </div>
      </div>
    </section>
  );
}
