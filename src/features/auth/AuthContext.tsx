import { useEffect, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase } from '../../lib/supabase';
import type { AppRole, Profile } from '../../types';
import { AuthContext } from './authState';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDemoAdmin, setIsDemoAdmin] = useState(false);

  const fetchProfileAndRoles = useCallback(async (userId: string) => {
    if (!supabase) return;
    try {
      const [profileRes, rolesRes] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('user_roles').select('role').eq('user_id', userId),
      ]);

      if (profileRes.data) {
        setProfile(profileRes.data);
      }
      if (rolesRes.data) {
        setRoles(rolesRes.data.map((r: { role: AppRole }) => r.role));
      }
    } catch (err: unknown) {
      console.error('Error fetching user roles/profile:', err);
      setError('Unable to load account permissions.');
    }
  }, []);

  const refresh = useCallback(async () => {
    if (!supabase) {
      const demo = sessionStorage.getItem('sinoog-demo-admin') === '1';
      setIsDemoAdmin(demo);
      if (demo) {
        setRoles(['admin', 'public_user']);
      }
      setLoading(false);
      return;
    }

    try {
      const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
      if (sessionErr) throw sessionErr;

      const activeSession = sessionData.session;
      setSession(activeSession);
      const activeUser = activeSession?.user ?? null;
      setUser(activeUser);

      if (activeUser) {
        await fetchProfileAndRoles(activeUser.id);
      } else {
        const demo = sessionStorage.getItem('sinoog-demo-admin') === '1';
        setIsDemoAdmin(demo);
        if (demo) {
          setRoles(['admin', 'public_user']);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
    } catch (err: unknown) {
      console.error('Auth refresh error:', err);
      setError(err instanceof Error ? err.message : 'Authentication error');
    } finally {
      setLoading(false);
    }
  }, [fetchProfileAndRoles]);

  useEffect(() => {
    let mounted = true;

    async function initializeAuth() {
      if (!supabase) {
        if (!mounted) return;
        const demo = sessionStorage.getItem('sinoog-demo-admin') === '1';
        setIsDemoAdmin(demo);
        if (demo) {
          setRoles(['admin', 'public_user']);
        }
        setLoading(false);
        return;
      }

      try {
        const { data: sessionData, error: sessionErr } = await supabase.auth.getSession();
        if (sessionErr) throw sessionErr;

        if (!mounted) return;
        const activeSession = sessionData.session;
        setSession(activeSession);
        const activeUser = activeSession?.user ?? null;
        setUser(activeUser);

        if (activeUser) {
          await fetchProfileAndRoles(activeUser.id);
        } else {
          const demo = sessionStorage.getItem('sinoog-demo-admin') === '1';
          setIsDemoAdmin(demo);
          if (demo) {
            setRoles(['admin', 'public_user']);
          } else {
            setProfile(null);
            setRoles([]);
          }
        }
      } catch (err: unknown) {
        if (!mounted) return;
        console.error('Auth init error:', err);
        setError(err instanceof Error ? err.message : 'Authentication error');
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    }

    void initializeAuth();

    if (!supabase) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, newSession) => {
      if (!mounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      if (newSession?.user) {
        await fetchProfileAndRoles(newSession.user.id);
      } else {
        const demo = sessionStorage.getItem('sinoog-demo-admin') === '1';
        setIsDemoAdmin(demo);
        if (demo) {
          setRoles(['admin', 'public_user']);
        } else {
          setProfile(null);
          setRoles([]);
        }
      }
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [fetchProfileAndRoles]);

  const signOut = useCallback(async () => {
    sessionStorage.removeItem('sinoog-demo-admin');
    setIsDemoAdmin(false);
    setProfile(null);
    setRoles([]);
    setUser(null);
    setSession(null);
    if (supabase) {
      await supabase.auth.signOut();
    }
  }, []);

  const isSuspended = useMemo(() => Boolean(profile?.suspended_at), [profile]);
  const isAdmin = useMemo(
    () => !isSuspended && (isDemoAdmin || roles.includes('admin')),
    [isSuspended, isDemoAdmin, roles]
  );
  const isNewsInCharge = useMemo(
    () => !isSuspended && (isAdmin || roles.includes('news_in_charge')),
    [isSuspended, isAdmin, roles]
  );
  const isDelegationHead = useMemo(
    () => !isSuspended && (isAdmin || roles.includes('delegation_head')),
    [isSuspended, isAdmin, roles]
  );
  const isPublicUser = useMemo(
    () => !isSuspended && (roles.includes('public_user') || Boolean(user)),
    [isSuspended, roles, user]
  );

  const value = useMemo(
    () => ({
      user,
      profile,
      roles,
      session,
      loading,
      isAdmin,
      isNewsInCharge,
      isDelegationHead,
      isPublicUser,
      isSuspended,
      isDemoAdmin,
      error,
      refresh,
      signOut,
    }),
    [
      user,
      profile,
      roles,
      session,
      loading,
      isAdmin,
      isNewsInCharge,
      isDelegationHead,
      isPublicUser,
      isSuspended,
      isDemoAdmin,
      error,
      refresh,
      signOut,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
