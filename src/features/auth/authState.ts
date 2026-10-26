import { createContext } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import type { AppRole, Profile } from '../../types';

export interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  roles: AppRole[];
  session: Session | null;
  loading: boolean;
  isAdmin: boolean;
  isNewsInCharge: boolean;
  isDelegationHead: boolean;
  isPublicUser: boolean;
  isSuspended: boolean;
  isDemoAdmin: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

