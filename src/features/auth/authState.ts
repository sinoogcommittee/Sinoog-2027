import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { AppRole, Profile } from '../../types';

export type AdminPermission =
  | 'overview'
  | 'activities'
  | 'posts'
  | 'registrations'
  | 'kit_claims'
  | 'run_timing'
  | 'delegations'
  | 'users'
  | 'finance'
  | 'sponsors'
  | 'gallery'
  | 'audit'
  | 'settings';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  session: Session | null;
  loading: boolean;
  isSuperAdmin: boolean;
  isAdmin: boolean;
  isStaff: boolean;
  isNewsInCharge: boolean;
  isDelegationHead: boolean;
  isPublicUser: boolean;
  isSuspended: boolean;
  isDemoAdmin: boolean;
  canAccess: (permission: AdminPermission) => boolean;
  hasRole: (role: AppRole | AppRole[]) => boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

