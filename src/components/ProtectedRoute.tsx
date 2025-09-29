import { Navigate, Outlet, useLocation } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function ProtectedRoute() {
  const { user, initializing } = useAuth();
  const location = useLocation();

  if (initializing) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <p className="text-sm text-text-secondary">Checking your session...</p>
      </div>
    );
  }

  if (!user) {
    const params = new URLSearchParams();
    params.set('auth', 'signin');

    const redirectPath = `${location.pathname}${location.search}`;
    if (redirectPath && redirectPath !== '/') {
      params.set('from', redirectPath);
    }

    return <Navigate to={`/?${params.toString()}`} replace />;
  }

  return <Outlet />;
}
