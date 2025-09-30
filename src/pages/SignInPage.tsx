import { FormEvent, useState, type RefObject } from 'react';

import { useAuth } from '../context/AuthContext';

interface SignInPanelProps {
  onSuccess?: () => void;
  onSwitch?: () => void;
  titleId?: string;
  initialFocusRef?: RefObject<HTMLInputElement>;
}

export default function SignInPage({ onSuccess, onSwitch, titleId, initialFocusRef }: SignInPanelProps) {
  const { signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!email.trim() || !password) {
      setMessage('Enter your email and password to continue.');
      setIsError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signIn({ email, password });
      setIsError(!result.success);
      setMessage(result.message);
      if (result.success) {
        onSuccess?.();
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="space-y-2 text-center">
        <h2 id={titleId ?? undefined} className="text-3xl font-semibold text-text-primary">
          Welcome back
        </h2>
        <p className="text-sm text-text-secondary">Sign in to access your profile.</p>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-lg border border-border bg-surface px-6 py-6 shadow-sm">
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text-secondary">Email</span>
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            ref={initialFocusRef ?? undefined}
            className="rounded border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium text-text-secondary">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            placeholder="Your password"
            autoComplete="current-password"
            required
          />
        </label>

        {message && (
          <p className={`text-sm ${isError ? 'text-red-400' : 'text-green-400'}`}>
            {message}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-2 inline-flex items-center justify-center rounded bg-accent px-4 py-2 text-sm font-medium text-text-inverse transition hover:bg-accent/90 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        No account yet?{' '}
        <button
          type="button"
          onClick={() => onSwitch?.()}
          className="font-medium text-accent underline-offset-2 transition hover:underline"
        >
          Create one now
        </button>
        .
      </p>
    </div>
  );
}
