import { ChangeEvent, useEffect, useRef, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { type Profile, uploadAvatar } from '../lib/profile';
import Avatar from './Avatar';

interface AvatarUploaderProps {
  avatarUrl?: string | null;
  displayName?: string | null;
  onAvatarChange?: (profile: Profile) => void;
}

const MAX_FILE_SIZE = 4 * 1024 * 1024;

/**
 * Reusable avatar picker that handles validation, upload progress, and session
 * refresh. Parent components receive the updated profile via `onAvatarChange`.
 */
export default function AvatarUploader({ avatarUrl, displayName, onAvatarChange }: AvatarUploaderProps) {
  const { refreshUser } = useAuth();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<'idle' | 'uploading'>('idle');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleSelectFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      setError('Please choose an image file.');
      event.target.value = '';
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      setError('Avatar images must be 4MB or smaller.');
      event.target.value = '';
      return;
    }

    const localPreview = URL.createObjectURL(file);
    setPreviewUrl((existing) => {
      if (existing) {
        URL.revokeObjectURL(existing);
      }
      return localPreview;
    });

    setStatus('uploading');
    setError(null);

    try {
      const result = await uploadAvatar(file);
      onAvatarChange?.(result.profile);
      await refreshUser();
      setPreviewUrl(null);
      setError(null);
    } catch (uploadError) {
      setError((uploadError as Error).message);
    } finally {
      setStatus('idle');
      event.target.value = '';
      setPreviewUrl(null);
      URL.revokeObjectURL(localPreview);
    }
  };

  const currentAvatar = previewUrl ?? avatarUrl ?? null;

  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <button
        type="button"
        onClick={handleSelectFile}
        aria-label="Change avatar"
        className="group relative flex h-32 w-32 items-center justify-center rounded-full border border-border bg-surface-muted/60 text-sm font-medium text-text-primary shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:border-accent"
      >
        <Avatar src={currentAvatar} alt="Profile avatar" name={displayName} size={128} />
        <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100">
          {status === 'uploading' ? 'Uploading…' : 'Change'}
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="sr-only"
      />

      <p className="text-xs text-text-muted">PNG, JPG, GIF or WebP up to 4MB.</p>

      {status === 'uploading' && (
        <p className="text-xs font-semibold text-accent" aria-live="polite">
          Uploading avatar…
        </p>
      )}

      {error && (
        <p className="text-xs font-semibold text-red-500" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
