import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { BookOpen, Users, Shield, Sun, Moon, LogOut } from 'lucide-react';
import { HomePage } from './pages/HomePage';
import { AdminPage } from './pages/AdminPage';
import { CommunityPage } from './pages/CommunityPage';
import { ArchivePage } from './pages/ArchivePage';
import { LoginPage } from './pages/LoginPage';
import { initializeStore } from './services/store';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';

const NavBar = ({ theme, toggleTheme }: { theme: 'light' | 'dark', toggleTheme: () => void }) => {
  const location = useLocation();
  const { user, isAdmin, signOut } = useAuth();
  const isActive = (path: string) => location.pathname === path ? 'text-accent font-bold' : 'text-ink/60 hover:text-ink';

  return (
    <nav className="sticky top-0 z-50 w-full bg-paper/90 backdrop-blur-md border-b border-ink/10 transition-colors duration-300">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-2">
            <BookOpen className="h-6 w-6 text-ink" />
            <Link to="/" className="font-serif text-xl font-bold tracking-tight">Word of Tomorrow</Link>
          </div>
          
          <div className="flex items-center gap-6">
            <div className="hidden sm:flex space-x-8">
              {/* Community page hidden for now */}
              {/* <Link to="/community" className={`flex items-center gap-2 text-sm transition-colors ${isActive('/community')}`}>
                <Users size={16} /> Community
              </Link> */}
              {/* Only show Admin link to admin users */}
              {isAdmin && (
                <Link to="/admin" className={`flex items-center gap-2 text-sm transition-colors ${isActive('/admin')}`}>
                  <Shield size={16} /> Admin
                </Link>
              )}
            </div>
            
            <div className="flex items-center gap-3">
              <button 
                onClick={toggleTheme}
                className="p-2 rounded-full hover:bg-ink/5 text-ink/80 hover:text-ink transition-colors"
                title={theme === 'light' ? "Switch to Dark Mode" : "Switch to Light Mode"}
              >
                {theme === 'light' ? <Moon size={20} /> : <Sun size={20} />}
              </button>
              
              {/* Show Sign In link when not authenticated, Sign Out when authenticated */}
              {user ? (
                <button
                  onClick={signOut}
                  className="flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors"
                  title="Sign Out"
                >
                  <LogOut size={16} />
                  <span className="hidden sm:inline">Sign Out</span>
                </button>
              ) : (
                <Link
                  to="/login"
                  className="flex items-center gap-2 text-sm text-ink/60 hover:text-ink transition-colors"
                >
                  <LogOut size={16} className="rotate-180" />
                  <span className="hidden sm:inline">Sign In</span>
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </nav>
  );
};

const App: React.FC = () => {
  const [isInitialized, setIsInitialized] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    initializeStore();
    
    // Theme Initialization
    const savedTheme = localStorage.getItem('theme');
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme === 'dark' || (!savedTheme && prefersDark)) {
      setTheme('dark');
      document.documentElement.classList.add('dark');
    } else {
      setTheme('light');
      document.documentElement.classList.remove('dark');
    }
    
    setIsInitialized(true);
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
    
    if (newTheme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  };

  if (!isInitialized) return null;

  return (
    <HashRouter>
      <AuthProvider>
        <div className="min-h-screen flex flex-col font-sans text-ink transition-colors duration-300">
          <NavBar theme={theme} toggleTheme={toggleTheme} />
          <main className="flex-grow">
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/archive" element={<ArchivePage />} />
              <Route path="/archive/:date" element={<ArchivePage />} />
              <Route path="/login" element={<LoginPage />} />
              <Route 
                path="/admin" 
                element={
                  <ProtectedRoute>
                    <AdminPage />
                  </ProtectedRoute>
                } 
              />
              {/* Community page hidden for now */}
              {/* <Route path="/community" element={<CommunityPage />} /> */}
            </Routes>
          </main>
          <footer className="border-t border-ink/10 py-8 mt-12 bg-surface/50">
            <div className="max-w-5xl mx-auto px-4 text-center text-sm text-ink/40">
              <p>© {new Date().getFullYear()} Word of Tomorrow. Not a real dictionary.</p>
            </div>
          </footer>
        </div>
      </AuthProvider>
    </HashRouter>
  );
};

export default App;