import { useEffect, useId, useRef } from 'react';

import SignInPanel from '../pages/SignInPage';
import SignUpPanel from '../pages/SignUpPage';
import CloseButton from './CloseButton';
import ModalTransition from './ModalTransition';

interface AuthOverlayProps {
  open: boolean;
  mode: 'signin' | 'signup';
  onClose: () => void;
  onSuccess: () => void;
  onSwitch: (mode: 'signin' | 'signup') => void;
}

export default function AuthOverlay({ open, mode, onClose, onSuccess, onSwitch }: AuthOverlayProps) {
  const titleId = useId();
  const firstFieldRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open && firstFieldRef.current) {
      firstFieldRef.current.focus({ preventScroll: true });
    }
  }, [mode, open]);

  return (
    <ModalTransition
      open={open}
      onClose={onClose}
      labelledBy={titleId}
      initialFocusRef={firstFieldRef}
      overlayClassName="bg-black/60 px-4 py-6"
      panelClassName="relative w-full max-w-md rounded-3xl border border-border/60 bg-surface px-6 py-8 shadow-2xl"
    >
      <CloseButton
        onClick={onClose}
        className="absolute right-4 top-4"
        label={mode === 'signin' ? 'Close sign in dialog' : 'Close sign up dialog'}
      />

      {mode === 'signin' ? (
        <SignInPanel
          onSuccess={onSuccess}
          onSwitch={() => onSwitch('signup')}
          titleId={titleId}
          initialFocusRef={firstFieldRef}
        />
      ) : (
        <SignUpPanel
          onSuccess={onSuccess}
          onSwitch={() => onSwitch('signin')}
          titleId={titleId}
          initialFocusRef={firstFieldRef}
        />
      )}
    </ModalTransition>
  );
}
