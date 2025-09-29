import { Link } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';

export default function ProfilePage() {
  const { user } = useAuth();

  if (!user) {
    return null;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-6">
      <header className="space-y-2">
        <h2 className="text-3xl font-semibold text-text-primary">Your profile</h2>
        <p className="text-sm text-text-secondary">This page is protected. Only signed-in users can see it.</p>
      </header>

      <section className="rounded-lg border border-border bg-surface px-6 py-6 shadow-sm">
        <dl className="grid grid-cols-1 gap-4 text-sm text-text-secondary">
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">Email</dt>
            <dd className="break-all text-text-secondary">{user.email}</dd>
          </div>
          <div className="flex flex-col gap-1">
            <dt className="font-semibold text-text-primary">User ID</dt>
            <dd className="text-xs text-text-muted">{user.id}</dd>
          </div>
        </dl>
      </section>

      <p className="text-sm text-text-secondary">
        Head back to the{' '}
        <Link to="/" className="font-medium text-accent underline-offset-2 hover:underline">
          dashboard
        </Link>{' '}
        to continue designing.
      </p>
    </div>
  );
}
