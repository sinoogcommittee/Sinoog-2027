import { useEffect, useState } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { isSupabaseConfigured, supabase } from '../lib/supabase';

type Access = 'checking' | 'allowed' | 'denied';

export function RequireAdmin() {
  const [access, setAccess] = useState<Access>('checking');
  useEffect(() => {
    let active = true;
    async function checkAccess() {
      if (!isSupabaseConfigured || !supabase) {
        if (active) setAccess(sessionStorage.getItem('sinoog-demo-admin') === '1' ? 'allowed' : 'denied');
        return;
      }
      const { data: sessionData } = await supabase.auth.getSession();
      const userId = sessionData.session?.user.id;
      if (!userId) { if (active) setAccess('denied'); return; }
      const { data, error } = await supabase.from('user_roles').select('role').eq('user_id', userId).eq('role', 'admin').maybeSingle();
      if (active) setAccess(!error && data ? 'allowed' : 'denied');
    }
    void checkAccess();
    return () => { active = false; };
  }, []);
  if (access === 'checking') return <div className="route-loading" role="status">Checking account access…</div>;
  if (access === 'denied') return <Navigate to="/login" replace/>;
  return <Outlet/>;
}
