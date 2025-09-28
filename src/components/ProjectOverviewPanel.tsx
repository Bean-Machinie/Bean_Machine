import { Project } from '../context/ProjectContext';

interface ProjectOverviewPanelProps {
  projects: Project[];
  onOpenProject: (projectId: string) => void;
  onCreateProject: () => void;
}

function ProjectOverviewPanel({ projects, onOpenProject, onCreateProject }: ProjectOverviewPanelProps) {
  return (
    <section className="rounded-3xl border border-slate-800 bg-slate-900/60 shadow-2xl shadow-slate-950/40">
      <div className="flex flex-col gap-6 p-8 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300/80">Project Overview</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Continue crafting your tabletop worlds
          </h2>
          <p className="mt-3 max-w-2xl text-sm text-slate-300 sm:text-base">
            Access your active projects or start something brand new. Each project keeps boards, decks, posters, and assets neatly
            organized for fast iteration.
          </p>
        </div>
        <button
          type="button"
          onClick={onCreateProject}
          className="inline-flex items-center justify-center rounded-full border border-emerald-500/60 bg-emerald-500/10 px-4 py-2 text-sm font-semibold text-emerald-200 transition hover:bg-emerald-400/20 hover:text-white"
        >
          New Project +
        </button>
      </div>

      <div className="border-t border-slate-800/60" />

      <div className="grid gap-6 p-8 sm:grid-cols-2 lg:grid-cols-3">
        {projects.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700/70 bg-slate-900/40 px-6 py-12 text-center">
            <p className="text-lg font-semibold text-slate-200">No projects yet</p>
            <p className="mt-2 max-w-sm text-sm text-slate-400">When you create your first project it will appear here for quick access.</p>
            <button
              type="button"
              onClick={onCreateProject}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-emerald-500 px-5 py-2 text-sm font-semibold text-slate-950 transition hover:bg-emerald-400"
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
              className="group flex flex-col rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 text-left shadow-lg shadow-black/30 transition hover:-translate-y-1 hover:border-emerald-500/70 hover:bg-slate-900/80 hover:shadow-emerald-500/20"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-slate-400">Project</p>
                  <h3 className="mt-2 text-xl font-semibold text-white transition group-hover:text-emerald-200">
                    {project.name}
                  </h3>
                </div>
                <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-200 transition group-hover:bg-emerald-400/20">
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
              <p className="mt-4 text-sm text-slate-400">
                {project.items.length > 0
                  ? `${project.items.length} item${project.items.length === 1 ? '' : 's'} ready to refine`
                  : 'No items added yet — jump in to get started.'}
              </p>
              {project.items.length > 0 && (
                <ul className="mt-4 space-y-2 text-sm text-slate-300">
                  {project.items.slice(0, 3).map((item) => (
                    <li key={item.id} className="flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
                      <span>{item.name}</span>
                    </li>
                  ))}
                  {project.items.length > 3 && (
                    <li className="text-xs uppercase tracking-widest text-slate-500">
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
