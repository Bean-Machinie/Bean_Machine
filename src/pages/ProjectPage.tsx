import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import ImageAssetBrowser from '../components/ImageAssetBrowser';
import NewItemDialog from '../components/NewItemDialog';
import { AssetInput, ItemInput, Project } from '../context/ProjectContext';
import { findProject, useProjects } from '../context/ProjectContext';

function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, updateProjectName, addItemToProject, addAssetsToProject, removeAssetsFromProject } = useProjects();
  const [isCollapsed, setCollapsed] = useState(false);
  const [isEditingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isItemDialogOpen, setItemDialogOpen] = useState(false);
  const [isAssetBrowserOpen, setAssetBrowserOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const project: Project | null = useMemo(() => {
    if (!projectId) {
      return null;
    }
    return findProject(projects, projectId);
  }, [projects, projectId]);

  useEffect(() => {
    if (project) {
      setTitleValue(project.name);
    }
  }, [project]);

  useEffect(() => {
    if (statusMessage) {
      const timeout = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [statusMessage]);

  if (!project) {
    return (
      <section className="flex flex-col items-center justify-center gap-6 rounded-3xl border border-border bg-surface-muted/40 p-12 text-center">
        <h2 className="text-3xl font-semibold text-text-primary">Project not found</h2>
        <p className="max-w-md text-sm text-text-secondary">
          The project you are trying to open does not exist or may have been removed. Return to the dashboard to view your
          projects or start a new one.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast transition hover:bg-accent-strong"
        >
          Back to home
        </button>
      </section>
    );
  }

  const filteredItems = project.items.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const handleRename = () => {
    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === project.name) {
      setTitleValue(project.name);
      setEditingTitle(false);
      return;
    }

    updateProjectName(project.id, trimmed);
    setEditingTitle(false);
    setStatusMessage('Project name updated');
  };

  const handleAddItem = (item: ItemInput) => {
    addItemToProject(project.id, item);
    setStatusMessage(`${item.name} added to ${project.name}`);
  };

  const handleAddAssets = (assets: AssetInput[]) => {
    addAssetsToProject(project.id, assets);
    setStatusMessage(`${assets.length} asset${assets.length === 1 ? '' : 's'} added to the library`);
  };

  const handleRemoveAssets = (assetIds: string[]) => {
    if (assetIds.length === 0) {
      return;
    }
    removeAssetsFromProject(project.id, assetIds);
    setStatusMessage(`${assetIds.length} asset${assetIds.length === 1 ? '' : 's'} deleted`);
  };

  const handleLocateAsset = (assetId: string) => {
    const asset = project.assets.find((candidate) => candidate.id === assetId);
    if (asset) {
      setStatusMessage(`Coming soon: locate "${asset.name}" within your layouts.`);
    }
  };

  return (
    <div className="flex flex-col gap-6 lg:flex-row">
      <aside
        className={`relative flex w-full flex-col rounded-3xl border border-border bg-surface-muted/60 transition-all duration-300 lg:w-auto ${
          isCollapsed ? 'lg:max-w-[5.5rem] lg:p-4' : 'lg:max-w-xs lg:p-6'
        }`}
      >
        <button
          type="button"
          onClick={() => setCollapsed((prev) => !prev)}
          className="absolute right-4 top-4 hidden h-9 w-9 items-center justify-center rounded-full border border-border/70 text-text-secondary transition hover:border-accent hover:text-accent/80 lg:flex"
          aria-label={isCollapsed ? 'Expand action menu' : 'Collapse action menu'}
        >
          <svg viewBox="0 0 24 24" className={`h-4 w-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} aria-hidden="true">
            <path
              fill="currentColor"
              d="M10.5 6.5a.75.75 0 10-1.06 1.06L12.88 11l-3.44 3.44a.75.75 0 101.06 1.06l4-4a.75.75 0 000-1.06z"
            />
          </svg>
        </button>

        <div className={`flex-1 space-y-6 transition-opacity duration-200 ${isCollapsed ? 'opacity-0 pointer-events-none lg:hidden' : 'opacity-100'}`}>
          <div className="flex flex-col gap-2 pr-10">
            {isEditingTitle ? (
              <input
                value={titleValue}
                onChange={(event) => setTitleValue(event.target.value)}
                onBlur={handleRename}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    handleRename();
                  } else if (event.key === 'Escape') {
                    setTitleValue(project.name);
                    setEditingTitle(false);
                  }
                }}
                autoFocus
                className="rounded-xl border border-accent/70 bg-surface/80 px-4 py-2 text-lg font-semibold text-text-primary outline-none focus:ring-2 focus:ring-accent/40"
              />
            ) : (
              <button
                type="button"
                onClick={() => setEditingTitle(true)}
                className="text-left text-lg font-semibold text-text-primary transition hover:text-accent/80"
              >
                {project.name}
              </button>
            )}
            <p className="text-xs uppercase tracking-[0.3em] text-text-muted">Action Menu</p>
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">
              Search project
              <div className="mt-2 flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-3">
                <svg viewBox="0 0 24 24" className="h-4 w-4 text-text-muted" aria-hidden="true">
                  <path
                    fill="currentColor"
                    d="M10 4a6 6 0 014.62 9.8l4.29 4.29a.75.75 0 11-1.06 1.06l-4.29-4.29A6 6 0 1110 4zm0 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"
                  />
                </svg>
                <input
                  value={searchQuery}
                  onChange={(event) => setSearchQuery(event.target.value)}
                  placeholder="Search items, assets, notes..."
                  className="w-full bg-transparent py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                  type="search"
                />
              </div>
            </label>

            <button
              type="button"
              onClick={() => setAssetBrowserOpen(true)}
              className="flex w-full items-center justify-between rounded-2xl border border-border/80 bg-surface/60 px-4 py-3 text-left text-sm font-semibold text-text-secondary transition hover:border-accent/70 hover:text-accent/80"
            >
              <span>Image Library</span>
              <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent/80">
                {project.assets.length}
              </span>
            </button>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Items</p>
              <button
                type="button"
                onClick={() => setItemDialogOpen(true)}
                className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-lg font-semibold text-text-secondary transition hover:border-accent hover:text-accent/80"
                aria-label="Add item"
              >
                +
              </button>
            </div>

            <div className="space-y-3">
              {filteredItems.length === 0 ? (
                <p className="rounded-2xl border border-dashed border-border/70 bg-surface/60 px-4 py-6 text-center text-xs text-text-muted">
                  No items match your search yet.
                </p>
              ) : (
                filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-2xl border border-border/80 bg-surface/70 px-4 py-4 text-sm text-text-secondary shadow-lg shadow-black/20"
                  >
                    <p className="font-semibold text-text-primary">{item.name}</p>
                    <p className="mt-1 text-xs uppercase tracking-[0.3em] text-text-muted">{item.type}</p>
                    <p className="mt-2 text-xs text-text-muted">{item.variant}</p>
                    {item.customDetails && (
                      <p className="mt-2 text-xs text-text-muted">{item.customDetails}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className={`hidden flex-1 flex-col items-center gap-8 py-12 ${isCollapsed ? 'lg:flex' : 'lg:hidden'}`}>
          <button
            type="button"
            onClick={() => setEditingTitle(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 text-text-primary transition hover:border-accent hover:text-accent/80"
            title="Rename project"
          >
            ✎
          </button>
          <button
            type="button"
            onClick={() => setAssetBrowserOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 text-text-primary transition hover:border-accent hover:text-accent/80"
            title="Image library"
          >
            🖼️
          </button>
          <button
            type="button"
            onClick={() => setItemDialogOpen(true)}
            className="flex h-12 w-12 items-center justify-center rounded-2xl border border-border/70 text-text-primary transition hover:border-accent hover:text-accent/80"
            title="Add item"
          >
            +
          </button>
        </div>
      </aside>

      <section className="flex-1 space-y-6">
        {statusMessage && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent/80">
            {statusMessage}
          </div>
        )}

        <div className="rounded-3xl border border-border bg-surface-muted/40 p-8">
          <h2 className="text-2xl font-semibold text-text-primary">Workspace</h2>
          <p className="mt-3 max-w-2xl text-sm text-text-secondary">
            Your items appear here as you build them out. Use the action menu to browse assets, add new components, and manage your
            project details. Drag-and-drop editing and placement tools will arrive in future updates.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {project.items.map((item) => (
              <div key={item.id} className="rounded-2xl border border-border/80 bg-surface/60 p-4">
                <p className="text-sm font-semibold text-text-primary">{item.name}</p>
                <p className="mt-1 text-xs uppercase tracking-[0.3em] text-text-muted">{item.type}</p>
                <p className="mt-2 text-xs text-text-muted">{item.variant}</p>
                {item.customDetails && <p className="mt-2 text-xs text-text-muted">Custom: {item.customDetails}</p>}
              </div>
            ))}
            {project.items.length === 0 && (
              <div className="col-span-full flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface/60 p-12 text-center">
                <p className="text-lg font-semibold text-text-primary">No items yet</p>
                <p className="mt-2 max-w-sm text-sm text-text-muted">
                  Add your first board, card deck, or poster using the action menu on the left.
                </p>
                <button
                  type="button"
                  onClick={() => setItemDialogOpen(true)}
                  className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast transition hover:bg-accent-strong"
                >
                  Add an item
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="rounded-3xl border border-border bg-surface-muted/40 p-8">
          <h3 className="text-xl font-semibold text-text-primary">Project Activity</h3>
          <p className="mt-2 text-sm text-text-muted">
            Keep track of asset uploads, layout tweaks, and collaborative notes. Future iterations will surface version history and
            assignable tasks.
          </p>
            <ul className="mt-6 space-y-3 text-sm text-text-secondary">
              <li className="rounded-2xl border border-border/70 bg-surface/60 px-4 py-3">
                <span className="font-semibold text-text-primary">{project.name}</span> is ready for exploration. Start adding details
                to each component.
              </li>
              <li className="rounded-2xl border border-border/70 bg-surface/60 px-4 py-3">
                Upload reference art or icons to the image library to keep inspiration close at hand.
              </li>
            </ul>
            <div className="mt-6 text-xs text-text-muted">
              Looking for something else? <Link to="/" className="text-accent/80 transition hover:text-accent">Return to the dashboard</Link> to switch projects.
            </div>
        </div>
      </section>

      <NewItemDialog open={isItemDialogOpen} onClose={() => setItemDialogOpen(false)} onSubmit={handleAddItem} />

      <ImageAssetBrowser
        open={isAssetBrowserOpen}
        assets={project.assets}
        onClose={() => setAssetBrowserOpen(false)}
        onAddAssets={handleAddAssets}
        onRemoveAssets={handleRemoveAssets}
        onLocateAsset={handleLocateAsset}
      />
    </div>
  );
}

export default ProjectPage;
