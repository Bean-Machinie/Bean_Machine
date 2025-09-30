import { ChangeEvent, useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';

import ImageAssetBrowser from '../components/ImageAssetBrowser';
import NewItemDialog from '../components/NewItemDialog';
import { AssetInput, ItemInput, Project } from '../context/ProjectContext';
import { findProject, useProjects } from '../context/ProjectContext';

const emptyAssetBrowserHandlers = Object.freeze({
  onClose: () => undefined,
  onAddAssets: () => undefined,
  onRemoveAssets: () => undefined,
  onLocateAsset: () => undefined,
});

function ProjectPage() {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { projects, updateProjectName, addItemToProject, addAssetsToProject, removeAssetsFromProject } = useProjects();
  const [isCollapsed, setCollapsed] = useState(false);
  const [isEditingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchPanelOpen, setSearchPanelOpen] = useState(false);
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

  const deferredSearchQuery = useDeferredValue(searchQuery);

  useEffect(() => {
    if (statusMessage) {
      const timeout = setTimeout(() => setStatusMessage(null), 4000);
      return () => clearTimeout(timeout);
    }
    return undefined;
  }, [statusMessage]);

  const handleToggleCollapsed = useCallback(() => {
    setCollapsed((prev) => !prev);
  }, []);

  const handleStartEditingTitle = useCallback(() => {
    setEditingTitle(true);
  }, []);

  const handleSearchChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  }, []);

  const handleOpenSearchPanel = useCallback(() => setSearchPanelOpen(true), []);
  const handleCloseSearchPanel = useCallback(() => {
    setSearchPanelOpen(false);
    setSearchQuery('');
  }, []);

  useEffect(() => {
    if (!isSearchPanelOpen) {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        handleCloseSearchPanel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleCloseSearchPanel, isSearchPanelOpen]);

  const handleOpenItemDialog = useCallback(() => setItemDialogOpen(true), []);
  const handleCloseItemDialog = useCallback(() => setItemDialogOpen(false), []);

  const handleOpenAssetBrowser = useCallback(() => setAssetBrowserOpen(true), []);
  const handleCloseAssetBrowser = useCallback(() => setAssetBrowserOpen(false), []);

  const handleRename = useCallback(async () => {
    if (!project) {
      return;
    }

    const trimmed = titleValue.trim();
    if (!trimmed || trimmed === project.name) {
      setTitleValue(project.name);
      setEditingTitle(false);
      return;
    }

    try {
      await updateProjectName(project.id, trimmed);
      setEditingTitle(false);
      setStatusMessage('Project name updated');
    } catch (error) {
      console.error('Failed to update project name', error);
      setStatusMessage((error as Error).message ?? 'Failed to update project name');
    }
  }, [project, titleValue, updateProjectName]);

  const handleAddItem = useCallback(
    async (item: ItemInput) => {
      if (!project) {
        return;
      }

      const projectName = project.name;

      try {
        const created = await addItemToProject(project.id, item);
        const itemName = created?.name ?? item.name;
        setStatusMessage(`${itemName} added to ${projectName}`);
      } catch (error) {
        console.error('Failed to add item to project', error);
        setStatusMessage((error as Error).message ?? 'Failed to add item');
      }
    },
    [addItemToProject, project],
  );

  const handleAddAssets = useCallback(
    async (assets: AssetInput[]) => {
      if (!project || assets.length === 0) {
        return;
      }

      try {
        const added = await addAssetsToProject(project.id, assets);
        const count = added.length;
        if (count > 0) {
          setStatusMessage(`${count} asset${count === 1 ? '' : 's'} added to the library`);
        }
      } catch (error) {
        console.error('Failed to add assets to project', error);
        setStatusMessage((error as Error).message ?? 'Failed to add assets');
      }
    },
    [addAssetsToProject, project],
  );

  const handleRemoveAssets = useCallback(
    async (assetIds: string[]) => {
      if (!project || assetIds.length === 0) {
        return;
      }

      try {
        await removeAssetsFromProject(project.id, assetIds);
        setStatusMessage(`${assetIds.length} asset${assetIds.length === 1 ? '' : 's'} deleted`);
      } catch (error) {
        console.error('Failed to remove assets from project', error);
        setStatusMessage((error as Error).message ?? 'Failed to remove assets');
      }
    },
    [project, removeAssetsFromProject],
  );

  const handleLocateAsset = useCallback(
    (assetId: string) => {
      if (!project) {
        return;
      }

      const asset = project.assets.find((candidate) => candidate.id === assetId);
      if (asset) {
        setStatusMessage(`Coming soon: locate "${asset.name}" within your layouts.`);
      }
    },
    [project],
  );

  const handleSearchSelectItem = useCallback(
    (itemId: string) => {
      if (!project) {
        return;
      }

      const item = project.items.find((candidate) => candidate.id === itemId);
      if (item) {
        setStatusMessage(`Coming soon: locate "${item.name}" within your layouts.`);
      }
      handleCloseSearchPanel();
    },
    [handleCloseSearchPanel, project],
  );

  const handleSearchSelectAsset = useCallback(
    (assetId: string) => {
      handleLocateAsset(assetId);
      handleCloseSearchPanel();
    },
    [handleCloseSearchPanel, handleLocateAsset],
  );

  const filteredItems = useMemo(() => {
    if (!project) {
      return [];
    }

    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return project.items;
    }

    return project.items.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
  }, [deferredSearchQuery, project]);

  const filteredAssets = useMemo(() => {
    if (!project) {
      return [];
    }

    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return project.assets;
    }

    return project.assets.filter((asset) => asset.name.toLowerCase().includes(normalizedQuery));
  }, [deferredSearchQuery, project]);

  const hasSearchQuery = deferredSearchQuery.trim().length > 0;

  const asideDynamicClasses = useMemo(
    () =>
      `flex min-h-screen flex-shrink-0 flex-col border-r border-border bg-surface-muted/70 transition-all duration-300 ${
        isCollapsed ? 'w-[4.75rem]' : 'w-[18.5rem]'
      }`,
    [isCollapsed],
  );

  const assetCount = project?.assets.length ?? 0;

  const navigationItems = useMemo(
    () => [
      {
        id: 'search',
        label: 'Search in Project',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M10.5 4.5a6 6 0 014.8 9.6l3.7 3.7a.75.75 0 11-1.06 1.06l-3.7-3.7A6 6 0 114.5 10.5a6 6 0 016-6z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        ),
        onClick: handleOpenSearchPanel,
        isActive: isSearchPanelOpen,
      },
      {
        id: 'library',
        label: 'Image Library',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M4.5 6.75A2.25 2.25 0 016.75 4.5h10.5a2.25 2.25 0 012.25 2.25v10.5a2.25 2.25 0 01-2.25 2.25H6.75A2.25 2.25 0 014.5 17.25zm3 1.5h9a.75.75 0 01.6 1.2l-2.4 3.2a.75.75 0 01-1.08.12l-2.01-1.68a.75.75 0 00-1.02.03l-1.32 1.32a.75.75 0 01-1.24-.36l-.75-3a.75.75 0 01.72-.93z"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        ),
        onClick: handleOpenAssetBrowser,
        isActive: isAssetBrowserOpen,
        badge: assetCount,
      },
      {
        id: 'add',
        label: 'Add New Item',
        icon: (
          <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
            <path
              d="M12 5.25v13.5m-6.75-6.75h13.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        ),
        onClick: handleOpenItemDialog,
        isActive: isItemDialogOpen,
      },
    ],
    [assetCount, handleOpenAssetBrowser, handleOpenItemDialog, handleOpenSearchPanel, isAssetBrowserOpen, isItemDialogOpen, isSearchPanelOpen],
  );

  const assetBrowserProps = useMemo(() => {
    if (!project) {
      return {
        open: false,
        assets: [],
        ...emptyAssetBrowserHandlers,
      };
    }

    return {
      open: isAssetBrowserOpen,
      assets: project.assets,
      onClose: handleCloseAssetBrowser,
      onAddAssets: handleAddAssets,
      onRemoveAssets: handleRemoveAssets,
      onLocateAsset: handleLocateAsset,
    };
  }, [handleAddAssets, handleCloseAssetBrowser, handleLocateAsset, handleRemoveAssets, isAssetBrowserOpen, project]);

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

  return (
    <div className="flex min-h-screen w-full overflow-hidden">
      <aside className={asideDynamicClasses}>
        <div className="flex items-start justify-between gap-3 border-b border-border/80 px-4 py-4">
          <div
            className={`flex flex-1 flex-col gap-1 transition-opacity duration-300 ${
              isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
            }`}
          >
            {isEditingTitle ? (
              <input
                value={titleValue}
                onChange={(event) => setTitleValue(event.target.value)}
                onBlur={() => {
                  void handleRename();
                }}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    void handleRename();
                  } else if (event.key === 'Escape') {
                    setTitleValue(project.name);
                    setEditingTitle(false);
                  }
                }}
                autoFocus
                className="rounded-xl border border-accent/70 bg-surface/80 px-3 py-2 text-base font-semibold text-text-primary outline-none focus:ring-2 focus:ring-accent/40"
              />
            ) : (
              <button
                type="button"
                onClick={handleStartEditingTitle}
                className="text-left text-lg font-semibold text-text-primary transition hover:text-accent/80"
                title="Rename project"
              >
                {project.name}
              </button>
            )}
            <p className="text-[0.65rem] uppercase tracking-[0.3em] text-text-muted">Action Menu</p>
          </div>
          <button
            type="button"
            onClick={handleToggleCollapsed}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-border/70 bg-surface/80 text-text-secondary shadow-sm shadow-black/10 transition hover:border-accent hover:bg-accent/10 hover:text-accent"
            aria-label={isCollapsed ? 'Expand action menu' : 'Collapse action menu'}
          >
            <svg
              viewBox="0 0 24 24"
              className={`h-5 w-5 transition-transform ${isCollapsed ? '' : 'rotate-180'}`}
              aria-hidden="true"
            >
              <path
                fill="currentColor"
                d="M9.22 5.72a.75.75 0 011.06 0l5 5a.75.75 0 010 1.06l-5 5a.75.75 0 11-1.06-1.06L13.69 12 9.22 7.53a.75.75 0 010-1.06z"
              />
            </svg>
          </button>
        </div>

        <nav className="flex flex-col gap-2 px-3 py-4" aria-label="Project navigation">
          {navigationItems.map((item) => {
            const iconBaseClasses = 'flex h-8 w-8 items-center justify-center rounded-lg transition-colors duration-200';
            const iconStateClasses = item.isActive ? 'text-accent' : 'text-text-muted group-hover:text-accent';
            const buttonClasses = item.isActive
              ? 'border-accent/40 bg-accent/15 text-accent'
              : 'border-transparent text-text-secondary hover:border-border/80 hover:bg-surface/60 hover:text-text-primary';

            return (
              <button
                key={item.id}
                type="button"
                onClick={item.onClick}
                className={`group relative flex items-center rounded-xl border px-3 py-3 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                  isCollapsed ? 'justify-center' : 'justify-start'
                } ${buttonClasses}`}
                aria-label={item.label}
                title={isCollapsed ? item.label : undefined}
              >
                <span className={`${iconBaseClasses} ${iconStateClasses}`}>
                  {item.icon}
                </span>
                <div
                  className={`flex-1 overflow-hidden transition-[max-width] duration-300 ease-out ${
                    isCollapsed ? 'max-w-0' : 'ml-3 max-w-[12rem]'
                  }`}
                >
                  <span
                    className={`block whitespace-nowrap text-sm font-medium transition-opacity duration-200 ${
                      isCollapsed ? 'opacity-0' : 'opacity-100'
                    }`}
                  >
                    {item.label}
                  </span>
                </div>
                {!isCollapsed && item.badge !== undefined && (
                  <span className="rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div
          className={`flex flex-1 flex-col overflow-hidden px-4 pb-6 transition-opacity duration-300 ${
            isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Items</p>
            <button
              type="button"
              onClick={handleOpenItemDialog}
              className="flex h-8 w-8 items-center justify-center rounded-md border border-border/70 text-lg font-semibold text-text-secondary transition hover:border-accent hover:text-accent/80"
              aria-label="Add item"
            >
              +
            </button>
          </div>

          <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
            {project.items.length === 0 ? (
              <p className="rounded-2xl border border-dashed border-border/70 bg-surface/60 px-4 py-6 text-center text-xs text-text-muted">
                No items yet. Add your first board, card deck, or poster using the button above.
              </p>
            ) : (
              project.items.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-border/80 bg-surface/70 px-4 py-3 text-sm text-text-secondary shadow-md shadow-black/10"
                >
                  <p className="font-semibold text-text-primary">{item.name}</p>
                  <p className="text-xs uppercase tracking-[0.3em] text-text-muted">{item.type}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      <section className="flex-1 overflow-y-auto bg-background px-6 py-10 lg:px-10">
        {statusMessage && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent/80">{statusMessage}</div>
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
                  onClick={handleOpenItemDialog}
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

      <NewItemDialog open={isItemDialogOpen} onClose={handleCloseItemDialog} onSubmit={handleAddItem} />

      {isSearchPanelOpen && (
        <div
          className="fixed inset-0 z-40 flex items-start justify-end bg-black/40 backdrop-blur-sm"
          onClick={handleCloseSearchPanel}
          role="presentation"
        >
          <div
            className="m-4 w-full max-w-xl rounded-3xl border border-border bg-surface px-6 py-6 shadow-2xl shadow-black/40"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold text-text-primary">Search project</h2>
                <p className="mt-1 text-sm text-text-muted">Find items and assets without leaving your workspace.</p>
              </div>
              <button
                type="button"
                onClick={handleCloseSearchPanel}
                className="flex h-9 w-9 items-center justify-center rounded-full border border-border/70 text-text-secondary transition hover:border-accent hover:text-accent/80"
                aria-label="Close search"
              >
                ✕
              </button>
            </div>

            <label className="mt-6 flex items-center gap-3 rounded-2xl border border-border bg-surface-muted/60 px-4 py-3">
              <svg viewBox="0 0 24 24" className="h-5 w-5 text-text-muted" aria-hidden="true">
                <path
                  fill="currentColor"
                  d="M10 4a6 6 0 014.62 9.8l4.29 4.29a.75.75 0 11-1.06 1.06l-4.29-4.29A6 6 0 1110 4zm0 1.5a4.5 4.5 0 100 9 4.5 4.5 0 000-9z"
                />
              </svg>
              <input
                value={searchQuery}
                onChange={handleSearchChange}
                placeholder="Search items or assets..."
                className="w-full bg-transparent text-sm text-text-primary placeholder:text-text-muted focus:outline-none"
                type="search"
                autoFocus
              />
            </label>

            <div className="mt-8 grid gap-8 md:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Items</p>
                <div className="mt-3 space-y-2">
                  {filteredItems.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/60 bg-surface-muted/40 px-4 py-4 text-xs text-text-muted">
                      {hasSearchQuery ? 'No items match your search yet.' : 'Start typing to search the items in this project.'}
                    </p>
                  ) : (
                    filteredItems.map((item) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleSearchSelectItem(item.id)}
                        className="flex w-full flex-col items-start gap-1 rounded-xl border border-border/70 bg-surface/70 px-4 py-3 text-left text-sm text-text-secondary transition hover:border-accent/70 hover:text-accent/80"
                      >
                        <span className="font-semibold text-text-primary">{item.name}</span>
                        <span className="text-xs uppercase tracking-[0.3em] text-text-muted">{item.type}</span>
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Assets</p>
                <div className="mt-3 space-y-2">
                  {filteredAssets.length === 0 ? (
                    <p className="rounded-xl border border-dashed border-border/60 bg-surface-muted/40 px-4 py-4 text-xs text-text-muted">
                      {hasSearchQuery ? 'No assets match your search yet.' : 'Search to quickly locate artwork and references.'}
                    </p>
                  ) : (
                    filteredAssets.map((asset) => (
                      <button
                        key={asset.id}
                        type="button"
                        onClick={() => handleSearchSelectAsset(asset.id)}
                        className="flex w-full flex-col items-start gap-1 rounded-xl border border-border/70 bg-surface/70 px-4 py-3 text-left text-sm text-text-secondary transition hover:border-accent/70 hover:text-accent/80"
                      >
                        <span className="font-semibold text-text-primary">{asset.name}</span>
                        <span className="text-xs text-text-muted">Library asset</span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <ImageAssetBrowser {...assetBrowserProps} />
    </div>
  );
}

export default ProjectPage;
