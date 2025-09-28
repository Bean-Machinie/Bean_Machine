import { memo, useCallback, useMemo, useState } from 'react';
import type { KeyboardEvent, MouseEvent } from 'react';

import { Project } from '../context/ProjectContext';

interface ProjectOverviewPanelProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
  onToggleFavorite: (projectId: string) => void;
}

interface ProjectCardProps {
  project: Project;
  onOpenProject: (projectId: string) => void;
  onToggleFavorite: (projectId: string) => void;
}

const relativeTimeFormatter = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });

const timeDivisions: { limit: number; divisor: number; unit: Intl.RelativeTimeFormatUnit }[] = [
  { limit: 60, divisor: 1, unit: 'second' },
  { limit: 3600, divisor: 60, unit: 'minute' },
  { limit: 86400, divisor: 3600, unit: 'hour' },
  { limit: 604800, divisor: 86400, unit: 'day' },
  { limit: 2629746, divisor: 604800, unit: 'week' },
  { limit: 31556952, divisor: 2629746, unit: 'month' },
  { limit: Infinity, divisor: 31556952, unit: 'year' },
];

const formatEditedLabel = (isoDate: string) => {
  const editedDate = new Date(isoDate);

  if (Number.isNaN(editedDate.getTime())) {
    return 'Edited recently';
  }

  const diffInSeconds = (editedDate.getTime() - Date.now()) / 1000;

  for (const division of timeDivisions) {
    if (Math.abs(diffInSeconds) < division.limit) {
      const relativeValue = diffInSeconds / division.divisor;
      return `Edited ${relativeTimeFormatter.format(Math.round(relativeValue), division.unit)}`;
    }
  }

  return 'Edited recently';
};

const ProjectCard = memo(({ project, onOpenProject, onToggleFavorite }: ProjectCardProps) => {
  const handleOpen = useCallback(() => onOpenProject(project.id), [onOpenProject, project.id]);
  const handleToggleFavorite = useCallback(
    (event: MouseEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      onToggleFavorite(project.id);
    },
    [onToggleFavorite, project.id],
  );

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault();
        handleOpen();
      }
    },
    [handleOpen],
  );

  const editedLabel = useMemo(() => formatEditedLabel(project.updatedAt), [project.updatedAt]);

  const favoriteButtonClasses = `inline-flex h-10 w-10 items-center justify-center rounded-xl border transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
    project.favorite
      ? 'border-amber-400/60 bg-amber-300/20 text-amber-300'
      : 'border-border/70 bg-surface/40 text-text-muted hover:border-amber-300/70 hover:bg-amber-200/20 hover:text-amber-200'
  }`;

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      className="group flex h-full min-h-[14rem] flex-col justify-between rounded-2xl border border-border/80 bg-surface/60 p-6 text-left shadow-lg shadow-black/30 transition will-change-transform hover:-translate-y-1 hover:border-accent/70 hover:bg-surface-muted/80 hover:shadow-accent/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="text-xl font-semibold text-text-primary transition group-hover:text-accent/80">{project.name}</h3>
        <button
          type="button"
          onClick={handleToggleFavorite}
          className={favoriteButtonClasses}
          aria-pressed={project.favorite}
          aria-label={project.favorite ? 'Remove from favorites' : 'Add to favorites'}
        >
          <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
            <path
              fill="currentColor"
              d="M12 3.5l2.09 4.23 4.67.68-3.38 3.29.8 4.62L12 14.98l-4.18 2.24.8-4.62-3.38-3.29 4.67-.68z"
            />
          </svg>
        </button>
      </div>

      <p className="mt-6 text-sm text-text-secondary">
        {project.items.length === 0
          ? 'This world is waiting for its first idea.'
          : `${project.items.length} item${project.items.length === 1 ? '' : 's'} crafted inside.`}
      </p>

      <p className="mt-6 text-xs font-medium uppercase tracking-widest text-text-muted">{editedLabel}</p>
    </div>
  );
});

ProjectCard.displayName = 'ProjectCard';

type ProjectSortMode = 'recent' | 'favorites';

function ProjectOverviewPanel({ projects, onOpenProject, onCreateProject, onToggleFavorite }: ProjectOverviewPanelProps) {
  const [sortMode, setSortMode] = useState<ProjectSortMode>('recent');

  const sortedProjects = useMemo(
    () =>
      [...projects].sort(
        (a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime(),
      ),
    [projects],
  );

  const visibleProjects = useMemo(() => {
    if (sortMode === 'favorites') {
      return sortedProjects.filter((project) => project.favorite);
    }

    return sortedProjects;
  }, [sortedProjects, sortMode]);

  const handleSelectRecent = useCallback(() => setSortMode('recent'), []);
  const handleSelectFavorites = useCallback(() => setSortMode('favorites'), []);

  const hasFavorites = useMemo(() => projects.some((project) => project.favorite), [projects]);

  return (
    <section className="rounded-3xl border border-border bg-surface-muted/60 shadow-2xl shadow-black/40">
      <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-accent/70">Project Overview</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-text-primary sm:text-4xl">
            Continue crafting your tabletop worlds
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary sm:text-base">
            Access your active projects or start something brand new. Each project keeps boards, decks, posters, and assets neatly
            organized for fast iteration.
          </p>
        </div>
        <div className="flex flex-col items-stretch justify-end gap-3 sm:flex-row sm:items-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-surface/40 p-1">
            <button
              type="button"
              onClick={handleSelectRecent}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                sortMode === 'recent'
                  ? 'bg-accent text-accent-contrast shadow-sm shadow-accent/40'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={sortMode === 'recent'}
            >
              Recent
            </button>
            <button
              type="button"
              onClick={handleSelectFavorites}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
                sortMode === 'favorites'
                  ? 'bg-accent text-accent-contrast shadow-sm shadow-accent/40'
                  : 'text-text-secondary hover:text-text-primary'
              }`}
              aria-pressed={sortMode === 'favorites'}
            >
              Favorites
            </button>
          </div>
          <button
            type="button"
            onClick={onCreateProject}
            className="inline-flex items-center justify-center rounded-full border border-accent/60 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent/80 transition hover:bg-accent-strong/20 hover:text-text-primary"
          >
            New Project +
          </button>
        </div>
      </div>

      <div className="border-t border-border/60" />

      <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface-muted/40 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-text-secondary">No projects yet</p>
            <p className="mt-2 max-w-sm text-sm text-text-muted">When you create your first project it will appear here for quick access.</p>
            <button
              type="button"
              onClick={onCreateProject}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast transition hover:bg-accent-strong"
            >
              Start your first project
            </button>
          </div>
        ) : visibleProjects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface-muted/40 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-text-secondary">
              {sortMode === 'favorites' ? 'No favorites yet' : 'No projects to display'}
            </p>
            <p className="mt-2 max-w-sm text-sm text-text-muted">
              {sortMode === 'favorites'
                ? hasFavorites
                  ? 'Your favorites will appear here when they match the current filters.'
                  : 'Mark projects with the start icon to pin them here for quick access.'
                : 'Try creating a new project to see it show up in your overview.'}
            </p>
          </div>
        ) : (
          visibleProjects.map((project) => (
            <ProjectCard
              key={project.id}
              project={project}
              onOpenProject={onOpenProject}
              onToggleFavorite={onToggleFavorite}
            />
          ))
        )}
      </div>
    </section>
  );
}

ProjectOverviewPanel.displayName = 'ProjectOverviewPanel';

export default memo(ProjectOverviewPanel);
