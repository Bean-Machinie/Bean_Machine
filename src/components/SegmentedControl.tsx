import {
  CSSProperties,
  KeyboardEvent,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { usePrefersReducedMotion } from '../lib/usePrefersReducedMotion';

interface SegmentedControlItem {
  id: string;
  label: string;
  disabled?: boolean;
}

interface SegmentedControlProps {
  items: SegmentedControlItem[];
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  className?: string;
  ariaLabel?: string;
}

const horizontalPadding = 32; // matches px-4 on each segment

/**
 * Accessible segmented control with equal-width segments and a sliding indicator.
 * Provide `items`, `value`, and `onChange` to control the selection.
 */
export default function SegmentedControl({
  items,
  value,
  onChange,
  disabled = false,
  className,
  ariaLabel,
}: SegmentedControlProps) {
  const prefersReducedMotion = usePrefersReducedMotion();
  const [segmentWidth, setSegmentWidth] = useState(0);
  const measurementId = useId();
  const measurementRef = useRef<HTMLDivElement | null>(null);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const labelsKey = useMemo(() => items.map((item) => item.label).join('|'), [items]);

  const recalculateWidth = useCallback(() => {
    const measurementContainer = measurementRef.current;
    if (!measurementContainer) {
      return;
    }

    const spans = Array.from(measurementContainer.querySelectorAll('span[data-segment-measure]')) as HTMLSpanElement[];
    if (spans.length === 0) {
      return;
    }

    const maxLabelWidth = spans.reduce((max, span) => Math.max(max, span.getBoundingClientRect().width), 0);
    setSegmentWidth(Math.ceil(maxLabelWidth) + horizontalPadding);
  }, []);

  useLayoutEffect(() => {
    recalculateWidth();
  }, [recalculateWidth, labelsKey]);

  useEffect(() => {
    if (!measurementRef.current) {
      return undefined;
    }

    recalculateWidth();
    window.addEventListener('resize', recalculateWidth);
    return () => window.removeEventListener('resize', recalculateWidth);
  }, [recalculateWidth, labelsKey]);

  const activeIndex = Math.max(
    0,
    items.findIndex((item) => item.id === value && !item.disabled),
  );

  const moveSelection = useCallback(
    (offset: number) => {
      if (disabled || items.length === 0) {
        return;
      }

      const startIndex = items.findIndex((item) => item.id === value);
      let index = startIndex === -1 ? 0 : startIndex;

      for (let step = 0; step < items.length; step += 1) {
        index = (index + offset + items.length) % items.length;
        const candidate = items[index];
        if (!candidate.disabled) {
          onChange(candidate.id);
          requestAnimationFrame(() => buttonRefs.current[index]?.focus());
          return;
        }
      }
    },
    [disabled, items, onChange, value],
  );

  const selectFirstEnabled = useCallback(() => {
    if (disabled) {
      return;
    }

    const firstIndex = items.findIndex((item) => !item.disabled);
    if (firstIndex !== -1) {
      onChange(items[firstIndex].id);
      requestAnimationFrame(() => buttonRefs.current[firstIndex]?.focus());
    }
  }, [disabled, items, onChange]);

  const selectLastEnabled = useCallback(() => {
    if (disabled) {
      return;
    }

    for (let index = items.length - 1; index >= 0; index -= 1) {
      if (!items[index]?.disabled) {
        onChange(items[index].id);
        requestAnimationFrame(() => buttonRefs.current[index]?.focus());
        break;
      }
    }
  }, [disabled, items, onChange]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
      switch (event.key) {
        case 'ArrowRight':
        case 'ArrowDown':
          event.preventDefault();
          moveSelection(1);
          break;
        case 'ArrowLeft':
        case 'ArrowUp':
          event.preventDefault();
          moveSelection(-1);
          break;
        case 'Home':
          event.preventDefault();
          selectFirstEnabled();
          break;
        case 'End':
          event.preventDefault();
          selectLastEnabled();
          break;
        case ' ': // fall through
        case 'Enter':
          event.preventDefault();
          if (!disabled && !items[index]?.disabled) {
            onChange(items[index].id);
          }
          break;
        default:
      }
    },
    [disabled, items, moveSelection, onChange, selectFirstEnabled, selectLastEnabled],
  );

  const containerClassName =
    'relative inline-flex overflow-hidden rounded-full bg-surface/40 p-1 shadow-inner shadow-black/10';
  const composedClassName = className ? `${containerClassName} ${className}` : containerClassName;
  const translateX = segmentWidth * activeIndex;
  const indicatorDuration = prefersReducedMotion ? 140 : 220;
  const containerStyle: (CSSProperties & { '--segment-width'?: string }) | undefined = segmentWidth
    ? { '--segment-width': `${segmentWidth}px` }
    : undefined;
  const indicatorStyles: CSSProperties = {
    width: segmentWidth ? `${segmentWidth}px` : undefined,
    transform: `translateX(${translateX}px)`,
    transition: prefersReducedMotion
      ? `transform ${indicatorDuration}ms linear`
      : `transform ${indicatorDuration}ms cubic-bezier(0.2, 0.8, 0.2, 1)`,
  };

  return (
    <div
      role="radiogroup"
      aria-label={ariaLabel}
      className={composedClassName}
      data-segmented
      style={containerStyle}
    >
      <span
        className="pointer-events-none absolute inset-y-1 left-1 z-0 rounded-full bg-accent text-transparent"
        style={indicatorStyles}
        aria-hidden
      />
      {items.map((item, index) => {
        const isActive = item.id === value;
        const isDisabled = disabled || item.disabled;
        return (
          <button
            key={item.id}
            ref={(element) => {
              buttonRefs.current[index] = element;
            }}
            role="radio"
            type="button"
            aria-checked={isActive}
            aria-disabled={isDisabled}
            disabled={isDisabled}
            onClick={() => onChange(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`relative z-10 flex h-10 items-center justify-center rounded-full px-4 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent/60 focus-visible:ring-offset-2 focus-visible:ring-offset-surface ${
              isActive ? 'text-accent-contrast' : 'text-text-secondary hover:text-text-primary'
            }`}
            style={{
              width: segmentWidth ? `${segmentWidth}px` : undefined,
            }}
          >
            {item.label}
          </button>
        );
      })}

      <div ref={measurementRef} id={measurementId} className="pointer-events-none absolute left-0 top-0 h-0 overflow-hidden" aria-hidden>
        {items.map((item) => (
          <span key={item.id} data-segment-measure className="inline-block px-0 text-sm font-medium">
            {item.label}
          </span>
        ))}
      </div>
    </div>
  );
}
