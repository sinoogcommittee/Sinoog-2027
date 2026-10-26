import { useEffect, useState, type FormEvent } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { LoadingState } from '../../features/ui/FeedbackStates';
import { useAuth } from '../../features/auth/useAuth';
import { useToast } from '../../features/ui/useToast';
import { supabase } from '../../lib/supabase';

export function AccountPage() {
  const { user, profile, loading: authLoading, isAdmin, isDemoAdmin, refresh, signOut } = useAuth();
  const { toast } = useToast();
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [locality, setLocality] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setFullName(profile?.full_name || '');
    setMobile(profile?.mobile || '');
    setLocality(profile?.locality || '');
  }, [profile]);

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
              Full address
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
