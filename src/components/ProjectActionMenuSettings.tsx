import { KeyboardEvent as ReactKeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { GearIcon, HelpCircleIcon, ProjectSettingsIcon, UpgradePlanIcon } from './icons';

interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void | Promise<void>;
  icon: JSX.Element;
}

interface ProjectActionMenuSettingsProps {
  onOpenProjectSettings: () => void;
  onNavigateHelp: () => void;
  onNavigateUpgrade: () => void;
  collapsed: boolean;
}

export default function ProjectActionMenuSettings({
  onOpenProjectSettings,
  onNavigateHelp,
  onNavigateUpgrade,
  collapsed,
}: ProjectActionMenuSettingsProps) {
  const [open, setOpen] = useState(false);
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const items = useMemo<MenuItem[]>(
    () => [
      {
        id: 'help',
        label: 'Help',
        icon: <HelpCircleIcon className="h-5 w-5" />,
        onSelect: onNavigateHelp,
      },
      {
        id: 'settings',
        label: 'Project Settings',
        icon: <ProjectSettingsIcon className="h-5 w-5" />,
        onSelect: onOpenProjectSettings,
      },
      {
        id: 'upgrade',
        label: 'Upgrade Plan',
        icon: <UpgradePlanIcon className="h-5 w-5" />,
        onSelect: onNavigateUpgrade,
      },
    ],
    [onNavigateHelp, onNavigateUpgrade, onOpenProjectSettings],
  );

  useEffect(() => {
    if (collapsed) {
      setOpen(false);
    }
  }, [collapsed]);

  const interactiveIndexes = useMemo(
    () => items.map((_, index) => index),
    [items],
  );

  const focusItem = useCallback((index: number) => {
    const node = itemRefs.current[index];
    node?.focus();
  }, []);

  const closeMenu = useCallback(() => {
    setOpen(false);
    window.setTimeout(() => {
      buttonRef.current?.focus();
    }, 0);
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current || !buttonRef.current) {
        return;
      }

      if (!menuRef.current.contains(event.target as Node) && !buttonRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeMenu, open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (interactiveIndexes.length > 0) {
      focusItem(interactiveIndexes[0]);
    }
  }, [focusItem, interactiveIndexes, open]);

  const handleButtonKeyDown = (event: ReactKeyboardEvent<HTMLButtonElement>) => {
    if (!open && (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ')) {
      event.preventDefault();
      setOpen(true);
      return;
    }

    if (event.key === 'ArrowUp' && open) {
      event.preventDefault();
      setOpen(false);
      return;
    }
  };

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (interactiveIndexes.length === 0) {
      return;
    }

    const currentIndex = interactiveIndexes.findIndex((itemIndex) => itemRefs.current[itemIndex] === document.activeElement);

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      const nextPosition = currentIndex >= 0 ? (currentIndex + 1) % interactiveIndexes.length : 0;
      focusItem(interactiveIndexes[nextPosition]);
      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      const nextPosition = currentIndex <= 0 ? interactiveIndexes.length - 1 : currentIndex - 1;
      focusItem(interactiveIndexes[nextPosition]);
      return;
    }

    if (event.key === 'Home') {
      event.preventDefault();
      focusItem(interactiveIndexes[0]);
      return;
    }

    if (event.key === 'End') {
      event.preventDefault();
      focusItem(interactiveIndexes[interactiveIndexes.length - 1]);
      return;
    }

    if (event.key === 'Escape') {
      event.preventDefault();
      closeMenu();
    }

    if (event.key === 'Tab') {
      closeMenu();
    }
  };

  const handleSelect = async (item: MenuItem) => {
    try {
      await item.onSelect();
    } finally {
      closeMenu();
    }
  };

  return (
    <div className={`relative ${collapsed ? 'flex justify-center' : 'flex flex-col'}`}>
      <button
        ref={buttonRef}
        id="project-action-menu-settings-button"
        type="button"
        aria-label="Project options"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls="project-action-menu-settings"
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleButtonKeyDown}
        className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-transparent bg-transparent text-text-secondary transition hover:border-border/70 hover:bg-surface/60 hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
      >
        <GearIcon className={`h-6 w-6 transition-transform ${open ? 'rotate-90 text-accent' : ''}`} />
        <span className="sr-only">Project settings</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          id="project-action-menu-settings"
          aria-labelledby="project-action-menu-settings-button"
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className="absolute bottom-full left-0 mb-2 min-w-[220px] overflow-hidden rounded-xl border border-border/80 bg-surface shadow-lg focus:outline-none"
        >
          {items.map((item, index) => (
            <button
              key={item.id}
              ref={(node) => {
                itemRefs.current[index] = node;
              }}
              type="button"
              role="menuitem"
              onClick={() => void handleSelect(item)}
              className="flex w-full items-center gap-3 px-4 py-2 text-sm font-medium text-text-primary transition hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/40"
            >
              <span className="flex h-5 w-5 items-center justify-center text-current">{item.icon}</span>
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
