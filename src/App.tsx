import { Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { useCallback, useMemo } from 'react';

import ProtectedRoute from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';
import Home from './pages/Home';
import ProfilePage from './pages/ProfilePage';
import ProjectPage from './pages/ProjectPage';
import VerifyPage from './pages/VerifyPage';
import AuthOverlay from './components/AuthOverlay';

function App() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, initializing } = useAuth();
  const isProjectRoute = location.pathname.startsWith('/projects/');
  const searchParams = useMemo(() => new URLSearchParams(location.search), [location.search]);
  const authMode = searchParams.get('auth');
  const redirectAfterAuth = searchParams.get('from') ?? undefined;

  const openAuth = useCallback(
    (mode: 'signin' | 'signup', options?: { from?: string }) => {
      const params = new URLSearchParams(location.search);
      params.set('auth', mode);
      if (options?.from) {
        params.set('from', options.from);
      } else {
        params.delete('from');
      }

      const search = params.toString();
      navigate(`${location.pathname}${search ? `?${search}` : ''}`);
    },
    [location.pathname, location.search, navigate],
  );

  const closeAuth = useCallback(() => {
    if (!authMode) {
      return;
    }

    const params = new URLSearchParams(location.search);
    params.delete('auth');
    params.delete('from');
    const search = params.toString();
    navigate(`${location.pathname}${search ? `?${search}` : ''}`, { replace: true });
  }, [authMode, location.pathname, location.search, navigate]);

  const handleAuthSuccess = useCallback(() => {
    const destination = redirectAfterAuth ?? '/';
    closeAuth();
    navigate(destination, { replace: true });
  }, [closeAuth, navigate, redirectAfterAuth]);

  return (
    <div className="flex min-h-screen flex-col bg-background font-sans text-text-primary">
      {!isProjectRoute && (
        <header className="border-b border-border bg-surface/90">
          <div className="mx-auto flex max-w-6xl flex-col gap-3 px-6 py-6 text-center sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-2xl font-semibold tracking-tight text-text-primary sm:text-3xl">
              Tabletop Creator – Your Friendly Game Design Companion
            </h1>
            <nav className="flex flex-col items-center justify-end gap-2 text-sm text-text-secondary sm:flex-row">
              <div className="flex items-center gap-3">
                {initializing ? (
                  <span className="text-xs text-text-muted">Loading…</span>
                ) : user ? (
                  <button
                    type="button"
                    onClick={() => navigate('/profile')}
                    className="relative inline-flex h-10 w-10 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted text-base font-semibold text-text-primary shadow-sm transition hover:border-accent hover:shadow-md"
                  >
                    <span className="uppercase">{user.email?.[0]?.toUpperCase() ?? 'U'}</span>
                    <span className="sr-only">Open profile</span>
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      onClick={() => openAuth('signin')}
                      className="font-medium text-accent underline-offset-2 transition hover:underline"
                    >
                      Sign in
                    </button>
                    <button
                      type="button"
                      onClick={() => openAuth('signup')}
                      className="rounded bg-accent px-3 py-1 text-xs font-semibold text-text-inverse transition hover:bg-accent/90"
                    >
                      Sign up
                    </button>
                  </>
                )}
              </div>
            </nav>
          </div>
        </header>
      )}

      <main className={isProjectRoute ? 'flex flex-1 overflow-hidden' : 'flex flex-1 flex-col'}>
        <Routes>
          <Route
            path="/"
            element={<Home onOpenSignIn={() => openAuth('signin')} onOpenSignUp={() => openAuth('signup')} />}
          />
          <Route
            path="/verify"
            element={<VerifyPage onOpenSignIn={() => openAuth('signin')} onOpenSignUp={() => openAuth('signup')} />}
          />
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

      {authMode && (
        <AuthOverlay
          mode={authMode === 'signup' ? 'signup' : 'signin'}
          onClose={closeAuth}
          onSuccess={handleAuthSuccess}
          onSwitch={(mode) => openAuth(mode, redirectAfterAuth ? { from: redirectAfterAuth } : undefined)}
        />
      )}
    </div>
  );
}

export default App;
