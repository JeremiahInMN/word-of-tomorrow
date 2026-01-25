import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, isAdmin, loading } = useAuth();
  const location = useLocation();

  // Show loading spinner while checking auth state
  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-accent mb-4" />
        <p className="text-ink/60">Checking access...</p>
      </div>
    );
  }

  // Not authenticated - redirect to login
  if (!user) {
    // Save current location to redirect back after login
    localStorage.setItem('auth_redirect_after_login', location.pathname);
    return <Navigate to="/login" replace />;
  }

  // Authenticated but not admin - redirect to home
  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  // Authenticated and admin - allow access
  return <>{children}</>;
};
