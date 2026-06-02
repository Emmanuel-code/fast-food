import { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { supabase } from '@/db/supabase';
import type { User } from '@supabase/supabase-js';
import type { Profile } from '@/types/types';

export async function getProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();
  if (error) {
    console.error('Failed to fetch profile:', error);
    return null;
  }
  return data as Profile | null;
}

/**
 * Ensures a profile row exists for the given user.
 * If the DB trigger `on_auth_user_created` didn't fire (e.g. migration not applied),
 * this creates the profile on-the-fly so the app doesn't break.
 */
async function ensureProfile(user: User): Promise<Profile | null> {
  // Try fetching first
  let profile = await getProfile(user.id);
  if (profile) return profile;

  // Profile missing — create via RPC (bypasses RLS with SECURITY DEFINER)
  console.warn('[AuthContext] Profile missing for user', user.id, '— creating via RPC');
  const name = user.user_metadata?.name || user.email?.split('@')[0] || '';

  // Try the RPC function first (requires migration 00003)
  const { error: rpcError } = await supabase.rpc('ensure_profile', {
    p_user_id: user.id,
    p_email: user.email ?? '',
    p_name: name,
  });

  if (rpcError) {
    console.warn('[AuthContext] RPC ensure_profile failed (migration may not be applied):', rpcError.message);
    // Fallback: try direct upsert (works if INSERT policy exists)
    const { error: upsertError } = await supabase
      .from('profiles')
      .upsert({
        id: user.id,
        email: user.email,
        name,
        role: 'customer',
      }, { onConflict: 'id' });

    if (upsertError) {
      console.error('[AuthContext] Direct upsert also failed:', upsertError.message);
    }
  }

  // Fetch the newly-created profile
  profile = await getProfile(user.id);
  if (!profile) {
    console.error('[AuthContext] Profile STILL null after ensure attempts. The DB trigger and RPC may both be missing.');
  }
  return profile;
}

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ data: { user: User | null } | null; error: Error | null }>;
  signUp: (name: string, email: string, password: string) => Promise<{ data: { user: User | null } | null; error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  // Keep refs to user, profile, and fetch status to completely prevent duplicate concurrent runs
  const userRef = useRef<User | null>(null);
  userRef.current = user;

  const profileRef = useRef<Profile | null>(null);
  profileRef.current = profile;

  const isEnsuringRef = useRef<boolean>(false);

  const refreshProfile = useCallback(async () => {
    const currentUser = userRef.current;
    if (!currentUser) {
      setProfile(null);
      return;
    }
    const profileData = await ensureProfile(currentUser);
    setProfile(profileData);
  }, []);

  useEffect(() => {
    let isMounted = true;

    // Listen to auth state changes. This is guaranteed to fire INITIAL_SESSION immediately
    // upon subscription registration, so we don't need a separate loadSession() on mount.
    // This completely resolves concurrent token refresh race conditions and sb-auth-token locks.
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`[AuthContext] onAuthStateChange event: ${event}`, session ? `User ID: ${session.user.id}` : 'No session');
      if (!isMounted) return;

      if (event === 'SIGNED_OUT') {
        console.log('[AuthContext] SIGNED_OUT event. Clearing state.');
        setUser(null);
        setProfile(null);
        userRef.current = null;
        profileRef.current = null;
        setLoading(false);
        return;
      }

      if (session?.user) {
        setUser(session.user);
        userRef.current = session.user;

        const currentProfile = profileRef.current;
        if (!currentProfile && !isEnsuringRef.current) {
          console.log('[AuthContext] Fetching/Ensuring profile for user...');
          isEnsuringRef.current = true;
          setLoading(true); // <-- FIX: Set loading to true while fetching profile so RoleRoute doesn't redirect early
          ensureProfile(session.user)
            .then(p => {
              console.log('[AuthContext] ensureProfile resolved:', p ? `Profile ID: ${p.id}` : 'Null profile');
              if (isMounted) {
                setProfile(p);
                profileRef.current = p;
                setLoading(false);
              }
            })
            .catch(err => {
              console.error('[AuthContext] ensureProfile failed:', err);
              if (isMounted) setLoading(false);
            })
            .finally(() => {
              isEnsuringRef.current = false;
            });
        } else if (currentProfile) {
          console.log('[AuthContext] Profile already loaded. Skipping ensureProfile.');
          setLoading(false);
        } else {
          console.log('[AuthContext] Profile fetch already in progress. Skipping duplicate call.');
        }
      } else {
        console.warn('[AuthContext] No session present in event. Clearing state.');
        setUser(null);
        setProfile(null);
        userRef.current = null;
        profileRef.current = null;
        setLoading(false);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return { data: { user: data.user }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }, []);

  const signUp = useCallback(async (name: string, email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { name } },
      });
      if (error) throw error;
      // Update name in profiles after signup
      if (data.user) {
        await supabase.from('profiles').update({ name }).eq('id', data.user.id);
      }
      return { data: { user: data.user }, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    userRef.current = null;
    profileRef.current = null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
}
