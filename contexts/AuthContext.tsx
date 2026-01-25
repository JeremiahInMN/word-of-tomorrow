import React, { createContext, useContext, useEffect, useState } from 'react';
import { AuthContextType, User } from '../types';
import { 
  signInWithGoogle as signInWithGoogleService,
  signOut as signOutService,
  getCurrentSession,
  ensureUserProfile,
  onAuthStateChange,
  getAndClearRedirect
} from '../services/auth';
import { authClient } from '../services/supabase';
import { useNavigate } from 'react-router-dom';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  // Initialize auth state on mount
  useEffect(() => {
    let isMounted = true;
    let isHandlingOAuthCallback = false;
    
    const init = async () => {
      try {
        setLoading(true);
        
        // First, check if we're in an OAuth callback (URL has auth tokens)
        let hashContent = window.location.hash;
        
        // Remove leading # symbols
        if (hashContent.startsWith('#/#')) {
          hashContent = hashContent.substring(3); // Remove /#/
        } else if (hashContent.startsWith('#')) {
          hashContent = hashContent.substring(1); // Remove #
        }
        
        const hashParams = new URLSearchParams(hashContent);
        
        if (hashParams.has('access_token')) {
          isHandlingOAuthCallback = true;
          
          // Extract tokens from URL
          const access_token = hashParams.get('access_token');
          const refresh_token = hashParams.get('refresh_token');
          
          if (access_token && refresh_token && authClient) {
            // Manually set the session using the tokens
            const { error } = await authClient.auth.setSession({
              access_token,
              refresh_token,
            });
            
            if (error) {
              console.error('Error setting session:', error);
              isHandlingOAuthCallback = false;
            } else {
              // Wait for session to be fully initialized and other requests to settle
              await new Promise(resolve => setTimeout(resolve, 300));
            }
          }
          
          // Clean up the URL
          window.location.hash = '/';
          
          // Return early - the SIGNED_IN event will handle profile fetching
          return;
        }
        
        // Not an OAuth callback, check for existing session
        const session = await getCurrentSession();
        
        if (session && isMounted) {
          // User is signed in, fetch/create their profile
          const profile = await ensureUserProfile();
          if (isMounted) {
            setUser(profile);
            
            // Check if there's a saved redirect destination
            const redirect = getAndClearRedirect();
            if (redirect && profile?.is_admin) {
              navigate(redirect);
            }
          }
        }
      } catch (err) {
        if (isMounted) {
          console.error('Error initializing auth:', err);
          setError('Failed to load authentication state');
        }
      } finally {
        if (isMounted && !isHandlingOAuthCallback) {
          setLoading(false);
        }
      }
    };
    
    init();

    // Subscribe to auth state changes
    const { data: { subscription } } = onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session && isMounted) {
        await handleSignIn(session);
      } else if (event === 'SIGNED_OUT' && isMounted) {
        setUser(null);
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const handleSignIn = async (session: any) => {
    try {
      setLoading(true);
      const profile = await ensureUserProfile(session);
      
      if (profile) {
        setUser(profile);
        
        // Check for redirect destination
        const redirect = getAndClearRedirect();
        if (redirect && profile?.is_admin) {
          navigate(redirect);
        } else {
          navigate('/');
        }
      } else {
        console.error('Failed to get user profile');
      }
    } catch (err) {
      console.error('Error during sign in:', err);
      setError('Failed to complete sign in');
    } finally {
      setLoading(false);
    }
  };

  const signInWithGoogle = async () => {
    try {
      setError(null);
      // Get current location to redirect back after OAuth
      const currentPath = window.location.hash.replace('#', '');
      await signInWithGoogleService(currentPath || '/');
    } catch (err: any) {
      console.error('Error signing in with Google:', err);
      setError(err.message || 'Failed to sign in with Google');
      throw err;
    }
  };

  const signOut = async () => {
    try {
      setError(null);
      await signOutService();
      setUser(null);
      navigate('/');
    } catch (err: any) {
      console.error('Error signing out:', err);
      setError(err.message || 'Failed to sign out');
      throw err;
    }
  };

  const value: AuthContextType = {
    user,
    isAdmin: user?.is_admin ?? false,
    loading,
    signInWithGoogle,
    signOut,
  };

  // Show error banner if there's an error
  return (
    <AuthContext.Provider value={value}>
      {error && (
        <div className="fixed top-0 left-0 right-0 z-50 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800 p-4 flex items-center justify-between">
          <span className="text-red-800 dark:text-red-200">{error}</span>
          <button 
            onClick={() => setError(null)}
            className="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-200"
          >
            ✕
          </button>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
