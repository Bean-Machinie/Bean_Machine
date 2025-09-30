import { ReactNode } from 'react';

type IconProps = {
  className?: string;
  strokeWidth?: number;
};

function IconBase({ children, className, strokeWidth = 1.75 }: IconProps & { children: ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className={['h-5 w-5', className].filter(Boolean).join(' ')}
    >
      {children}
    </svg>
  );
}

export function UserIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5.5 19.25c1.8-3.2 4.7-3.2 6.5-3.2s4.7 0 6.5 3.2" />
    </IconBase>
  );
}

export function SparkleIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M12 4.5l1 2.6 2.6 1-2.6 1-1 2.6-1-2.6-2.6-1 2.6-1 1-2.6z" />
      <path d="M6.5 12.5l0.7 1.8 1.8 0.7-1.8 0.7-0.7 1.8-0.7-1.8-1.8-0.7 1.8-0.7 0.7-1.8z" />
      <path d="M17.5 12.5l0.7 1.8 1.8 0.7-1.8 0.7-0.7 1.8-0.7-1.8-1.8-0.7 1.8-0.7 0.7-1.8z" />
    </IconBase>
  );
}

export function LogoutIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M15.5 7.5L20 12l-4.5 4.5" />
      <path d="M20 12H9.5" />
      <path d="M12 5V4a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h5a2 2 0 0 0 2-2v-1" />
    </IconBase>
  );
}

export function MenuChevronIcon(props: IconProps) {
  return (
    <IconBase {...props}>
      <path d="M8.25 10l3.75 4 3.75-4" />
    </IconBase>
  );
}
