export type ThemeColorScheme = 'light' | 'dark';

export interface ThemeDefinition {
  id: string;
  label: string;
  colorScheme: ThemeColorScheme;
  tokens: Record<string, string>;
}

export const THEME_PRESETS: ThemeDefinition[] = [
  {
    id: 'midnight',
    label: 'Midnight Workshop',
    colorScheme: 'dark',
    tokens: {
      '--color-background': '#020617',
      '--color-surface': '#0f172a',
      '--color-surface-muted': '#111c30',
      '--color-surface-elevated': '#1e293b',
      '--color-border': '#1f2937',
      '--color-border-strong': '#334155',
      '--color-text-primary': '#f8fafc',
      '--color-text-secondary': '#e2e8f0',
      '--color-text-muted': '#94a3b8',
      '--color-text-inverse': '#020617',
      '--color-accent': '#10b981',
      '--color-accent-strong': '#34d399',
      '--color-accent-contrast': '#022c22',
      '--color-overlay': '#020617',
      '--color-ring': '#22c55e',
      '--color-highlight': '#34d399',
    },
  },
  {
    id: 'parchment',
    label: 'Parchment Light',
    colorScheme: 'light',
    tokens: {
      '--color-background': '#fdfaf4',
      '--color-surface': '#f8f1e8',
      '--color-surface-muted': '#f0e6d8',
      '--color-surface-elevated': '#ffffff',
      '--color-border': '#e2d5c3',
      '--color-border-strong': '#d2bda0',
      '--color-text-primary': '#3b2f2f',
      '--color-text-secondary': '#57453f',
      '--color-text-muted': '#87746b',
      '--color-text-inverse': '#ffffff',
      '--color-accent': '#c47f3f',
      '--color-accent-strong': '#de9248',
      '--color-accent-contrast': '#3b2007',
      '--color-overlay': '#1a120c',
      '--color-ring': '#de9248',
      '--color-highlight': '#f3a261',
    },
  },
  {
    id: 'aurora',
    label: 'Aurora Green',
    colorScheme: 'dark',
    tokens: {
      '--color-background': '#041418',
      '--color-surface': '#062026',
      '--color-surface-muted': '#072c35',
      '--color-surface-elevated': '#0c3a44',
      '--color-border': '#0f4a55',
      '--color-border-strong': '#145d6a',
      '--color-text-primary': '#f1fff7',
      '--color-text-secondary': '#cfeee1',
      '--color-text-muted': '#9bcbb7',
      '--color-text-inverse': '#032021',
      '--color-accent': '#4fd1c5',
      '--color-accent-strong': '#5eead4',
      '--color-accent-contrast': '#022c22',
      '--color-overlay': '#011014',
      '--color-ring': '#5eead4',
      '--color-highlight': '#8be9dd',
    },
  },
];

export const DEFAULT_THEME_ID = THEME_PRESETS[0].id;
