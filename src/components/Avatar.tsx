import { CSSProperties } from 'react';

interface AvatarProps {
  src?: string | null;
  alt: string;
  name?: string | null;
  size?: number;
  className?: string;
}

/**
 * Renders a user avatar image with an automatic initials fallback.
 * Keeps sizing/fallback logic in one place so both buttons and profile panels
 * can stay visually consistent.
 */
export default function Avatar({ src, alt, name, size = 40, className }: AvatarProps) {
  const style = { width: size, height: size } as CSSProperties;
  const fallbackInitial = name?.trim()?.[0]?.toUpperCase() ?? alt?.[0]?.toUpperCase() ?? 'U';

  const imageClasses = ['h-full w-full rounded-full object-cover', className].filter(Boolean).join(' ');
  const fallbackClasses = [
    'flex items-center justify-center rounded-full bg-surface-muted text-base font-semibold text-text-primary',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  if (src) {
    return <img src={src} alt={alt} style={style} className={imageClasses} />;
  }

  return (
    <div aria-hidden="true" style={style} className={fallbackClasses}>
      {fallbackInitial}
    </div>
  );
}
