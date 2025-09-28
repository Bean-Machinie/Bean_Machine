export type ThemeColorScheme = 'light' | 'dark';

export interface ThemeDefinition {
  id: string;
  label: string;
  colorScheme: ThemeColorScheme;
  tokens: Record<string, string>;
}

export const THEME_PRESETS: ThemeDefinition[] = [
  // --- ChatGPT-like (Light) ---
  {
    id: 'chatgpt-light',
    label: 'ChatGPT Light',
    colorScheme: 'light',
    tokens: {
      '--color-background': '#ffffff',       // main canvas
      '--color-surface': '#f7f7f8',          // panels/sidebar
      '--color-surface-muted': '#f0f2f5',
      '--color-surface-elevated': '#ffffff',
      '--color-border': '#e5e7eb',
      '--color-border-strong': '#cbd5e1',
      '--color-text-primary': '#111418',
      '--color-text-secondary': '#3a3f45',
      '--color-text-muted': '#6b7280',
      '--color-text-inverse': '#ffffff',
      '--color-accent': '#10a37f',           // OpenAI green
      '--color-accent-strong': '#15b893',
      '--color-accent-contrast': '#062e24',  // text on green buttons
      '--color-overlay': '#0b0f14',
      '--color-ring': '#10a37f',
      '--color-highlight': '#d1fae5',
    },
  },

  // --- ChatGPT-like (Dark) ---
  {
    id: 'chatgpt-dark',
    label: 'ChatGPT Dark',
    colorScheme: 'dark',
    tokens: {
      '--color-background': '#0b1412ff',       // deep neutral
      '--color-surface': '#253835ff',          // panels
      '--color-surface-muted': '#181b20',
      '--color-surface-elevated': '#1f232a',
      '--color-border': '#2b3038',
      '--color-border-strong': '#3a404a',
      '--color-text-primary': '#ececf1',
      '--color-text-secondary': '#cfd2d6',
      '--color-text-muted': '#9aa0a6',
      '--color-text-inverse': '#0b0f14',
      '--color-accent': '#10a37f',
      '--color-accent-strong': '#17b394',
      '--color-accent-contrast': '#062e24',
      '--color-overlay': '#000000',
      '--color-ring': '#10a37f',
      '--color-highlight': '#22c7a8',
    },
  },

  // --- Keep: original Velvet Night ---
  {
    id: 'velvet-night',
    label: 'Velvet Night',
    colorScheme: 'dark',
    tokens: {
      '--color-background': '#1b1035',
      '--color-surface': '#2a1b3d',
      '--color-surface-muted': '#3b2e5a',
      '--color-surface-elevated': '#44318d',
      '--color-border': '#5a4aa8',
      '--color-border-strong': '#7a65c7',
      '--color-text-primary': '#ffffff',
      '--color-text-secondary': '#e0def4',
      '--color-text-muted': '#c1badb',
      '--color-text-inverse': '#2a1b3d',
      '--color-accent': '#d83f87',
      '--color-accent-strong': '#e98074',
      '--color-accent-contrast': '#2a1b3d',
      '--color-overlay': '#100828',
      '--color-ring': '#d83f87',
      '--color-highlight': '#e98074',
    },
  },

  // --- Keep: Aurora Green ---
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

  // --- Keep: Oceanic Blue ---
  {
    id: 'oceanic',
    label: 'Oceanic Blue',
    colorScheme: 'dark',
    tokens: {
      '--color-background': '#0a1128',
      '--color-surface': '#001f54',
      '--color-surface-muted': '#034078',
      '--color-surface-elevated': '#1282a2',
      '--color-border': '#256d85',
      '--color-border-strong': '#2e8bc0',
      '--color-text-primary': '#f0faff',
      '--color-text-secondary': '#d1ecf9',
      '--color-text-muted': '#94b8c9',
      '--color-text-inverse': '#001f3f',
      '--color-accent': '#06d6a0',
      '--color-accent-strong': '#1be7c7',
      '--color-accent-contrast': '#002b36',
      '--color-overlay': '#021019',
      '--color-ring': '#06d6a0',
      '--color-highlight': '#1be7c7',
    },
  },

  // --- Keep: Desert Clay (Soft) ---
  {
    id: 'desert-soft',
    label: 'Desert Clay (Soft)',
    colorScheme: 'light',
    tokens: {
      '--color-background': '#f4ede8',
      '--color-surface': '#ece2db',
      '--color-surface-muted': '#e0d0c5',
      '--color-surface-elevated': '#faf7f5',
      '--color-border': '#c8aa94',
      '--color-border-strong': '#a67c68',
      '--color-text-primary': '#3a2f2b',
      '--color-text-secondary': '#52433e',
      '--color-text-muted': '#7a665e',
      '--color-text-inverse': '#ffffff',
      '--color-accent': '#b86d57',
      '--color-accent-strong': '#cc826c',
      '--color-accent-contrast': '#3a2f2b',
      '--color-overlay': '#1d1512',
      '--color-ring': '#b86d57',
      '--color-highlight': '#d89a85',
    },
  },
];



export const DEFAULT_THEME_ID = THEME_PRESETS[0].id;
