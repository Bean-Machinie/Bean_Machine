import type { MouseEvent } from 'react';
import {
  ChangeEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useNavigate, useParams } from 'react-router-dom';

import ImageAssetBrowser from '../components/ImageAssetBrowser';
import NewItemDialog from '../components/NewItemDialog';
import ProjectActionMenuSettings from '../components/ProjectActionMenuSettings';
import ProjectSettingsDialog from '../components/ProjectSettingsDialog';
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
  const [isProjectSettingsOpen, setProjectSettingsOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [pendingFrameItemId, setPendingFrameItemId] = useState<string | null>(null);
  const [orderedItemIds, setOrderedItemIds] = useState<string[]>([]);
  const [recentFrame, setRecentFrame] = useState<{ itemId: string; frameId: string } | null>(null);
  const stripRefs = useRef(new Map<string, HTMLDivElement>());
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
  const handleOpenProjectSettingsDialog = useCallback(() => setProjectSettingsOpen(true), []);
  const handleCloseProjectSettingsDialog = useCallback(() => setProjectSettingsOpen(false), []);
  const handleNavigateHelp = useCallback(() => {
    navigate('/help');
  }, [navigate]);
  const handleNavigateUpgrade = useCallback(() => {
    navigate('/upgrade');
  }, [navigate]);

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
          setOrderedItemIds((previous) => [created.id, ...previous.filter((id) => id !== created.id)]);
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
    async (itemId: string, event?: MouseEvent<HTMLButtonElement>) => {
      event?.currentTarget?.blur();

      if (!project) {
        return;
      }

      const itemExists = project.items.some((candidate) => candidate.id === itemId);
      if (!itemExists) {
        return;
      }

      setPendingFrameItemId(itemId);

      try {
        const frame = await addFrameToItem(project.id, itemId);
        if (frame) {
          setRecentFrame({ itemId, frameId: frame.id });
        }
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

  const orderedItems = useMemo(() => {
    if (!project) {
      return [];
    }

    if (orderedItemIds.length === 0) {
      return project.items;
    }

    const byId = new Map(project.items.map((item) => [item.id, item]));
    const arranged: Project['items'] = orderedItemIds
      .map((id) => byId.get(id))
      .filter((item): item is Project['items'][number] => Boolean(item));
    const leftovers = project.items.filter((item) => !orderedItemIds.includes(item.id));
    return [...arranged, ...leftovers];
  }, [orderedItemIds, project]);

  const filteredItems = useMemo(() => {
    if (!project) {
      return [];
    }

    const normalizedQuery = deferredSearchQuery.trim().toLowerCase();
    if (normalizedQuery.length === 0) {
      return orderedItems;
    }

    return orderedItems.filter((item) => item.name.toLowerCase().includes(normalizedQuery));
  }, [deferredSearchQuery, orderedItems, project]);

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

  useEffect(() => {
    if (!project) {
      setOrderedItemIds([]);
      return;
    }

    setOrderedItemIds((previous) => {
      if (previous.length === 0) {
        return project.items.map((item) => item.id);
      }

      const availableIds = project.items.map((item) => item.id);
      const preservedOrder = previous.filter((id) => availableIds.includes(id));
      const additions = availableIds.filter((id) => !preservedOrder.includes(id));

      if (additions.length === 0 && preservedOrder.length === previous.length) {
        return preservedOrder;
      }

      return [...additions, ...preservedOrder];
    });
  }, [itemIdsSignature, project]);

  const asideDynamicClasses = useMemo(
    () =>
      [
        'sticky top-0 z-30 self-start relative',
        'flex h-[100dvh] flex-shrink-0 flex-col overflow-hidden',
        'border-r border-border bg-surface-muted/70 transition-all duration-300',
        isCollapsed ? 'w-[4.75rem]' : 'w-[18.5rem]',
      ].join(' '),
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
          <svg viewBox="0 0 24 24" className="h-6 w-6" aria-hidden="true">
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
    <div className="flex h-[100dvh] w-full items-start bg-background">
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

        {/* ABSOLUTE toggle button pinned to the header?s right edge */}
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

        <div
          className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1"
        >
          {orderedItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/70 bg-surface/60 px-3 py-6 text-center text-xs text-text-muted">
              No items yet. Use the action menu to add your first board, card deck, or poster.
            </p>
          ) : (
            orderedItems.map((item) => {
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
      <div className="absolute inset-x-0 bottom-3 z-40 px-3">
        {!isCollapsed && (
          <p className="text-left text-[0.65rem] uppercase tracking-[0.3em] text-text-muted">Project Controls</p>
        )}
        <div className="flex items-center justify-start">
          <ProjectActionMenuSettings
            collapsed={isCollapsed}
            onOpenProjectSettings={handleOpenProjectSettingsDialog}
            onNavigateHelp={handleNavigateHelp}
            onNavigateUpgrade={handleNavigateUpgrade}
          />
        </div>
      </div>
    </aside>

    <section className="flex-1 h-full overflow-y-auto bg-background">
      <div className="px-4 py-10 sm:px-6 lg:px-8">
        {statusMessage && (
          <div className="rounded-2xl border border-accent/40 bg-accent/10 px-4 py-3 text-sm text-accent/80">{statusMessage}</div>
        )}

        <div className="mt-6 space-y-8">
          <div className="flex flex-wrap items-center justify-between gap-4 px-1">
            <div>
              <h2 className="text-2xl font-semibold text-text-primary">Item Navigator</h2>
              <p className="mt-2 max-w-2xl text-sm text-text-secondary">
                Explore and expand every item in your project. Each film strip below mirrors the cards in your action menu.
              </p>
            </div>
            <div className="flex items-center gap-2 rounded-full bg-surface/30 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">
              <span>{orderedItems.length}</span>
              <span>{orderedItems.length === 1 ? 'Item' : 'Items'}</span>
            </div>
          </div>

          {orderedItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-[2rem] border border-dashed border-border/70 bg-surface/30 p-12 text-center">
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
            <div
              className="space-y-8 px-1"
            >
              {orderedItems.map((item) => {
                const isHighlighted = highlightedItemId === item.id;
                return (
                  <article
                    key={item.id}
                    ref={registerStripRef(item.id)}
                    className={`group/strip relative flex flex-col gap-0 overflow-visible rounded-[1.75rem] border border-border/60 bg-surface-muted/40 px-4 py-5 shadow-[0_10px_32px_rgba(15,23,42,0.28)] transition-all duration-300 ${
                      isHighlighted
                        ? 'border-accent/60 bg-surface-muted/70 shadow-[0_26px_60px_rgba(2,6,23,0.45)] ring-1 ring-accent/40'
                        : 'hover:bg-surface-muted/55 hover:shadow-[0_20px_54px_rgba(2,6,23,0.35)]'
                    }`}
                  >
                    <header className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <div
                          className="flex h-0 w-0 items-center justify-center rounded-xl border border-transparent bg-surface/30 text-text-muted"
                          aria-hidden="true"
                        >
                        </div>
                        <div className="min-w-0 space-y-1">
                          <p className="truncate text-base font-semibold text-text-primary">{item.name}</p>
                          <div className="flex flex-wrap items-center gap-2 text-[0.65rem] uppercase tracking-[0.3em] text-text-muted">
                            <span>{item.type}</span>
                            <span className="text-text-secondary">{item.variant}</span>
                            {item.customDetails && <span className="text-text-muted/80">Custom: {item.customDetails}</span>}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 rounded-full bg-surface/30 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-text-secondary">
                        <span>{item.frames.length}</span>
                        <span>{item.frames.length === 1 ? 'Panel' : 'Panels'}</span>
                      </div>
                    </header>

                    <div
                      className="relative mt-3 overflow-x-auto overflow-y-visible bg-surface-muted/40 px-3 pb-5"
                    >
                      <div className="flex items-end gap-1 pr-8">
                        {item.frames.map((frame, index) => {
                          const ratioValue = frame.height > 0 ? frame.width / frame.height : 1;
                          const basePercent = 82;
                          const widthPercent = ratioValue >= 1 ? basePercent : basePercent * ratioValue;
                          const heightPercent = ratioValue >= 1 ? basePercent / ratioValue : basePercent;
                          const isRecentFrame = recentFrame?.itemId === item.id && recentFrame.frameId === frame.id;

                          return (
                            <div
                              key={frame.id}
                              className="group/frame relative flex mt-4 h-[7.5rem] w-[7.5rem] flex-shrink-0 items-end justify-center rounded-[0.85rem] bg-gradient-to-br from-surface/90 via-surface/60 to-surface/50 p-[0.35rem] shadow-[0_18px_42px_rgba(2,6,23,0.45)] transition-transform duration-300 ease-out hover:-translate-y-3 hover:rotate-[4.5deg] hover:shadow-[0_32px_64px_rgba(15,23,42,0.5)] focus-within:-translate-y-2 focus-within:rotate-[1deg] focus-within:shadow-[0_28px_56px_rgba(15,23,42,0.45)]"
                            >
                              <div
                                tabIndex={0}
                                className={`relative flex h-full w-full items-center justify-center rounded-[0.6rem] border border-white/10 bg-white/5 transition-all duration-300 ease-out ${
                                  isRecentFrame ? 'animate-frame-appear ring-2 ring-accent/70' : 'ring-0'
                                }`}
                                onAnimationEnd={() => {
                                  if (recentFrame?.itemId === item.id && recentFrame.frameId === frame.id) {
                                    setRecentFrame(null);
                                  }
                                }}
                              >
                                <span
                                  className="flex items-center justify-center rounded-xl bg-white/85 shadow-[inset_0_0_22px_rgba(15,23,42,0.22)]"
                                  style={{
                                    width: `${widthPercent}%`,
                                    height: `${heightPercent}%`,
                                  }}
                                >
                                  <span className="sr-only">Frame {index + 1}</span>
                                </span>
                              </div>
                            </div>
                          );
                        })}
                        <div className="sticky right-0 mb-1 flex h-[5rem] w-[5rem] flex-shrink-0 items-stretch">
                          <button
                            type="button"
                            onClick={(event) => handleAddFrame(item.id, event)}
                            disabled={pendingFrameItemId === item.id}
                            className={`group/add relative flex w-full flex-1 flex-col items-center justify-center gap-2 rounded-[0.85rem] border border-dashed border-border/70 bg-surface/30 text-center text-xs font-semibold uppercase tracking-[0.3em] text-text-muted shadow-[0_16px_38px_rgba(2,6,23,0.45)] transition-all duration-300 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                              pendingFrameItemId === item.id ? 'cursor-wait opacity-70' : 'hover:-translate-y-2 hover:scale-[1.02] hover:text-accent'
                            }`}
                            aria-label="Add frame"
                          >
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              viewBox="0 0 24 24"
                              fill="currentColor"
                              className="h-6 w-6 text-current transition-colors duration-200 group-hover/add:text-accent"
                              aria-hidden="true"
                              >
                              <path
                              fillRule="evenodd"
                              d="M5.625 1.5H9a3.75 3.75 0 0 1 3.75 3.75v1.875c0 1.036.84 1.875 1.875 1.875H16.5a3.75 3.75 0 0 1 3.75 3.75v7.875c0 1.035-.84 1.875-1.875 1.875H5.625a1.875 1.875 0 0 1-1.875-1.875V3.375c0-1.036.84-1.875 1.875-1.875ZM12.75 12a.75.75 0 0 0-1.5 0v2.25H9a.75.75 0 0 0 0 1.5h2.25V18a.75.75 0 0 0 1.5 0v-2.25H15a.75.75 0 0 0 0-1.5h-2.25V12Z"
                              clipRule="evenodd"
                              />
                              <path d="M14.25 5.25a5.23 5.23 0 0 0-1.279-3.434 9.768 9.768 0 0 1 6.963 6.963A5.23 5.23 0 0 0 16.5 7.5h-1.875a.375.375 0 0 1-.375-.375V5.25Z" />
                              </svg>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
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
              ?
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

    <ProjectSettingsDialog
      open={isProjectSettingsOpen}
      onClose={handleCloseProjectSettingsDialog}
      project={project}
      onRenameProject={updateProjectName}
    />

    <ImageAssetBrowser {...assetBrowserProps} />
  </div>
);

}

export default ProjectPage;













