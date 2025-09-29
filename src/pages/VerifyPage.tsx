import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';

import { apiFetch } from '../lib/api';

interface VerifyPageProps {
  onOpenSignIn?: () => void;
  onOpenSignUp?: () => void;
}

export default function VerifyPage({ onOpenSignIn, onOpenSignUp }: VerifyPageProps) {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>(token ? 'loading' : 'idle');
  const [message, setMessage] = useState<string>('');
  const navigate = useNavigate();

  const handleOpenSignIn = () => {
    if (onOpenSignIn) {
      onOpenSignIn();
      return;
    }

    navigate('/?auth=signin');
  };

  const handleOpenSignUp = () => {
    if (onOpenSignUp) {
      onOpenSignUp();
      return;
    }

    navigate('/?auth=signup');
  };

  useEffect(() => {
    if (!token) {
      setMessage('This verification link is invalid.');
      setStatus('error');
      return;
    }

    const verify = async () => {
      try {
        const data = await apiFetch<{ message: string }>('/api/auth/verify', {
          method: 'POST',
          body: JSON.stringify({ token }),
        });
        setMessage(data.message);
        setStatus('success');
      } catch (error) {
        setMessage((error as Error).message);
        setStatus('error');
      }
    };

    void verify();
  }, [token]);

  return (
    <div className="mx-auto flex w-full max-w-md flex-col gap-6 text-center">
      <h2 className="text-3xl font-semibold text-text-primary">Verify your email</h2>

      {status === 'loading' && (
        <p className="text-sm text-text-secondary">We are confirming your account…</p>
      )}

      {status !== 'loading' && (
        <p className={`text-sm ${status === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message}
        </p>
      )}

      <div className="flex flex-col gap-2 text-sm text-text-secondary">
        <button
          type="button"
          onClick={handleOpenSignIn}
          className="font-medium text-accent underline-offset-2 transition hover:underline"
        >
          Go to sign in
        </button>
        <button
          type="button"
          onClick={handleOpenSignUp}
          className="font-medium text-accent/80 underline-offset-2 transition hover:underline"
        >
          Need a new account?
        </button>
      </div>
    </div>
  );
}
