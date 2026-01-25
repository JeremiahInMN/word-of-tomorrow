import { supabase, authClient } from './supabase';
import { User } from '../types';

// Key for storing intended redirect destination
const REDIRECT_KEY = 'auth_redirect_after_login';

/**
 * Sign in with Google OAuth
 * Saves the intended destination before redirecting to Google
 */
export const signInWithGoogle = async (redirectTo?: string) => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  // Save intended destination in localStorage
  if (redirectTo) {
    localStorage.setItem(REDIRECT_KEY, redirectTo);
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/#/`,
    },
  });

  if (error) {
    throw error;
  }
};

/**
 * Sign out current user
 */
export const signOut = async () => {
  if (!supabase) {
    throw new Error('Supabase is not configured');
  }

  const { error } = await supabase.auth.signOut();
  
  if (error) {
    throw error;
  }

  // Clear any stored redirect
  localStorage.removeItem(REDIRECT_KEY);
  
  // Reload to clear all state
  window.location.href = '/';
};

/**
 * Get current auth session
 */
export const getCurrentSession = async () => {
  if (!supabase) {
    return null;
  }
  
  const { data: { session }, error } = await supabase.auth.getSession();
  
  if (error) {
    console.error('Error getting session:', error);
    return null;
  }
  
  return session;
};

/**
 * Get user profile from users table (includes admin status)
 */
export const getCurrentUserProfile = async (): Promise<User | null> => {
  if (!supabase) {
    return null;
  }

  const session = await getCurrentSession();
  if (!session?.user) {
    return null;
  }

  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('id', session.user.id)
    .single();

  if (error) {
    console.error('Error fetching user profile:', error);
    return null;
  }

  return data as User;
};

/**
 * Ensure user profile exists in users table
 * Creates one if it doesn't exist (with is_admin = false)
 */
export const ensureUserProfile = async (existingSession?: any): Promise<User | null> => {
  if (!authClient) {
    return null;
  }

  // Use provided session or fetch current one
  const session = existingSession || await getCurrentSession();
  if (!session?.user) {
    return null;
  }

  // Try to fetch user profile with retry logic to handle AbortErrors
  // Use the dedicated authClient to avoid conflicts with other requests
  let profile: User | null = null;
  let retries = 3;
  
  while (retries > 0 && !profile) {
    try {
      const { data: existingProfile, error: fetchError } = await authClient
        .from('users')
        .select('*')
        .eq('id', session.user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 is "not found" which is expected if user doesn't exist
        console.error('Error fetching user profile:', fetchError);
        
        // If it's an abort error, retry after a short delay
        if (fetchError.message?.includes('Abort') && retries > 1) {
          await new Promise(resolve => setTimeout(resolve, 200));
          retries--;
          continue;
        }
        
        return null;
      }

      profile = existingProfile as User | null;
      break;
      
    } catch (err: any) {
      console.error('Exception fetching user profile:', err);
      if (err.message?.includes('Abort') && retries > 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
        retries--;
        continue;
      }
      return null;
    }
  }

  // If profile doesn't exist, create it
  if (!profile) {
    const { data, error } = await authClient
      .from('users')
      .insert({
        id: session.user.id,
        email: session.user.email,
        is_admin: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating user profile:', error);
      return null;
    }

    profile = data as User;
  }

  return profile;
};

/**
 * Get the intended redirect destination (if any) and clear it
 */
export const getAndClearRedirect = (): string | null => {
  const redirect = localStorage.getItem(REDIRECT_KEY);
  if (redirect) {
    localStorage.removeItem(REDIRECT_KEY);
  }
  return redirect;
};

/**
 * Subscribe to auth state changes
 */
export const onAuthStateChange = (callback: (event: string, session: any) => void) => {
  if (!supabase) return { data: { subscription: { unsubscribe: () => {} } } };
  
  return supabase.auth.onAuthStateChange(callback);
};
