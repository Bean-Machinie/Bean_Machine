import { ChangeEvent, FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

const NAV_ITEMS = [
  {
    id: 'profile',
    label: 'User Profile',
    description: 'Update your information and avatar.',
  },
  {
    id: 'appearance',
    label: 'Appearance',
    description: 'Choose the theme that suits your world.',
  },
] as const;

const PRESET_AVATARS = ['🐉', '🎲', '🧙', '🛡️', '🗺️', '⚔️'];

type SectionId = (typeof NAV_ITEMS)[number]['id'];
type AvatarState = { type: 'preset'; value: string } | { type: 'upload'; value: string };

type SocialKey = 'website' | 'discord' | 'twitter';

export default function ProfilePage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { themeId, availableThemes, setThemeId } = useTheme();
  const defaultName = useMemo(() => user?.email?.split('@')[0] ?? '', [user?.email]);
  const [selectedSection, setSelectedSection] = useState<SectionId>('profile');
  const [displayName, setDisplayName] = useState(defaultName);
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<SocialKey, string>>({
    website: '',
    discord: '',
    twitter: '',
  });
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [avatar, setAvatar] = useState<AvatarState>({ type: 'preset', value: PRESET_AVATARS[0] });
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isSigningOut, setIsSigningOut] = useState(false);

  useEffect(() => {
    setDisplayName(defaultName);
  }, [defaultName]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  useEffect(() => {
    return () => {
      if (uploadedImage) {
        URL.revokeObjectURL(uploadedImage);
      }
    };
  }, [uploadedImage]);

  if (!user) {
    return null;
  }

  const handleSocialChange = (key: SocialKey) => (event: ChangeEvent<HTMLInputElement>) => {
    const value = event.target.value;
    setSocialLinks((prev) => ({ ...prev, [key]: value }));
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  const handleAvatarUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
    }

    setUploadedImage(previewUrl);
    setAvatar({ type: 'upload', value: previewUrl });
  };

  const handlePresetAvatar = (icon: string) => {
    if (uploadedImage) {
      URL.revokeObjectURL(uploadedImage);
      setUploadedImage(null);
    }

    setAvatar({ type: 'preset', value: icon });
  };

  const handleSaveProfile = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatusMessage('Your profile updates are saved for this session.');
  };

  const handleSignOut = async () => {
    setIsSigningOut(true);
    try {
      await signOut();
      navigate('/');
    } finally {
      setIsSigningOut(false);
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
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedSection(item.id)}
                className={`w-full rounded-2xl border px-5 py-4 text-left transition ${
                  isActive
                    ? 'border-accent bg-surface shadow-sm'
                    : 'border-border bg-surface-muted/60 hover:border-accent/60 hover:bg-surface'
                }`}
              >
                <p className="text-base font-semibold text-text-primary">{item.label}</p>
                <p className="mt-1 text-xs text-text-secondary">{item.description}</p>
              </button>
            );
          })}
        </aside>

        <section className="flex-1 rounded-2xl border border-border bg-surface px-6 py-8 shadow-sm">
          {selectedSection === 'profile' ? (
            <div className="flex flex-col gap-8">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-text-primary">Profile details</h3>
                <p className="text-sm text-text-secondary">Tell others about your creative persona.</p>
              </div>

              <form onSubmit={handleSaveProfile} className="flex flex-col gap-8">
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="flex flex-col items-center gap-3 md:items-start">
                    <button
                      type="button"
                      onClick={handleAvatarClick}
                      className="group relative flex h-32 w-32 items-center justify-center overflow-hidden rounded-full border border-border bg-surface-muted text-5xl shadow-sm transition hover:border-accent hover:shadow-lg"
                    >
                      {avatar.type === 'upload' ? (
                        <img src={avatar.value} alt="Custom avatar" className="h-full w-full object-cover" />
                      ) : (
                        <span>{avatar.value}</span>
                      )}
                      <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 rounded-full bg-black/50 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100">
                        Change
                      </span>
                    </button>

                    <div className="flex flex-wrap justify-center gap-2 md:justify-start">
                      {PRESET_AVATARS.map((icon) => {
                        const isCurrent = avatar.type === 'preset' && avatar.value === icon;
                        return (
                          <button
                            key={icon}
                            type="button"
                            onClick={() => handlePresetAvatar(icon)}
                            className={`inline-flex h-10 w-10 items-center justify-center rounded-full border text-xl transition ${
                              isCurrent
                                ? 'border-accent bg-accent/10 text-accent'
                                : 'border-border text-text-secondary hover:border-accent/60 hover:text-accent'
                            }`}
                            aria-pressed={isCurrent}
                          >
                            <span>{icon}</span>
                          </button>
                        );
                      })}
                      <button
                        type="button"
                        onClick={handleAvatarClick}
                        className="inline-flex items-center justify-center rounded-full border border-border px-3 py-2 text-xs font-semibold text-text-secondary transition hover:border-accent hover:text-accent"
                      >
                        Upload image
                      </button>
                    </div>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                    />
                  </div>

                  <div className="flex flex-col gap-1 text-center text-sm text-text-secondary md:text-left">
                    <span className="font-semibold text-text-primary">Account email</span>
                    <span className="break-all">{user.email}</span>
                    <span className="text-xs text-text-muted">Used for sign in and important updates.</span>
                  </div>
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-text-secondary">Display name</span>
                    <input
                      type="text"
                      value={displayName}
                      onChange={(event) => setDisplayName(event.target.value)}
                      placeholder="Call sign or alias"
                      className="rounded border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                  </label>

                  <label className="md:col-span-2 flex flex-col gap-2 text-sm">
                    <span className="font-medium text-text-secondary">Bio</span>
                    <textarea
                      value={bio}
                      onChange={(event) => setBio(event.target.value)}
                      rows={4}
                      placeholder="Share a few sentences about your creative style."
                      className="rounded border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                    />
                    <span className="text-xs text-text-muted">This will appear on collaborative documents.</span>
                  </label>
                </div>

                <div className="space-y-3">
                  <h4 className="text-sm font-semibold uppercase tracking-wide text-text-secondary">Social accounts</h4>
                  <div className="grid gap-4 md:grid-cols-2">
                    {socialFields.map((field) => (
                      <label key={field.key} className="flex flex-col gap-2 text-sm">
                        <span className="font-medium text-text-secondary">{field.label}</span>
                        <input
                          type="text"
                          value={socialLinks[field.key]}
                          onChange={handleSocialChange(field.key)}
                          placeholder={field.placeholder}
                          className="rounded border border-border bg-background px-3 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
                        />
                      </label>
                    ))}
                  </div>
                </div>

                {statusMessage && <p className="text-sm font-semibold text-accent">{statusMessage}</p>}

                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded bg-accent px-5 py-2.5 text-sm font-semibold text-text-inverse transition hover:bg-accent/90"
                  >
                    Save changes
                  </button>

                  <button
                    type="button"
                    onClick={handleSignOut}
                    disabled={isSigningOut}
                    className="inline-flex items-center justify-center rounded border border-border px-5 py-2.5 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSigningOut ? 'Signing out…' : 'Sign out'}
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              <div className="space-y-1">
                <h3 className="text-xl font-semibold text-text-primary">Theme preferences</h3>
                <p className="text-sm text-text-secondary">
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
