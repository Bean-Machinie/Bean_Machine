import { ChangeEvent, FormEvent } from 'react';

import AvatarUploader from '../AvatarUploader';
import { type Profile } from '../../lib/profile';
import { SocialKey } from '../../hooks/useProfileSettings';

interface ProfileDetailsSectionProps {
  loading: boolean;
  profile: Profile | null;
  displayName: string;
  onDisplayNameChange: (value: string) => void;
  email: string;
  emailFallbackName: string;
  bio: string;
  onBioChange: (value: string) => void;
  socialLinks: Record<SocialKey, string>;
  onSocialChange: (key: SocialKey) => (event: ChangeEvent<HTMLInputElement>) => void;
  errorMessage: string | null;
  statusMessage: string | null;
  saving: boolean;
  onSubmit: (event: FormEvent<HTMLFormElement>) => void;
  onAvatarChange: (updated: Profile) => void;
  className?: string;
}

export default function ProfileDetailsSection({
  loading,
  profile,
  displayName,
  onDisplayNameChange,
  email,
  emailFallbackName,
  bio,
  onBioChange,
  socialLinks,
  onSocialChange,
  errorMessage,
  statusMessage,
  saving,
  onSubmit,
  onAvatarChange,
  className,
}: ProfileDetailsSectionProps) {
  if (loading) {
    return <p className="text-sm text-text-secondary">Loading your profile...</p>;
  }

  return (
    <form onSubmit={(event) => { void onSubmit(event); }} className={`flex flex-col gap-8 ${className ?? ''}`.trim()} noValidate>
      <AvatarUploader
        avatarUrl={profile?.avatarUrl}
        displayName={displayName || emailFallbackName}
        onAvatarChange={onAvatarChange}
      />

      <div className="flex flex-col gap-6">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-text-secondary">Display name</span>
          <input
            type="text"
            value={displayName}
            onChange={(event) => onDisplayNameChange(event.target.value)}
            placeholder="Call sign or alias"
            className="rounded-xl border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-text-secondary">Email</span>
          <input
            type="email"
            value={email}
            readOnly
            className="cursor-not-allowed rounded-xl border border-border bg-surface-muted px-3 py-2 text-base text-text-secondary"
          />
        </label>

        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-text-secondary">Bio</span>
          <textarea
            value={bio}
            onChange={(event) => onBioChange(event.target.value)}
            rows={4}
            placeholder="Share a few sentences about your creative style."
            className="rounded-xl border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          />
        </label>
      </div>

      <div className="flex flex-col gap-4">
        <h4 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Social accounts</h4>
        {[{ key: 'website', label: 'Website', placeholder: 'https://example.com' }, { key: 'discord', label: 'Discord', placeholder: 'username#1234' }, { key: 'twitter', label: 'Twitter / X', placeholder: '@gamemaker' }].map((field) => (
          <label key={field.key} className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-text-secondary">{field.label}</span>
            <input
              type="text"
              value={socialLinks[field.key as SocialKey]}
              onChange={onSocialChange(field.key as SocialKey)}
              placeholder={field.placeholder}
              className="rounded-xl border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
            />
          </label>
        ))}
      </div>

      {errorMessage && (
        <p className="text-sm font-semibold text-red-500" role="alert">
          {errorMessage}
        </p>
      )}

      <div className="flex flex-col gap-3 border-t border-border/80 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm" aria-live="polite">
          {statusMessage && <span className="font-semibold text-accent">{statusMessage}</span>}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center justify-center rounded-full bg-accent px-5 py-2.5 text-sm font-semibold text-accent-contrast transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {saving ? 'Saving...' : 'Update Profile'}
        </button>
      </div>
    </form>
  );
}
