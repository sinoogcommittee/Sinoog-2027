import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/Button';
import { isSupabaseConfigured, supabase } from '../../lib/supabase';
export function LoginPage() {
  const navigate = useNavigate(); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [loading, setLoading] = useState(false);
  async function submit(e: FormEvent) { e.preventDefault(); if (!supabase) { setMessage('Add your Supabase environment values to enable secure login.'); return; } setLoading(true); const { error } = await supabase.auth.signInWithPassword({ email, password }); setLoading(false); if (error) setMessage(error.message); else navigate('/admin'); }
  if (sessionStorage.getItem('sinoog-demo-admin') === '1') return <Navigate to="/admin" replace/>;
  return <section className="auth-page"><div className="auth-card"><p className="eyebrow">Committee access</p><h1>Welcome back</h1><p>Sign in with the account assigned by an administrator.</p><form onSubmit={submit}><label>Email address<input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email"/></label><label>Password<input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required autoComplete="current-password"/></label>{message && <p className="form-message">{message}</p>}<Button type="submit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'}</Button></form>{!isSupabaseConfigured && <button className="demo-link" onClick={() => { sessionStorage.setItem('sinoog-demo-admin', '1'); navigate('/admin'); }}>Preview administrator workspace</button>}<small>Public runner registration will use a separate account flow when registration opens.</small></div></section>;
}
