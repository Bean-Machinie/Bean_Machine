import { KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuth } from '../context/AuthContext';
import Avatar from './Avatar';
import { LogoutIcon, MenuChevronIcon, SparkleIcon, UserIcon } from './icons';

interface MenuItem {
  id: string;
  label: string;
  onSelect: () => void | Promise<void>;
  icon: JSX.Element;
  tone?: 'default' | 'danger';
  type?: 'item' | 'separator';
}

/**
 * Accessible profile dropdown menu used in the global topbar. Handles focus
 * management, keyboard navigation, and closing behaviour so callers only need
 * to supply actions for each item.
 */
export default function ProfileMenu() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const [open, setOpen] = useState(false);

  const menuId = 'topbar-profile-menu';
  const buttonId = 'topbar-profile-button';

  const items = useMemo<MenuItem[]>(() => {
    return [
      {
        id: 'profile',
        label: 'User Profile',
        icon: <UserIcon />,
        onSelect: () => {
          navigate('/profile?section=profile');
        },
        tone: 'default',
        type: 'item',
      },
      {
        id: 'appearance',
        label: 'Appearance',
        icon: <SparkleIcon />,
        onSelect: () => {
          navigate('/profile?section=appearance');
        },
        tone: 'default',
        type: 'item',
      },
      { id: 'separator-1', label: 'separator', onSelect: () => {}, icon: <span />, type: 'separator' },
      {
        id: 'sign-out',
        label: 'Sign Out',
        icon: <LogoutIcon />,
        onSelect: async () => {
          await signOut();
          navigate('/');
        },
        tone: 'danger',
        type: 'item',
      },
    ];
  }, [navigate, signOut]);

  const interactiveIndexes = useMemo(
    () => items.map((item, index) => (item.type !== 'separator' ? index : -1)).filter((index) => index >= 0),
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

    const handleKeyDown = (event: KeyboardEvent<Document>) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeMenu();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown as unknown as EventListener);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown as unknown as EventListener);
    };
  }, [open, closeMenu]);

  useEffect(() => {
    if (!open) {
      return;
    }

    if (interactiveIndexes.length > 0) {
      focusItem(interactiveIndexes[0]);
    }
  }, [open, focusItem, interactiveIndexes]);

  useEffect(() => {
    if (!open) {
      itemRefs.current = [];
    }
  }, [open]);

  const handleButtonKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }

      if (interactiveIndexes.length > 0) {
        focusItem(interactiveIndexes[0]);
      }

      return;
    }

    if (event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }

      if (interactiveIndexes.length > 0) {
        focusItem(interactiveIndexes[interactiveIndexes.length - 1]);
      }

      return;
    }

  };

  const handleMenuKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
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

  const handleItemSelect = async (item: MenuItem) => {
    try {
      await item.onSelect();
    } finally {
      closeMenu();
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="relative inline-flex">
      <button
        ref={buttonRef}
        id={buttonId}
        type="button"
        aria-haspopup="menu"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        onKeyDown={handleButtonKeyDown}
        className="inline-flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5 text-sm font-medium text-text-primary shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-background hover:border-accent"
      >
        <Avatar
          src={user.avatarUrl}
          name={user.displayName ?? user.email}
          alt={user.displayName ? `${user.displayName}'s avatar` : 'Account avatar'}
          size={32}
          className="h-8 w-8"
        />
        <MenuChevronIcon className={`transition-transform ${open ? 'rotate-180' : ''}`} />
        <span className="sr-only">Open account menu</span>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="menu"
          id={menuId}
          aria-labelledby={buttonId}
          tabIndex={-1}
          onKeyDown={handleMenuKeyDown}
          className="absolute right-0 top-full mt-2 min-w-[220px] overflow-hidden rounded-xl border border-border/80 bg-surface shadow-lg focus:outline-none"
        >
          {items.map((item, index) => {
            if (item.type === 'separator') {
              return <div key={item.id} className="my-1 h-px bg-border/60" role="none" />;
            }

            const toneClass = item.tone === 'danger' ? 'text-red-500 hover:bg-red-500/10 focus-visible:ring-red-500' : 'text-text-primary hover:bg-surface-muted focus-visible:ring-accent';

            return (
              <button
                key={item.id}
                ref={(node) => {
                  itemRefs.current[index] = node;
                }}
                type="button"
                role="menuitem"
                onClick={() => void handleItemSelect(item)}
                className={`flex w-full items-center gap-3 px-4 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${toneClass}`}
              >
                <span className="flex h-5 w-5 items-center justify-center text-current">{item.icon}</span>
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
