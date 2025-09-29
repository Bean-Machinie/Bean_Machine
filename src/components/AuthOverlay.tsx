import { useEffect } from 'react';

import SignInPanel from '../pages/SignInPage';
import SignUpPanel from '../pages/SignUpPage';

interface AuthOverlayProps {
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
  onSwitch: (mode: 'signin' | 'signup') => void;
}

export default function AuthOverlay({ mode, onClose, onSuccess, onSwitch }: AuthOverlayProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 py-6">
      <div className="relative w-full max-w-md rounded-3xl border border-border/60 bg-surface px-6 py-8 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 inline-flex h-8 w-8 items-center justify-center rounded-full border border-border/70 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
        >
          <span aria-hidden>×</span>
          <span className="sr-only">Close</span>
        </button>

        {mode === 'signin' ? (
          <SignInPanel onSuccess={onSuccess} onSwitch={() => onSwitch('signup')} />
        ) : (
          <SignUpPanel onSuccess={onSuccess} onSwitch={() => onSwitch('signin')} />
        )}
      </div>
    </div>
  );
}
