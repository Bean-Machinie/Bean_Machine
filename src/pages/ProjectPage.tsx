import { ChangeEvent, useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

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
  const {
    projects,
    updateProjectName,
    addItemToProject,
    addFrameToItem,
    addAssetsToProject,
    removeAssetsFromProject,
  } = useProjects();
  const [isCollapsed, setCollapsed] = useState(false);
  const [isEditingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchPanelOpen, setSearchPanelOpen] = useState(false);
  const [isItemDialogOpen, setItemDialogOpen] = useState(false);
  const [isAssetBrowserOpen, setAssetBrowserOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [pendingFrameItemId, setPendingFrameItemId] = useState<string | null>(null);
  const stripRefs = useRef(new Map<string, HTMLDivElement>());
  const stripScrollRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingScrollItemIdRef = useRef<string | null>(null);

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

  useEffect(() => {
    if (!highlightedItemId) {
      return undefined;
    }

    const timeout = setTimeout(() => setHighlightedItemId(null), 1600);
    return () => clearTimeout(timeout);
  }, [highlightedItemId]);

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

  const registerStripRef = useCallback(
    (itemId: string) => (node: HTMLDivElement | null) => {
      if (node) {
        stripRefs.current.set(itemId, node);
      } else {
        stripRefs.current.delete(itemId);
      }
    },
    [],
  );

  const registerStripScrollRef = useCallback(
    (itemId: string) => (node: HTMLDivElement | null) => {
      if (node) {
        stripScrollRefs.current.set(itemId, node);
      } else {
        stripScrollRefs.current.delete(itemId);
      }
    },
    [],
  );

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
        if (created) {
          pendingScrollItemIdRef.current = created.id;
          setHighlightedItemId(created.id);
        }
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

  const handleAddFrame = useCallback(
    async (itemId: string) => {
      if (!project) {
        return;
      }

      const targetItem = project.items.find((candidate) => candidate.id === itemId);
      if (!targetItem) {
        return;
      }

      setPendingFrameItemId(itemId);

      try {
        await addFrameToItem(project.id, itemId);
        setStatusMessage(`Added a blank panel to ${targetItem.name}.`);

        const strip = stripRefs.current.get(itemId);
        if (strip) {
          strip.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }

        const scroller = stripScrollRefs.current.get(itemId);
        if (scroller) {
          scroller.scrollTo({ left: scroller.scrollWidth, behavior: 'smooth' });
        }

        setHighlightedItemId(itemId);
      } catch (error) {
        console.error('Failed to add frame to item', error);
        setStatusMessage((error as Error).message ?? 'Failed to add a new panel.');
      } finally {
        setPendingFrameItemId(null);
      }
    },
    [addFrameToItem, project],
  );

  const handleItemCardClick = useCallback((itemId: string) => {
    const strip = stripRefs.current.get(itemId);
    if (strip) {
      strip.scrollIntoView({ behavior: 'smooth', block: 'center' });
      setHighlightedItemId(itemId);
    }
  }, []);

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

  const itemIdsSignature = useMemo(() => {
    if (!project) {
      return '';
    }

    return project.items.map((item) => item.id).join('|');
  }, [project]);

  useEffect(() => {
    const pendingId = pendingScrollItemIdRef.current;
    if (!pendingId) {
      return;
    }

    const target = stripRefs.current.get(pendingId);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'center' });
      pendingScrollItemIdRef.current = null;
    }
  }, [itemIdsSignature]);

  const asideDynamicClasses = useMemo(
    () =>
      `relative flex min-h-screen flex-shrink-0 flex-col overflow-x-hidden
      border-r border-border bg-surface-muted/70 transition-all duration-300
      ${isCollapsed ? 'w-[4.75rem]' : 'w-[18.5rem]'}`
    ,
    [isCollapsed],
  );

  const assetCount = project?.assets.length ?? 0;

  const navigationItems = useMemo(
    () => [
      {
        id: 'search',
        label: 'Search in Project',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" class="size-5">
          <path fill-rule="evenodd" d="M10.5 3.75a6.75 6.75 0 1 0 0 13.5 6.75 6.75 0 0 0 0-13.5ZM2.25 10.5a8.25 8.25 0 1 1 14.59 5.28l4.69 4.69a.75.75 0 1 1-1.06 1.06l-4.69-4.69A8.25 8.25 0 0 1 2.25 10.5Z" clip-rule="evenodd" />
          </svg>

        ),
        onClick: handleOpenSearchPanel,
        isActive: isSearchPanelOpen,
      },
      {
        id: 'library',
        label: 'Image Library',
        icon: (
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke-width="1.5" stroke="currentColor" class="size-5">
          <path stroke-linecap="round" stroke-linejoin="round" d="M12 21v-8.25M15.75 21v-8.25M8.25 21v-8.25M3 9l9-6 9 6m-1.5 12V10.332A48.36 48.36 0 0 0 12 9.75c-2.551 0-5.056.2-7.5.582V21M3 21h18M12 6.75h.008v.008H12V6.75Z" />
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

  const navButtonBaseClasses =
    'group relative flex w-full items-center justify-start gap-2 overflow-hidden rounded-xl border px-2.5 py-2 text-sm font-medium transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40';
  const navIconBaseClasses =
    'flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg transition-colors duration-200';
  const navLabelClasses = `flex-1 whitespace-nowrap text-left text-sm font-medium leading-none transition-[margin,max-width,opacity,transform] duration-300 ${
    isCollapsed
      ? 'pointer-events-none -translate-x-2 opacity-0 delay-0 max-w-0'
      : 'ml-2 max-w-[12rem] translate-x-0 opacity-100 delay-150'
  }`;

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
      {/* HEADER (updated) */}
      <div className="relative border-b border-border/80 px-3 py-4">
        {/* leave space for the absolute toggle button on the right */}
        <div className={`min-h-[50px] ${isCollapsed ? 'pr-0' : 'pr-12'}`}>
          <div className="flex min-h-[50px] w-full items-center gap-3 transition-all duration-300">
            <div
              className={`flex flex-col gap-1 overflow-hidden transition-[max-height,opacity] duration-300 ${
                isCollapsed ? 'pointer-events-none max-h-0 opacity-0 flex-none' : 'flex-1 max-h-24 opacity-100'
              }`}
              aria-hidden={isCollapsed}
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
          </div>
        </div>

        {/* ABSOLUTE toggle button pinned to the header’s right edge */}
        <button
          type="button"
          onClick={handleToggleCollapsed}
          className={`absolute top-1/2 -translate-y-1/2
                      group flex h-9 w-9 items-center justify-center rounded-xl border
                      transition-[colors,transform,left,right] duration-300 focus:outline-none
                      focus-visible:ring-2 focus-visible:ring-accent/40
                      ${
                        isCollapsed
                          ? 'left-1/2 -translate-x-1/2 border-border/70 bg-surface/60 text-text-muted hover:border-accent/70 hover:bg-accent/10 hover:text-accent'
                          : 'right-3 translate-x-0 border-border/70 bg-surface/80 text-text-muted hover:border-accent hover:bg-accent/10 hover:text-accent'
                      }`}
          aria-label={isCollapsed ? 'Expand action menu' : 'Collapse action menu'}
          title={isCollapsed ? 'Expand action menu' : undefined}
        >
          <svg
            viewBox="0 0 24 24"
            className={`h-5 w-5 transition-transform duration-300 ${
              isCollapsed ? 'group-hover:text-accent' : 'rotate-180 group-hover:text-accent'
            }`}
            aria-hidden="true"
          >
            <path
              fill="currentColor"
              d="M9.22 5.72a.75.75 0 011.06 0l5 5a.75.75 0 010 1.06l-5 5a.75.75 0 11-1.06-1.06L13.69 12 9.22 7.53a.75.75 0 010-1.06z"
            />
          </svg>
        </button>
      </div>
      {/* /HEADER */}

      <nav className="flex flex-col gap-1.5 px-2.5 py-3" aria-label="Project navigation">
        {navigationItems.map((item) => {
          const iconStateClasses = item.isActive ? 'text-accent' : 'text-text-muted group-hover:text-accent';
          const buttonClasses = item.isActive
            ? 'border-accent/40 bg-accent/15 text-accent'
            : 'border-transparent text-text-secondary hover:border-border/80 hover:bg-surface/60 hover:text-text-primary';

          return (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={`${navButtonBaseClasses} ${buttonClasses}`}
              aria-label={item.label}
              title={isCollapsed ? item.label : undefined}
            >
              <span className={`${navIconBaseClasses} ${iconStateClasses}`}>{item.icon}</span>
              <span className={navLabelClasses} aria-hidden={isCollapsed}>
                {item.label}
              </span>
              {!isCollapsed && item.badge !== undefined && (
                <span className="ml-2 rounded-full bg-accent/10 px-2 py-0.5 text-xs font-semibold text-accent">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      <div
        className={`flex flex-1 flex-col overflow-hidden px-2.5 pb-6 transition-opacity duration-300 ${
          isCollapsed ? 'pointer-events-none opacity-0' : 'opacity-100'
        }`}
      >
        <div className="flex items-center justify-start">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-text-muted">Items</p>
        </div>

        <div className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1">
          {project.items.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/70 bg-surface/60 px-3 py-6 text-center text-xs text-text-muted">
              No items yet. Use the action menu to add your first board, card deck, or poster.
            </p>
          ) : (
            project.items.map((item) => {
              const isHighlighted = highlightedItemId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => handleItemCardClick(item.id)}
                  className={`group flex w-full flex-col items-start gap-1 rounded-2xl border px-3 py-2.5 text-left text-sm shadow-md shadow-black/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    isHighlighted
                      ? 'border-accent/60 bg-accent/10 text-text-primary'
                      : 'border-border/80 bg-surface/70 text-text-secondary hover:border-accent/50 hover:bg-accent/5 hover:text-text-primary'
                  }`}
                >
                  <p className="font-semibold text-text-primary">{item.name}</p>
                  <div className="flex w-full items-center justify-between text-xs text-text-muted">
                    <span className="uppercase tracking-[0.3em]">{item.type}</span>
                    <span className="font-semibold text-text-secondary">
                      {item.frames.length} {item.frames.length === 1 ? 'panel' : 'panels'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>
    </aside>

    <section className="flex-1 overflow-y-auto bg-background">
      <div className="px-6 py-10 lg:px-10">
        {statusMessage && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent/80">{statusMessage}</div>
        )}

        <div className="mt-6 space-y-6">
          <div className="rounded-3xl border border-border bg-surface-muted/40 p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-text-primary">Item Navigator</h2>
                <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                  Explore and expand every item in your project. Each strip collects the panels that make up your boards, decks, and posters.
                </p>
              </div>
              <div className="flex items-center gap-2 rounded-full bg-surface/70 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">
                <span>{project.items.length}</span>
                <span>{project.items.length === 1 ? 'Item' : 'Items'}</span>
              </div>
            </div>

            {project.items.length === 0 ? (
              <div className="mt-8 flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/70 bg-surface/60 p-12 text-center">
                <p className="text-lg font-semibold text-text-primary">No items yet</p>
                <p className="mt-2 max-w-md text-sm text-text-muted">
                  Use the action menu to add your first board, deck, or poster. Their film strips will appear here automatically.
                </p>
                <button
                  type="button"
                  onClick={handleOpenItemDialog}
                  className="mt-4 rounded-full bg-accent px-5 py-2 text-sm font-semibold text-accent-contrast transition hover:bg-accent-strong"
                >
                  Add an item
                </button>
              </div>
            ) : (
              <div className="mt-8 space-y-6">
                {project.items.map((item) => {
                  const isHighlighted = highlightedItemId === item.id;
                  return (
                    <div
                      key={item.id}
                      ref={registerStripRef(item.id)}
                      className={`rounded-2xl border border-border/80 bg-surface/70 p-5 transition-all duration-500 ${
                        isHighlighted
                          ? 'ring-2 ring-accent/50 ring-offset-2 ring-offset-background shadow-lg shadow-accent/20'
                          : 'shadow-sm shadow-black/10'
                      }`}
                    >
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-semibold text-text-primary">{item.name}</p>
                          <p className="text-xs uppercase tracking-[0.3em] text-text-muted">{item.type}</p>
                          <p className="mt-1 text-xs text-text-secondary">{item.variant}</p>
                          {item.customDetails && (
                            <p className="mt-1 text-xs text-text-muted">Custom: {item.customDetails}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-2 rounded-full bg-surface-muted/70 px-3 py-1 text-xs font-semibold text-text-secondary">
                          <span>{item.frames.length}</span>
                          <span>{item.frames.length === 1 ? 'Panel' : 'Panels'}</span>
                        </div>
                      </div>

                      <div
                        ref={registerStripScrollRef(item.id)}
                        className="mt-4 overflow-x-auto pb-2"
                      >
                        <div className="flex min-h-[11rem] items-stretch gap-4 pr-2">
                          {item.frames.map((frame, index) => {
                            const ratio =
                              frame.height > 0 ? Math.round((frame.width / frame.height) * 10) / 10 : null;
                            return (
                              <div key={frame.id} className="flex w-[12rem] flex-shrink-0 flex-col gap-2">
                                <div className="flex flex-1 items-center justify-center rounded-2xl border border-border/70 bg-surface/80 p-4 shadow-inner shadow-black/10">
                                  <div
                                    className="relative h-full w-full"
                                    style={{ aspectRatio: `${frame.width} / ${frame.height}` }}
                                  >
                                    <div className="absolute inset-0 rounded-xl border border-dashed border-border/80 bg-white shadow-sm" />
                                    <div className="pointer-events-none absolute inset-2 rounded-lg border border-white/70 shadow-[inset_0_0_20px_rgba(15,23,42,0.08)]" />
                                  </div>
                                </div>
                                <div className="flex items-center justify-between text-xs text-text-muted">
                                  <span className="font-semibold uppercase tracking-[0.3em]">Frame {index + 1}</span>
                                  <span className="text-[0.65rem] text-text-muted/80">
                                    {ratio !== null ? `${ratio}:1` : '—'}
                                  </span>
                                </div>
                              </div>
                            );
                          })}
                          <button
                            type="button"
                            onClick={() => handleAddFrame(item.id)}
                            disabled={pendingFrameItemId === item.id}
                            className={`flex w-[12rem] flex-shrink-0 flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/60 bg-surface/50 text-text-muted transition hover:border-accent/60 hover:text-accent focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                              pendingFrameItemId === item.id ? 'opacity-70' : ''
                            }`}
                          >
                            <span className="text-3xl font-semibold">+</span>
                            <span className="mt-2 text-xs font-semibold uppercase tracking-[0.3em]">
                              {pendingFrameItemId === item.id ? 'Adding…' : 'Add blank panel'}
                            </span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
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
