import {
  CSSProperties,
  ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type MouseEvent as ReactMouseEvent,
} from 'react';
import { createPortal } from 'react-dom';

import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion';

interface ModalTransitionProps {
  open: boolean;
  onClose: () => void;
  labelledBy: string;
  children: ReactNode;
  overlayClassName?: string;
  panelClassName?: string;
  /**
   * When provided the modal will attempt to focus this element first.
   * Useful for focusing the primary input or close button in a panel.
   */
  initialFocusRef?: React.RefObject<HTMLElement>;
}

type ModalPhase = 'exited' | 'entering' | 'entered' | 'exiting';

const focusableSelector =
  'a[href], area[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * Shared transition + accessibility wrapper for pop-up panels.
 * Wrap any modal content with this component to get consistent animation,
 * focus trapping, ESC/backdrop dismissal, and reduced-motion handling.
 */
export default function ModalTransition({
  open,
  onClose,
  labelledBy,
  children,
  overlayClassName,
  panelClassName,
  initialFocusRef,
}: ModalTransitionProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [phase, setPhase] = useState<ModalPhase>(open ? 'entered' : 'exited');
  const [shouldRender, setShouldRender] = useState<boolean>(open);
  const overlayRef = useRef<HTMLDivElement | null>(null);
  const panelRef = useRef<HTMLDivElement | null>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);

  const panelDuration = prefersReducedMotion ? 150 : 250;
  const overlayDuration = prefersReducedMotion ? 140 : 200;
  const easing = 'cubic-bezier(0.2, 0.8, 0.2, 1)';

  useEffect(() => {
    let animationFrame: number | null = null;
    let enterTimer: number | null = null;
    let exitTimer: number | null = null;

    if (open) {
      setShouldRender(true);

      animationFrame = window.requestAnimationFrame(() => {
        setPhase('entering');
        enterTimer = window.setTimeout(() => {
          setPhase('entered');
        }, panelDuration);
      });

      return () => {
        if (animationFrame !== null) {
          window.cancelAnimationFrame(animationFrame);
        }
        if (enterTimer !== null) {
          window.clearTimeout(enterTimer);
        }
      };
    }

    if (phase === 'exited') {
      return undefined;
    }

    setPhase('exiting');
    exitTimer = window.setTimeout(() => {
      setPhase('exited');
      setShouldRender(false);
    }, panelDuration);

    return () => {
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
      if (exitTimer !== null) {
        window.clearTimeout(exitTimer);
      }
    };
  }, [open, panelDuration, phase]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== 'Tab') {
        return;
      }

      const panel = panelRef.current;
      if (!panel) {
        return;
      }

      const focusableElements = Array.from(panel.querySelectorAll<HTMLElement>(focusableSelector)).filter(
        (element) => !element.hasAttribute('data-modal-focus-guard'),
      );

      if (focusableElements.length === 0) {
        event.preventDefault();
        panel.focus();
        return;
      }

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement as HTMLElement | null;

      if (event.shiftKey) {
        if (activeElement === firstElement || activeElement === panel) {
          event.preventDefault();
          lastElement.focus();
        }
      } else if (activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
      }
    },
    [onClose],
  );

  useEffect(() => {
    if (!shouldRender) {
      return undefined;
    }

    previouslyFocusedElement.current = document.activeElement as HTMLElement | null;

    const panel = panelRef.current;
    const focusTarget = initialFocusRef?.current ?? panel?.querySelector<HTMLElement>(focusableSelector) ?? panel;
    focusTarget?.focus({ preventScroll: true });

    document.addEventListener('keydown', handleKeyDown);
    const { overflow: originalOverflow } = document.body.style;
    document.body.style.overflow = 'hidden';

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;

      const previouslyFocused = previouslyFocusedElement.current;
      if (previouslyFocused && typeof previouslyFocused.focus === 'function') {
        previouslyFocused.focus({ preventScroll: true });
      }
      previouslyFocusedElement.current = null;
    };
  }, [shouldRender, handleKeyDown, initialFocusRef]);

  const panelInlineStyles = useMemo(() => {
    return {
      '--modal-panel-duration': `${panelDuration}ms`,
      '--modal-overlay-duration': `${overlayDuration}ms`,
      '--modal-easing': easing,
    } as CSSProperties;
  }, [overlayDuration, panelDuration, easing]);

  if (!shouldRender) {
    return null;
  }

  const portalTarget = typeof document !== 'undefined' ? document.body : null;
  if (!portalTarget) {
    return null;
  }

  const stateAttribute = phase === 'entered' ? 'entered' : phase === 'entering' ? 'entering' : 'exiting';
  const motionAttribute = prefersReducedMotion ? 'reduced' : 'standard';

  const overlayClasses = overlayClassName ? `modal-overlay ${overlayClassName}` : 'modal-overlay';
  const panelClasses = panelClassName ? `modal-panel ${panelClassName}` : 'modal-panel';

  const handleOverlayClick = (event: ReactMouseEvent<HTMLDivElement>) => {
    if (event.target === overlayRef.current) {
      onClose();
    }
  };

  return createPortal(
    <div
      ref={overlayRef}
      className={overlayClasses}
      data-state={stateAttribute}
      data-motion={motionAttribute}
      style={panelInlineStyles}
      onClick={handleOverlayClick}
    >
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        tabIndex={-1}
        className={panelClasses}
        data-state={stateAttribute}
        data-motion={motionAttribute}
      >
        {children}
      </div>
    </div>,
    portalTarget,
  );
}
