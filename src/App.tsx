import { Link, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';

import ThemeSwitcher from './components/ThemeSwitcher';
import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import ProjectPage from './pages/ProjectPage';
import SignInPage from './pages/SignInPage';
import SignUpPage from './pages/SignUpPage';
import VerifyPage from './pages/VerifyPage';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, signOut, initializing } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const isProjectRoute = location.pathname.startsWith('/projects/');

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-text-primary">
      {!isProjectRoute && (
        <header className="border-b border-border bg-surface/90">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-center sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              Tabletop Creator – Your Friendly Game Design Companion
            </h1>
            <nav className="flex flex-col items-center justify-end gap-2 text-sm text-text-secondary sm:flex-row">
              <Link to="/" className="rounded-full border border-border/70 px-3 py-1 font-medium uppercase tracking-wide text-text-secondary">
                Starter Layout
              </Link>
              <ThemeSwitcher />
              <div className="flex items-center gap-3">
                {initializing ? (
                  <span className="text-xs text-text-muted">Loading…</span>
                ) : user ? (
                  <>
                    <Link to="/profile" className="font-medium text-accent underline-offset-2 hover:underline">
                      Profile
                    </Link>
                    <button
                      type="button"
                      onClick={handleSignOut}
                      disabled={isSigningOut}
                      className="rounded border border-border px-3 py-1 text-xs font-medium text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
                    >
                      {isSigningOut ? 'Signing out…' : 'Log out'}
                    </button>
                  </>
                ) : (
                  <>
                    <Link to="/signin" className="font-medium text-accent underline-offset-2 hover:underline">
                      Sign in
                    </Link>
                    <Link
                      to="/signup"
                      className="rounded bg-accent px-3 py-1 text-xs font-semibold text-text-inverse transition hover:bg-accent/90"
                    >
                      Sign up
                    </Link>
                  </>
                )}
              </div>
            </nav>
          </div>
        </header>
      )}

      <main
        className={
          isProjectRoute
            ? 'flex flex-1 overflow-hidden'
            : 'mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-12 sm:py-16'
        }
      >
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/signup" element={<SignUpPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<ProfilePage />} />
          </Route>
          <Route path="/projects/:projectId" element={<ProjectPage />} />
        </Routes>
      </main>

      <footer className="border-t border-border bg-surface/80">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-2 px-6 py-6 text-center text-sm text-text-muted sm:flex-row sm:justify-between">
          <p>&copy; {new Date().getFullYear()} Tabletop Creator. All rights reserved.</p>
          <p className="text-xs sm:text-sm">Crafted with Vite, React, TypeScript, and Tailwind CSS.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
