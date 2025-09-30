import { forwardRef, type ButtonHTMLAttributes } from 'react';

interface CloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label?: string;
}

const baseClasses =
  'inline-flex h-10 w-10 items-center justify-center rounded-lg text-[#ef4444] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#ef4444] hover:bg-[#fee2e2] active:bg-[#fecaca]';

/**
 * Standard close button for dismissible panels.
 * Use together with {@link ModalTransition} so keyboard + pointer interactions stay consistent.
 */
const CloseButton = forwardRef<HTMLButtonElement, CloseButtonProps>(function CloseButton(
  { label = 'Close panel', className, children, type = 'button', ...buttonProps },
  ref,
) {
  const composedClassName = className ? `${baseClasses} ${className}` : baseClasses;

  return (
    <button ref={ref} type={type} className={composedClassName} aria-label={label} {...buttonProps}>
      {children ?? (
        <svg viewBox="0 0 24 24" className="h-4 w-4" aria-hidden="true">
          <path
            fill="currentColor"
            d="M6.22 6.22a.75.75 0 0 1 1.06 0L12 10.94l4.72-4.72a.75.75 0 1 1 1.06 1.06L13.06 12l4.72 4.72a.75.75 0 1 1-1.06 1.06L12 13.06l-4.72 4.72a.75.75 0 1 1-1.06-1.06L10.94 12 6.22 7.28a.75.75 0 0 1 0-1.06z"
          />
        </svg>
      )}
    </button>
  );
});

export default CloseButton;
