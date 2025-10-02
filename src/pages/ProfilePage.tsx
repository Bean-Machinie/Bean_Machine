import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';

import ProfileDetailsSection from '../components/settings/ProfileDetailsSection';
import ThemePreferencesSection from '../components/settings/ThemePreferencesSection';
import { SparkleIcon, UserIcon } from '../components/icons';
import { useAuth } from '../context/AuthContext';
import { useProfileSettings } from '../hooks/useProfileSettings';

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

export default function ProfilePage() {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = (searchParams.get('section') as SectionId | null) ?? 'profile';
  const [selectedSection, setSelectedSection] = useState<SectionId>(initialSection);
  const sectionHeadingRefs = useRef<Record<SectionId, HTMLHeadingElement | null>>({
    profile: null,
    appearance: null,
  });

  const {
    userEmail,
    emailFallbackName,
    profile,
    displayName,
    setDisplayName,
    bio,
    setBio,
    socialLinks,
    handleSocialChange,
    loadingProfile,
    saving,
    statusMessage,
    errorMessage,
    handleSubmit,
    handleAvatarChange,
    availableThemes,
    themeId,
    setThemeId,
  } = useProfileSettings();

  useEffect(() => {
    const section = (searchParams.get('section') as SectionId | null) ?? 'profile';
    setSelectedSection(section);
  }, [searchParams]);

  useEffect(() => {
    const heading = sectionHeadingRefs.current[selectedSection];
    heading?.focus();
  }, [selectedSection]);

  if (!user) {
    return null;
  }

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

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-10 px-6 py-12 sm:py-6">
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

              <ProfileDetailsSection
                loading={loadingProfile}
                profile={profile}
                displayName={displayName}
                onDisplayNameChange={(value) => setDisplayName(value)}
                email={userEmail}
                emailFallbackName={emailFallbackName}
                bio={bio}
                onBioChange={(value) => setBio(value)}
                socialLinks={socialLinks}
                onSocialChange={handleSocialChange}
                errorMessage={errorMessage}
                statusMessage={statusMessage}
                saving={saving}
                onSubmit={handleSubmit}
                onAvatarChange={handleAvatarChange}
              />
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

              <ThemePreferencesSection
                availableThemes={availableThemes}
                activeThemeId={themeId}
                onSelectTheme={setThemeId}
              />
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
