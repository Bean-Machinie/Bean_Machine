import { FormEvent, useEffect, useMemo, useState } from 'react';

import CloseButton from './CloseButton';
import ModalTransition from './ModalTransition';
import ProfileDetailsSection from './settings/ProfileDetailsSection';
import ThemePreferencesSection from './settings/ThemePreferencesSection';
import { GearIcon, ProjectSettingsIcon, SparkleIcon, UserIcon } from './icons';
import { Project } from '../context/ProjectContext';
import { useProfileSettings } from '../hooks/useProfileSettings';

interface ProjectSettingsDialogProps {
  open: boolean;
  onClose: () => void;
  project: Project | null;
  onRenameProject: (projectId: string, name: string) => Promise<void>;
}

type SettingsSection = 'general' | 'profile' | 'appearance';

const NAV_ITEMS = [
  {
    id: 'general' as SettingsSection,
    label: 'General',
    description: 'Project basics and metadata.',
    icon: GearIcon,
  },
  {
    id: 'profile' as SettingsSection,
    label: 'User Profile',
    description: 'Sync your creator identity.',
    icon: UserIcon,
  },
  {
    id: 'appearance' as SettingsSection,
    label: 'Appearance',
    description: 'Themes and visual style.',
    icon: SparkleIcon,
  },
];

export default function ProjectSettingsDialog({ open, onClose, project, onRenameProject }: ProjectSettingsDialogProps) {
  const [activeSection, setActiveSection] = useState<SettingsSection>('general');
  const [projectName, setProjectName] = useState('');
  const [renaming, setRenaming] = useState(false);
  const [renameStatus, setRenameStatus] = useState<string | null>(null);
  const [renameError, setRenameError] = useState<string | null>(null);

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
    resetStatus,
  } = useProfileSettings();

  useEffect(() => {
    if (!open) {
      return;
    }

    setActiveSection('general');
    setRenameStatus(null);
    setRenameError(null);
    resetStatus();
  }, [open, resetStatus]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (project) {
      setProjectName(project.name);
    } else {
      setProjectName('');
    }
  }, [open, project]);

  const formattedUpdatedAt = useMemo(() => {
    if (!project) {
      return null;
    }

    const date = new Date(project.updatedAt);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleString();
  }, [project]);

  const handleRenameSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!project) {
      return;
    }

    const trimmed = projectName.trim();
    if (!trimmed) {
      setRenameError('Project name cannot be empty.');
      setRenameStatus(null);
      return;
    }

    if (trimmed === project.name) {
      setRenameError(null);
      setRenameStatus('No changes to save.');
      return;
    }

    try {
      setRenaming(true);
      setRenameError(null);
      setRenameStatus(null);
      await onRenameProject(project.id, trimmed);
      setProjectName(trimmed);
      setRenameStatus('Project name updated.');
    } catch (error) {
      setRenameError((error as Error).message ?? 'Failed to update project name.');
    } finally {
      setRenaming(false);
    }
  };

  const generalSection = project ? (
    <form onSubmit={handleRenameSubmit} className="flex flex-col gap-6" noValidate>
      <div className="flex flex-col gap-2">
        <label className="text-sm font-medium text-text-secondary" htmlFor="project-settings-name">
          Project name
        </label>
        <input
          id="project-settings-name"
          type="text"
          value={projectName}
          onChange={(event) => setProjectName(event.target.value)}
          className="rounded-xl border border-border bg-background px-4 py-2 text-base text-text-primary focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/30"
          placeholder="Give your project a memorable title"
        />
      </div>

      <div className="rounded-2xl border border-border/80 bg-surface-muted/60 px-4 py-3 text-sm text-text-secondary">
        {formattedUpdatedAt ? (
          <p>
            <span className="font-semibold text-text-primary">Last updated:</span> {formattedUpdatedAt}
          </p>
        ) : (
          <p className="text-text-secondary">Keep track of updates as you iterate on this project.</p>
        )}
      </div>

      {renameError && (
        <p className="text-sm font-semibold text-red-500" role="alert">
          {renameError}
        </p>
      )}
      {renameStatus && !renameError && (
        <p className="text-sm font-semibold text-accent" aria-live="polite">
          {renameStatus}
        </p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => {
            if (project) {
              setProjectName(project.name);
              setRenameError(null);
              setRenameStatus('Reverted to the current project name.');
            }
          }}
          className="rounded-full border border-border/80 px-5 py-2 text-sm font-semibold text-text-secondary transition hover:border-accent hover:text-text-primary"
        >
          Reset
        </button>
        <button
          type="submit"
          disabled={renaming}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-70"
        >
          {renaming ? 'Saving...' : 'Save changes'}
        </button>
      </div>
    </form>
  ) : (
    <div className="rounded-2xl border border-dashed border-border/60 bg-surface-muted/50 px-4 py-6 text-center text-sm text-text-secondary">
      This project could not be loaded. Return to the dashboard and re-open to continue editing.
    </div>
  );

  const profileSection = (
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
  );

  const appearanceSection = (
    <ThemePreferencesSection
      availableThemes={availableThemes}
      activeThemeId={themeId}
      onSelectTheme={setThemeId}
    />
  );

  const activeContent = activeSection === 'general' ? generalSection : activeSection === 'profile' ? profileSection : appearanceSection;

  return (
    <ModalTransition
      open={open}
      onClose={onClose}
      labelledBy="project-settings-title"
      overlayClassName="bg-overlay/80 p-4"
      panelClassName="w-full max-w-5xl h-[85vh] lg:min-h-[34rem] overflow-hidden rounded-3xl border border-border bg-surface-elevated/95 shadow-2xl shadow-black/60 focus:outline-none"    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="flex items-center justify-between border-b border-border/70 px-6 py-5">
          <div className="flex items-center gap-3">
            <ProjectSettingsIcon className="h-6 w-6 text-accent" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-accent/70">Project Settings</p>
              <h2 id="project-settings-title" className="mt-1 text-xl font-semibold text-text-primary">
                Control how this project behaves
              </h2>
            </div>
          </div>
          <CloseButton onClick={onClose} label="Close project settings" />
        </div>

        <div className="flex flex-1 min-h-0 flex-col gap-6 px-6 py-6 lg:flex-row lg:items-stretch lg:gap-8">
          <nav className="flex w-full flex-col gap-3 lg:max-w-xs lg:flex-shrink-0 lg:self-stretch" aria-label="Project settings">
            {NAV_ITEMS.map((item) => {
              const isActive = activeSection === item.id;
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveSection(item.id)}
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
          </nav>

          <div className="flex-1 min-w-0 min-h-0 overflow-hidden lg:min-h-[24rem]">
            <div className="flex h-full min-h-0 flex-col rounded-2xl border border-border/70 bg-surface">
              <div className="flex-1 min-h-0 overflow-y-auto px-5 py-6">
                {activeContent}
              </div>
            </div>
          </div>
        </div>
      </div>
    </ModalTransition>
  );
}


