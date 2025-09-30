import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import AvatarUploader from '../components/AvatarUploader';
import { SparkleIcon, UserIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { type Profile, getProfile, updateProfile } from '../lib/profile';

const NAV_ITEMS = [
  {
    id: 'profile',
    label: 'User Profile',
    description: 'Update your information and avatar.',
    icon: UserIcon,
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Choose the theme that suits your world.',
    icon: SparkleIcon,
  },
] as const;

type SectionId = (typeof NAV_ITEMS)[number]['id'];
type SocialKey = 'website' | 'discord' | 'twitter';

export default function ProfilePage() {
  const { user, refreshUser } = useAuth();
  const { themeId, availableThemes, setThemeId } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = (searchParams.get('section') as SectionId | null) ?? 'profile';
  const emailFallbackName = useMemo(() => user?.email?.split('@')[0] ?? '', [user?.email]);
  const [selectedSection, setSelectedSection] = useState<SectionId>(initialSection);
  const sectionHeadingRefs = useRef<Record<SectionId, HTMLHeadingElement | null>>({
    profile: null,
    appearance: null,
  });
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState(emailFallbackName);
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<SocialKey, string>>({
    website: '',
    discord: '',
    twitter: '',
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  useEffect(() => {
    const section = (searchParams.get('section') as SectionId | null) ?? 'profile';
    setSelectedSection(section);
  }, [searchParams]);

  useEffect(() => {
    const heading = sectionHeadingRefs.current[selectedSection];
    heading?.focus();
  }, [selectedSection]);

  useEffect(() => {
    let isActive = true;

    const hydrateProfile = async () => {
      try {
        setLoadingProfile(true);
        const profileData = await getProfile();
        if (!isActive) {
          return;
        }

        setProfile(profileData);
        setDisplayName(profileData.displayName ?? emailFallbackName);
        setBio(profileData.bio ?? '');
        setSocialLinks({
          website: profileData.social.website ?? '',
          discord: profileData.social.discord ?? '',
          twitter: profileData.social.twitter ?? '',
        });
      } catch (error) {
        if (isActive) {
          setErrorMessage((error as Error).message);
        }
      } finally {
        if (isActive) {
          setLoadingProfile(false);
        }
      }
    };

    void hydrateProfile();

    return () => {
      isActive = false;
    };
  }, [emailFallbackName]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  if (!user) {
    return null;
  }

  const handleSocialChange = (key: SocialKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  };

  const handleSectionChange = (section: SectionId) => {
    if (section === selectedSection) {
      return;
    }

    setSelectedSection(section);
    const next = new URLSearchParams(searchParams);
    if (section === 'profile') {
      next.delete('section');
    } else {
      next.set('section', section);
    }
    setSearchParams(next, { replace: true });
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setErrorMessage(null);
    setStatusMessage(null);
    try {
      const updated = await updateProfile({
        displayName,
        bio,
        social: socialLinks,
      });
      setProfile(updated);
      setDisplayName(updated.displayName ?? '');
      setBio(updated.bio ?? '');
      setSocialLinks({
        website: updated.social.website ?? '',
        discord: updated.social.discord ?? '',
        twitter: updated.social.twitter ?? '',
      });
      setStatusMessage('Profile updated successfully.');
      await refreshUser();
    } catch (error) {
      setErrorMessage((error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  const socialFields: { key: SocialKey; label: string; placeholder: string }[] = [
    { key: 'website', label: 'Website', placeholder: 'https://example.com' },
    { key: 'discord', label: 'Discord', placeholder: 'username#1234' },
    { key: 'twitter', label: 'Twitter / X', placeholder: '@gamemaker' },
  ];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 sm:py-16">
      <header className="space-y-2">
        <h2 className="text-3xl font-semibold text-text-primary">Account</h2>
        <p className="text-sm text-text-secondary">
          Manage how you appear to other creators and fine-tune the app to match your style.
        </p>
      </header>

      <div className="flex flex-col gap-6 lg:flex-row">
        <aside className="flex w-full flex-col gap-3 lg:max-w-xs">
          {NAV_ITEMS.map((item) => {
            const isActive = selectedSection === item.id;
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSectionChange(item.id)}
                className={`flex w-full items-center justify-between rounded-2xl border px-5 py-4 text-left transition ${
                  isActive
                    ? 'border-accent bg-surface shadow-sm'
                    : 'border-border bg-surface-muted/60 hover:border-accent/60 hover:bg-surface'
                }`}
                aria-pressed={isActive}
              >
                <div className="flex flex-col gap-1">
                  <p className="text-base font-semibold text-text-primary">{item.label}</p>
                  <p className="text-xs text-text-secondary">{item.description}</p>
                </div>
                <Icon className="ml-4 h-6 w-6 text-text-secondary" />
              </button>
            );
          })}
        </aside>

        <section className="flex-1 rounded-2xl border border-border bg-surface px-6 py-8 shadow-sm">
          {selectedSection === 'profile' ? (
            <div className="flex flex-col gap-8">
              <div className="border-b border-border pb-4">
                <h3
                  ref={(node) => {
                    sectionHeadingRefs.current.profile = node;
                  }}
                  tabIndex={-1}
                  className="text-2xl font-semibold text-text-primary"
                >
                  Profile details
                </h3>
                <p className="mt-2 text-sm text-text-secondary">Tell others about your creative persona.</p>
              </div>

              {loadingProfile ? (
                <p className="text-sm text-text-secondary">Loading your profile…</p>
              ) : (
                <form onSubmit={handleSaveProfile} className="flex flex-col gap-8" noValidate>
                  <AvatarUploader
                    avatarUrl={profile?.avatarUrl}
                    displayName={displayName || emailFallbackName}
                    onAvatarChange={(updatedProfile) => {
                      setProfile(updatedProfile);
                      setErrorMessage(null);
                      setStatusMessage('Avatar updated.');
                    }}
                  />

                  <div className="flex flex-col gap-6">
                    <label className="flex flex-col gap-2 text-sm">
                      <span className="font-medium text-text-secondary">Display name</span>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(event) => setDisplayName(event.target.value)}
                        placeholder="Call sign or alias"
                        className="rounded-xl border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm">
                      <span className="font-medium text-text-secondary">Email</span>
                      <input
                        type="email"
                        value={user.email}
                        readOnly
                        className="cursor-not-allowed rounded-xl border border-border bg-surface-muted px-3 py-2 text-base text-text-secondary"
                      />
                    </label>

                    <label className="flex flex-col gap-2 text-sm">
                      <span className="font-medium text-text-secondary">Bio</span>
                      <textarea
                        value={bio}
                        onChange={(event) => setBio(event.target.value)}
                        rows={4}
                        placeholder="Share a few sentences about your creative style."
                        className="rounded-xl border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                      />
                    </label>
                  </div>

                  <div className="flex flex-col gap-4">
                    <h4 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Social accounts</h4>
                    {socialFields.map((field) => (
                      <label key={field.key} className="flex flex-col gap-2 text-sm">
                        <span className="font-medium text-text-secondary">{field.label}</span>
                        <input
                          type="text"
                          value={socialLinks[field.key]}
                          onChange={handleSocialChange(field.key)}
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
                      {saving ? 'Saving…' : 'Update Profile'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="border-b border-border pb-4">
                <h3
                  ref={(node) => {
                    sectionHeadingRefs.current.appearance = node;
                  }}
                  tabIndex={-1}
                  className="text-2xl font-semibold text-text-primary"
                >
                  Theme preferences
                </h3>
                <p className="mt-2 text-sm text-text-secondary">
                  Pick a preset to instantly update the interface colors. Previews show how panels and accents will look.
                </p>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                {availableThemes.map((theme) => {
                  const isActive = themeId === theme.id;
                  const backgroundGradient = `linear-gradient(135deg, ${theme.tokens['--color-background']}, ${
                    theme.tokens['--color-surface-elevated'] ?? theme.tokens['--color-surface']
                  })`;

                  return (
                    <button
                      key={theme.id}
                      type="button"
                      onClick={() => setThemeId(theme.id)}
                      className={`flex flex-col overflow-hidden rounded-2xl border text-left transition ${
                        isActive ? 'border-accent ring-2 ring-accent/40' : 'border-border hover:border-accent/60'
                      }`}
                      aria-pressed={isActive}
                    >
                      <div className="relative h-28 w-full" style={{ background: backgroundGradient }}>
                        <div
                          className="absolute left-4 top-4 h-12 w-12 rounded-full shadow-lg"
                          style={{ backgroundColor: theme.tokens['--color-accent'] }}
                        />
                        <div
                          className="absolute bottom-4 right-4 h-3/4 w-1/3 rounded-lg border border-white/30 bg-white/20 backdrop-blur"
                        />
                      </div>
                      <div className="flex items-center justify-between px-5 py-4">
                        <div>
                          <p className="text-base font-semibold text-text-primary">{theme.label}</p>
                          <p className="text-xs uppercase tracking-wide text-text-secondary">
                            {theme.colorScheme === 'dark' ? 'Dark theme' : 'Light theme'}
                          </p>
                        </div>
                        {isActive && (
                          <span className="rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
                            Active
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
