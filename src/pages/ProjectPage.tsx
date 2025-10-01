import type { CSSProperties, DragEvent } from 'react';
import {
  ChangeEvent,
  useCallback,
  useDeferredValue,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
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
  const [orderedItemIds, setOrderedItemIds] = useState<string[]>([]);
  const [activeDragId, setActiveDragId] = useState<string | null>(null);
  const [recentFrame, setRecentFrame] = useState<{ itemId: string; frameId: string } | null>(null);
  const stripRefs = useRef(new Map<string, HTMLDivElement>());
  const stripScrollRefs = useRef(new Map<string, HTMLDivElement>());
  const pendingScrollItemIdRef = useRef<string | null>(null);
  const dragHandleActiveRef = useRef<string | null>(null);
  const addButtonRefs = useRef(new Map<string, HTMLButtonElement>());
  const addButtonPositions = useRef(new Map<string, DOMRect>());

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

  const registerAddButtonRef = useCallback(
    (itemId: string) => (node: HTMLButtonElement | null) => {
      if (node) {
        addButtonRefs.current.set(itemId, node);
      } else {
        addButtonRefs.current.delete(itemId);
        addButtonPositions.current.delete(itemId);
      }
    },
    [],
  );

  const reorderItems = useCallback((sourceId: string, targetId: string | null, position: 'before' | 'after') => {
    setOrderedItemIds((previous) => {
      if (sourceId === targetId) {
        return previous;
      }

      const withoutSource = previous.filter((id) => id !== sourceId);

      if (!targetId) {
        return position === 'before' ? [sourceId, ...withoutSource] : [...withoutSource, sourceId];
      }

      const targetIndex = withoutSource.indexOf(targetId);
      if (targetIndex === -1) {
        return withoutSource;
      }

      const next = [...withoutSource];
      const insertIndex = position === 'before' ? targetIndex : targetIndex + 1;
      next.splice(insertIndex, 0, sourceId);
      return next;
    });
  }, []);

  const handleItemDragStart = useCallback(
    (itemId: string) => (event: DragEvent<HTMLButtonElement>) => {
      event.stopPropagation();
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
      setActiveDragId(itemId);
    },
    [],
  );

  const handleStripDragStart = useCallback(
    (itemId: string) => (event: DragEvent<HTMLDivElement>) => {
      if (dragHandleActiveRef.current !== itemId) {
        event.preventDefault();
        return;
      }

      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', itemId);
      event.stopPropagation();
      setActiveDragId(itemId);
    },
    [],
  );

  const handleDragEnd = useCallback(() => {
    setActiveDragId(null);
    dragHandleActiveRef.current = null;
  }, []);

  const handleDropOnListItem = useCallback(
    (targetId: string) => (event: DragEvent<HTMLButtonElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const sourceId = event.dataTransfer.getData('text/plain');
      if (!sourceId) {
        return;
      }

      const targetRect = event.currentTarget.getBoundingClientRect();
      const offset = event.clientY - targetRect.top;
      const position = offset > targetRect.height / 2 ? 'after' : 'before';
      reorderItems(sourceId, targetId, position);
    },
    [reorderItems],
  );

  const handleDropAtListEnd = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const sourceId = event.dataTransfer.getData('text/plain');
      if (!sourceId) {
        return;
      }

      reorderItems(sourceId, null, 'after');
    },
    [reorderItems],
  );

  const handleDropOnStrip = useCallback(
    (targetId: string) => (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      event.stopPropagation();
      const sourceId = event.dataTransfer.getData('text/plain');
      if (!sourceId) {
        return;
      }

      const targetRect = event.currentTarget.getBoundingClientRect();
      const offset = event.clientY - targetRect.top;
      const position = offset > targetRect.height / 2 ? 'after' : 'before';
      reorderItems(sourceId, targetId, position);
    },
    [reorderItems],
  );

  const handleDropAtStripEnd = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      const sourceId = event.dataTransfer.getData('text/plain');
      if (!sourceId) {
        return;
      }

      reorderItems(sourceId, null, 'after');
    },
    [reorderItems],
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
        const frame = await addFrameToItem(project.id, itemId);
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

  const stripLayoutSignature = useMemo(
    () =>
      orderedItems
        .map((item) => `${item.id}:${item.frames.length}`)
        .join('|'),
    [orderedItems],
  );

  useLayoutEffect(() => {
    addButtonRefs.current.forEach((element, key) => {
      const previousRect = addButtonPositions.current.get(key);
      const nextRect = element.getBoundingClientRect();

      if (previousRect) {
        const deltaX = previousRect.left - nextRect.left;
        const deltaY = previousRect.top - nextRect.top;

        if (Math.abs(deltaX) > 1 || Math.abs(deltaY) > 1) {
          element.animate(
            [
              { transform: `translate(${deltaX}px, ${deltaY}px)` },
              { transform: 'translate(0, 0)' },
            ],
            {
              duration: 320,
              easing: 'cubic-bezier(0.33, 1, 0.68, 1)',
            },
          );
        }
      }

      addButtonPositions.current.set(key, nextRect);
    });
  }, [stripLayoutSignature]);

  const asideDynamicClasses = useMemo(
    () =>
      `sticky top-0 self-start flex h-screen flex-shrink-0 flex-col overflow-hidden
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
    <div className="flex min-h-screen w-full items-start bg-background">
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

        <div
          className="mt-3 flex-1 space-y-2 overflow-y-auto pr-1"
          onDragOver={(event) => {
            event.preventDefault();
            event.dataTransfer.dropEffect = 'move';
          }}
          onDrop={handleDropAtListEnd}
        >
          {orderedItems.length === 0 ? (
            <p className="rounded-2xl border border-dashed border-border/70 bg-surface/60 px-3 py-6 text-center text-xs text-text-muted">
              No items yet. Use the action menu to add your first board, card deck, or poster.
            </p>
          ) : (
            orderedItems.map((item) => {
              const isHighlighted = highlightedItemId === item.id;
              const isDragging = activeDragId === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  draggable
                  onDragStart={handleItemDragStart(item.id)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = 'move';
                  }}
                  onDrop={handleDropOnListItem(item.id)}
                  onClick={() => handleItemCardClick(item.id)}
                  className={`group flex w-full flex-col items-start gap-1 rounded-2xl border px-3 py-2.5 text-left text-sm shadow-md shadow-black/10 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                    isHighlighted
                      ? 'border-accent/60 bg-accent/10 text-text-primary'
                      : 'border-border/80 bg-surface/70 text-text-secondary hover:border-accent/50 hover:bg-accent/5 hover:text-text-primary'
                  } ${
                    isDragging ? 'cursor-grabbing opacity-70' : ''
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
              onDragOver={(event) => {
                event.preventDefault();
                event.dataTransfer.dropEffect = 'move';
              }}
              onDrop={handleDropAtStripEnd}
            >
              {orderedItems.map((item) => {
                const isHighlighted = highlightedItemId === item.id;
                const isDragging = activeDragId === item.id;
                return (
                  <div
                    key={item.id}
                    ref={registerStripRef(item.id)}
                    draggable
                    onDragStart={handleStripDragStart(item.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(event) => {
                      event.preventDefault();
                      event.dataTransfer.dropEffect = 'move';
                    }}
                    onDrop={handleDropOnStrip(item.id)}
                    className={`group/strip relative flex flex-col gap-4 rounded-[1.75rem] px-3 py-4 transition-all duration-300 ${
                      isHighlighted
                        ? 'bg-surface-muted/70 shadow-[0_18px_45px_rgba(2,6,23,0.45)] ring-1 ring-accent/40'
                        : 'bg-surface-muted/30 hover:bg-surface-muted/70 hover:shadow-[0_14px_40px_rgba(2,6,23,0.35)]'
                    } ${
                      isDragging ? 'cursor-grabbing opacity-95' : ''
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-4">
                      <div className="flex items-start gap-3">
                        <button
                          type="button"
                          aria-label="Reorder film strip"
                          className="group/handle flex h-9 w-9 items-center justify-center rounded-full text-text-muted transition-colors duration-200 hover:bg-surface/40 hover:text-text-secondary focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
                          onPointerDown={() => {
                            dragHandleActiveRef.current = item.id;
                          }}
                          onPointerUp={() => {
                            dragHandleActiveRef.current = null;
                          }}
                          onPointerLeave={(event) => {
                            if (event.buttons === 0) {
                              dragHandleActiveRef.current = null;
                            }
                          }}
                          onBlur={() => {
                            dragHandleActiveRef.current = null;
                          }}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth="1.5"
                            stroke="currentColor"
                            className="h-5 w-5"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                          </svg>
                        </button>
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
                    </div>

                    <div ref={registerStripScrollRef(item.id)} className="overflow-x-auto pb-2">
                      <div className="flex items-end gap-3 pr-2">
                        {item.frames.map((frame) => {
                          const ratioValue = frame.height > 0 ? frame.width / frame.height : null;
                          const baseSize = 86;
                          const widthPercent = ratioValue !== null && ratioValue < 1 ? baseSize * ratioValue : baseSize;
                          const heightPercent = ratioValue !== null && ratioValue > 1 ? baseSize / ratioValue : baseSize;
                          const visualStyle: CSSProperties = {
                            width: `${widthPercent}%`,
                            height: `${heightPercent}%`,
                            margin: 'auto',
                          };
                          const isRecentFrame = recentFrame?.itemId === item.id && recentFrame.frameId === frame.id;

                          return (
                            <div
                              key={frame.id}
                              className="group/frame relative z-0 flex w-[8rem] flex-shrink-0 flex-col items-center text-center transition-[z-index] duration-200 group-hover/frame:z-20"
                            >
                              <div
                                className={`relative z-10 flex aspect-square w-full items-center justify-center rounded-[1.5rem] bg-surface/70 shadow-[0_16px_38px_rgba(2,6,23,0.55)] transition-transform duration-200 ease-out will-change-transform ${
                                  isRecentFrame ? 'animate-frame-appear' : ''
                                } group-hover/frame:-translate-y-2 group-hover/frame:scale-[1.06] group-hover/frame:-rotate-1 group-hover/frame:z-30`}
                                onAnimationEnd={() => {
                                  if (recentFrame?.itemId === item.id && recentFrame.frameId === frame.id) {
                                    setRecentFrame(null);
                                  }
                                }}
                              >
                                <div className="relative flex h-[86%] w-[86%] items-center justify-center rounded-[1.25rem] border border-white/5 bg-white/10 shadow-[inset_0_0_25px_rgba(2,6,23,0.35)]">
                                  <div
                                    className="rounded-xl bg-white/90 shadow-[inset_0_0_22px_rgba(15,23,42,0.22)]"
                                    style={visualStyle}
                                  />
                                </div>
                              </div>
                            </div>
                          );
                        })}
                        <button
                          ref={registerAddButtonRef(item.id)}
                          type="button"
                          onClick={() => handleAddFrame(item.id)}
                          disabled={pendingFrameItemId === item.id}
                          className={`group/add flex w-[8rem] flex-shrink-0 flex-col items-center gap-2 text-center transition-all duration-200 ease-out focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40 ${
                            pendingFrameItemId === item.id ? 'cursor-wait opacity-70' : 'hover:-translate-y-2 hover:scale-[1.04]'
                          }`}
                        >
                          <div className="flex aspect-square w-full items-center justify-center rounded-[1.5rem] bg-surface/30 text-3xl font-semibold text-text-muted shadow-[0_16px_38px_rgba(2,6,23,0.55)] transition-colors duration-200 group-hover/add:bg-surface/50 group-hover/add:text-accent">
                            +
                          </div>
                          <span className="text-[0.65rem] font-semibold uppercase tracking-[0.3em] text-text-muted transition-colors duration-200 group-hover/add:text-accent">
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
