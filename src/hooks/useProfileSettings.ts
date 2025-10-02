import { ChangeEvent, FormEvent, useCallback, useEffect, useMemo, useState } from 'react';

import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { type Profile, getProfile, updateProfile } from '../lib/profile';

export type SocialKey = 'website' | 'discord' | 'twitter';

export interface UseProfileSettingsResult {
  userEmail: string;
  emailFallbackName: string;
  profile: Profile | null;
  displayName: string;
  setDisplayName: (value: string) => void;
  bio: string;
  setBio: (value: string) => void;
  socialLinks: Record<SocialKey, string>;
  handleSocialChange: (key: SocialKey) => (event: ChangeEvent<HTMLInputElement>) => void;
  loadingProfile: boolean;
  saving: boolean;
  statusMessage: string | null;
  errorMessage: string | null;
  handleSubmit: (event: FormEvent<HTMLFormElement>) => Promise<void>;
  handleAvatarChange: (updatedProfile: Profile) => void;
  availableThemes: ReturnType<typeof useTheme>['availableThemes'];
  themeId: string;
  setThemeId: (themeId: string) => void;
  resetStatus: () => void;
}

const defaultSocialLinks: Record<SocialKey, string> = {
  website: '',
  discord: '',
  twitter: '',
};

export function useProfileSettings(): UseProfileSettingsResult {
  const { user, refreshUser } = useAuth();
  const { availableThemes, themeId, setThemeId } = useTheme();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [socialLinks, setSocialLinks] = useState<Record<SocialKey, string>>(defaultSocialLinks);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [saving, setSaving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const userEmail = user?.email ?? '';
  const emailFallbackName = useMemo(() => userEmail.split('@')[0] ?? '', [userEmail]);

  const hydrateProfile = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setDisplayName('');
      setBio('');
      setSocialLinks(defaultSocialLinks);
      setLoadingProfile(false);
      return;
    }

    let isActive = true;
    setLoadingProfile(true);

    try {
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
      setErrorMessage(null);
    } catch (error) {
      if (isActive) {
        setErrorMessage((error as Error).message);
      }
    } finally {
      if (isActive) {
        setLoadingProfile(false);
      }
    }

    return () => {
      isActive = false;
    };
  }, [emailFallbackName, user]);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    void (async () => {
      cleanup = await hydrateProfile();
    })();

    return () => {
      cleanup?.();
    };
  }, [hydrateProfile]);

  useEffect(() => {
    if (!statusMessage) {
      return;
    }

    const timeout = window.setTimeout(() => setStatusMessage(null), 4000);
    return () => window.clearTimeout(timeout);
  }, [statusMessage]);

  const handleSocialChange = useCallback(
    (key: SocialKey) => (event: ChangeEvent<HTMLInputElement>) => {
      const value = event.target.value;
      setSocialLinks((prev) => ({ ...prev, [key]: value }));
    },
    [],
  );

  const resetStatus = useCallback(() => {
    setStatusMessage(null);
    setErrorMessage(null);
  }, []);

  const handleSubmit = useCallback(
    async (event: FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      if (!user) {
        return;
      }

      setSaving(true);
      setErrorMessage(null);
      setStatusMessage(null);

      try {
        const updatedProfile = await updateProfile({
          displayName,
          bio,
          social: socialLinks,
        });
        setProfile(updatedProfile);
        setDisplayName(updatedProfile.displayName ?? '');
        setBio(updatedProfile.bio ?? '');
        setSocialLinks({
          website: updatedProfile.social.website ?? '',
          discord: updatedProfile.social.discord ?? '',
          twitter: updatedProfile.social.twitter ?? '',
        });
        setStatusMessage('Profile updated successfully.');
        await refreshUser();
      } catch (error) {
        setErrorMessage((error as Error).message);
      } finally {
        setSaving(false);
      }
    },
    [bio, displayName, socialLinks, refreshUser, user],
  );

  const handleAvatarChange = useCallback((updatedProfile: Profile) => {
    setProfile(updatedProfile);
    setErrorMessage(null);
    setStatusMessage('Avatar updated.');
  }, []);

  return {
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
    resetStatus,
  };
}
