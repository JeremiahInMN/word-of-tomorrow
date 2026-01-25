import React, { useState } from 'react';
import { BookOpen, LogIn, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { Navigate } from 'react-router-dom';

export const LoginPage: React.FC = () => {
  const { user, signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // If already logged in, redirect to home
  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('Sign in error:', err);
      setError('Failed to sign in. Please try again.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-paper via-surface to-paper dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 transition-colors duration-300">
      <div className="max-w-md w-full mx-4">
        <div className="bg-surface rounded-2xl shadow-2xl border border-ink/10 p-8 sm:p-12 text-center transition-colors duration-300">
          {/* Logo */}
          <div className="flex justify-center mb-6">
            <div className="p-4 bg-accent/10 rounded-full">
              <BookOpen className="w-12 h-12 text-accent" />
            </div>
          </div>

          {/* Title */}
          <h1 className="font-serif text-3xl sm:text-4xl font-bold text-ink mb-3">
            Word of Tomorrow
          </h1>
          
          {/* Subtitle */}
          <p className="text-ink/60 mb-8">
            A daily dose of made-up words
          </p>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg text-red-800 dark:text-red-200 text-sm">
              {error}
            </div>
          )}

          {/* Sign In Button */}
          <button
            onClick={handleSignIn}
            disabled={loading}
            className={`
              w-full py-4 px-6 rounded-lg font-medium text-white
              flex items-center justify-center gap-3
              transition-all duration-200
              ${loading 
                ? 'bg-accent/70 cursor-not-allowed' 
                : 'bg-accent hover:bg-accent/90 shadow-lg hover:shadow-xl'
              }
            `}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Redirecting to Google...
              </>
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Sign in with Google
              </>
            )}
          </button>

          {/* Footer Text */}
          <p className="mt-8 text-xs text-ink/40">
            Admin access required
          </p>
        </div>

        {/* Bottom decoration */}
        <div className="text-center mt-6 text-xs text-ink/30">
          Secure authentication powered by Supabase
        </div>
      </div>
    </div>
  );
};
