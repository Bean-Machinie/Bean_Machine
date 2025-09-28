import { Project } from '../context/ProjectContext';

interface ProjectOverviewPanelProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
}

function ProjectOverviewPanel({ projects, onOpenProject, onCreateProject }: ProjectOverviewPanelProps) {
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
        <button
          type="button"
          onClick={onCreateProject}
          className="inline-flex items-center justify-center rounded-full border border-accent/60 bg-accent/10 px-4 py-2 text-sm font-semibold text-accent/80 transition hover:bg-accent-strong/20 hover:text-text-primary"
        >
          New Project +
        </button>
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
        ) : (
          projects.map((project) => (
            <button
              key={project.id}
              type="button"
              onClick={() => onOpenProject(project.id)}
              className="group flex flex-col rounded-2xl border border-border/80 bg-surface/60 p-6 text-left shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:border-accent/70 hover:bg-surface-muted/80 hover:shadow-accent/30"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-text-muted">Project</p>
                  <h3 className="mt-2 text-xl font-semibold text-text-primary transition group-hover:text-accent/80">
                    {project.name}
                  </h3>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-accent/80 transition group-hover:bg-accent-strong/20">
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="h-5 w-5 transform transition group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                  >
                    <path
                      fill="currentColor"
                      d="M8.75 7.25a.75.75 0 011.5 0v6.69l6.22-6.22a.75.75 0 011.06 1.06l-6.22 6.22h6.69a.75.75 0 010 1.5h-8.5a.75.75 0 01-.75-.75z"
                    />
                  </svg>
                </span>
              </div>
              <p className="mt-4 text-sm text-text-muted">
                {project.items.length > 0
                  ? `${project.items.length} item${project.items.length === 1 ? '' : 's'} ready to refine`
                  : 'No items added yet — jump in to get started.'}
              </p>
              {project.items.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-text-secondary">
                  {project.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-highlight" aria-hidden />
                      <span>{item.name}</span>
                    </li>
                  ))}
                  {project.items.length > 3 && (
                    <li className="text-xs uppercase tracking-widest text-text-muted">
                      +{project.items.length - 3} more
                    </li>
                  )}
                </ul>
              )}
            </button>
          ))
        )}
      </div>
    </section>
  );
}

export default ProjectOverviewPanel;
