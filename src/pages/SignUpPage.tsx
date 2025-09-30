import { FormEvent, useState, type RefObject } from 'react';

import { useAuth } from '../context/AuthContext';

interface SignUpPanelProps {
  onSuccess?: () => void;
  onSwitch?: () => void;
  titleId?: string;
  initialFocusRef?: RefObject<HTMLInputElement>;
}

export default function SignUpPage({ onSuccess, onSwitch, titleId, initialFocusRef }: SignUpPanelProps) {
  const { signUp, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isError, setIsError] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage(null);

    if (!email.trim()) {
      setMessage('Please enter an email address.');
      setIsError(true);
      return;
    }

    if (password.length < 8) {
      setMessage('Password must be at least 8 characters long.');
      setIsError(true);
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await signUp({ email, password });
      if (!result.success) {
        setIsError(true);
        setMessage(result.message);
        return;
      }

      setIsError(false);
      setMessage('Account created! Signing you in…');

      const loginResult = await signIn({ email, password });
      if (loginResult.success) {
        onSuccess?.();
        return;
      }

      setIsError(true);
      setMessage(loginResult.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex w-full flex-col gap-8">
      <header className="space-y-2 text-center">
        <h2 id={titleId ?? undefined} className="text-3xl font-semibold text-text-primary">
          Create your account
        </h2>
        <p className="text-sm text-text-secondary">
          Sign up with your email address to start building.
        </p>
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
            placeholder="Choose a secure password"
            autoComplete="new-password"
            required
          />
          <span className="text-xs text-text-muted">Must be at least 8 characters long.</span>
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
          {isSubmitting ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{' '}
        <button
          type="button"
          onClick={() => onSwitch?.()}
          className="font-medium text-accent underline-offset-2 transition hover:underline"
        >
          Sign in
        </button>
        .
      </p>
    </div>
  );
}
