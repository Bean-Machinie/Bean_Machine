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
export function GearIcon({ strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <IconBase strokeWidth={strokeWidth} {...props}>
      <path d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.325.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 0 1 1.37.49l1.296 2.247a1.125 1.125 0 0 1-.26 1.431l-1.003.827c-.293.241-.438.613-.43.992a7.723 7.723 0 0 1 0 .255c-.008.378.137.75.43.991l1.004.827c.424.35.534.955.26 1.43l-1.298 2.247a1.125 1.125 0 0 1-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.47 6.47 0 0 1-.22.128c-.331.183-.581.495-.644.869l-.213 1.281c-.09.543-.56.94-1.11.94h-2.594c-.55 0-1.019-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 0 1-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 0 1-1.369-.49l-1.297-2.247a1.125 1.125 0 0 1 .26-1.431l1.004-.827c.292-.24.437-.613.43-.991a6.932 6.932 0 0 1 0-.255c.007-.38-.138-.751-.43-.992l-1.004-.827a1.125 1.125 0 0 1-.26-1.43l1.297-2.247a1.125 1.125 0 0 1 1.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.086.22-.128.332-.183.582-.495.644-.869l.214-1.28Z" />
      <path d="M15 12a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z" />
    </IconBase>
  );
}

export function HelpCircleIcon({ strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <IconBase strokeWidth={strokeWidth} {...props}>
      <path d="m11.25 11.25.041-.02a.75.75 0 0 1 1.063.852l-.708 2.836a.75.75 0 0 0 1.063.853l.041-.021" />
      <path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0ZM12 8.25h.008v.008H12z" />
    </IconBase>
  );
}

export function ProjectSettingsIcon({ strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <IconBase strokeWidth={strokeWidth} {...props}>
      <path d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877" />
      <path d="M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766" />
      <path d="M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63" />
      <path d="m15.116 9.547.102-.085c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085" />
      <path d="M13.371 10.984 5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26" />
      <path d="m13.371 10.984-1.745 1.437" />
      <path d="m13.371 10.984 1.745-1.437" />
      <path d="m19.986 19.19-4.236-3.44" />
      <path d="M4.867 19.125h.008v.008h-.008z" />
    </IconBase>
  );
}

export function UpgradePlanIcon({ strokeWidth = 1.5, ...props }: IconProps) {
  return (
    <IconBase strokeWidth={strokeWidth} {...props}>
      <path d="M15.59 14.37a6 6 0 0 1-5.84 7.38v-4.8" />
      <path d="M15.59 14.37a14.98 14.98 0 0 0 6.16-12.12A14.98 14.98 0 0 0 9.631 8.41" />
      <path d="M15.59 14.37a14.926 14.926 0 0 1-5.841 2.58" />
      <path d="M9.749 8.41a6 6 0 0 0-7.381 5.84h4.8" />
      <path d="M7.168 14.25a14.927 14.927 0 0 0-2.58 5.84" />
      <path d="M7.287 16.95c-.103.021-.207.041-.311.06a15.09 15.09 0 0 1-2.448-2.448 14.9 14.9 0 0 1 .06-.312" />
      <path d="M4.387 19.41a4.493 4.493 0 0 0-1.757 4.306 4.493 4.493 0 0 0 4.306-1.758" />
      <path d="M16.5 9a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0Z" />
    </IconBase>
  );
}
